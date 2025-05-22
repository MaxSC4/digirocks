import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

import { setupToolbarActions } from '../src/utils/toolbar.js';
import { performRaycast, performRaycastOnObjects } from '../src/utils/raycast.js';
import { createMeasurementLine, createPopup } from '../src/utils/measurementUtils.js';
import { computeViewportHeight, computeLengthFromPixels } from '../src/utils/scaleUtils.js';
import { CAMERA_VIEWS, computeCameraPosition } from '../src/utils/viewUtils.js';

import {
    loadJSON,
    createPointAnnotationMesh,
    createZoneAnnotationMesh,
    buildAnnotationPopupHTML,
    projectToScreen,
    attachAnnotationPopup
} from '../src/utils/annotationUtils.js';

import {
    addAreaPoint,
    createAreaMesh,
    calculateSurfaceArea,
    createAreaPopup,
    clearAreaMeasurement as clearAreaUtil
} from '../src/utils/areaUtils.js';

import {
    loadModel,
    configureCameraForModel
} from '../src/utils/modelLoader.js';
import { fetchAndDisplayMetadata } from '../src/utils/metadataUtils.js';

/**
 * 
 * Init 3D scene, camera, renderer, controls, light and axes helper 
 */
function setup3DEnvironment(canvas, {
    antialias = true,
    clearColor = 0xf0f0f0,
    fov = 75,
    near = 0.01,
    far = 1000,
    initialCamPos = new THREE.Vector3(0, 0, 5)
} = {}) {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        fov,
        window.innerWidth / window.innerHeight,
        near,
        far
    );
    camera.position.copy(initialCamPos);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(clearColor);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 1.5;

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(10, 10, 10);
    scene.add(dirLight);

    const axesHelper = new THREE.AxesHelper(2);
    axesHelper.visible = false;
    scene.add(axesHelper);

    return { scene, camera, renderer, controls, axesHelper };
}

function updateActiveAnnotations(activeAnnotations, camera) {
    activeAnnotations.forEach((item) => {
        const newPoint = new THREE.Vector3(
            item.screen.x,
            item.screen.y,
            0.5
        ).unproject(camera);

        item.line.geometry.setFromPoints([
            item.pos,
            newPoint
        ]);

        const screenX = (item.screen.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-item.screen.y * 0.5 + 0.5) * window.innerHeight;

        item.popup.style.left = `${screenX}px`;
        item.popup.style.top = `${screenY}px`
    });
}

export function init3DViewer(canvas) {
    const initialCameraPosition = new THREE.Vector3(0, 0, 5);

    const {
        scene,
        camera,
        renderer,
        controls,
        axesHelper
    } = setup3DEnvironment(canvas, {
        initialCamPos : initialCameraPosition,
        clearColor: getComputedStyle(document.body).getPropertyValue('--canvas-bg').trim()
    });

    const annotationMeshes = [];

    let model;
    let measurePoints = [], measureLine;
    let annotationsVisible = true;

    let measurePoints3D = [];
    let measurePopup = null;

    let areaMesureActive = false;

    let areaPoints = [];
    let areaPointsSphere = [];
    let areaMesh = null;
    let areaPopup = null;

    let isDraggingMouse = false;
    let mouseDownPos = {x: 0, y: 0};

    const activeAnnotations = new Map();


    const loader3D = document.getElementById('loader3D');
    loader3D.style.display = 'block';

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.renderer = renderer;
    renderer.domElement.addEventListener('mousedown', onClickForMeasure);
    renderer.domElement.addEventListener('click', onClickAnnotation);
    renderer.domElement.addEventListener('click', onClickForArea);

    renderer.domElement.addEventListener('mousedown', (e) => {
        mouseDownPos.x = e.clientX;
        mouseDownPos.y = e.clientY;
        isDraggingMouse = false;
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
        const dx = e.clientX - mouseDownPos.x;
        const dy = e.clientY - mouseDownPos.y;
        if (Math.sqrt(dx * dx + dy * dy) > 5){
            isDraggingMouse = true;
        }
    });

    renderer.domElement.addEventListener('mouseup', (e) => {
        const dx = e.clientX - mouseDownPos.x;
        const dy = e.clientY - mouseDownPos.y;
        if (Math.sqrt(dx * dx + dy * dy) > 5){
            isDraggingMouse = true;
        }
    })

    renderer.setClearColor(getComputedStyle(document.body).getPropertyValue('--canvas-bg').trim());


    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        updateScale2D();
        renderer.render(scene, camera);
    }

    animate();

    const toolbar = setupToolbarActions([
        { id: 'resetView',  handler: () => {
            camera.position.copy(scene.userData.initialCameraPosition);
            controls.target.copy(scene.userData.initialCameraTarget);
            controls.update();
        }, toastMsg: "Vue réinitialisée"
        },
        { id: 'zoomIn', handler: () => zoomCamera(-0.2)},
        { id: 'zoomOut', handler: () => zoomCamera(0.2)},
        { id: 'toggleFullscreen', handler: () => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen();
            else document.exitFullscreen();
            }, toggleClass: 'active', toastMsg: "Plein écran"
        },
        { id: 'toggleAutoRotate',   handler: () => controls.autoRotate = !controls.autoRotate, toggleClass: 'active', toastMsg: "Auto-rotation"},
        { id: 'toggleAxes',     handler: () => axesHelper.visible = !axesHelper.visible, toastMsg: "Axes"},
        { id: 'toggleMeasure',  handler: () => {
            measurePoints = [];
            if (measureLine) scene.remove(measureLine), measureLine = null;
            measurePoints3D.forEach(p => scene.remove(p)); measurePoints3D = [];
            if (measurePopup) measurePopup.remove(), measurePopup = null;
            }, toggleClass: 'active', toastMsg: "Mesure" 
        },
        { id: 'captureView',    handler: () => {
            renderer.render(scene, camera);
            const dataURL = renderer.domElement.toDataURL('image/png');
            const nomRoche = window.rocheActuelle?.nom || 'capture';
            const fileName = `${nomRoche}_capture.png`;
            const a = document.createElement('a');
            a.href = dataURL;
            a.download = fileName;
            a.click();
        }, toastMsg: "Capture téléchargée"},
        { id: 'viewTop',    handler: () => setCameraTo(CAMERA_VIEWS.TOP)},
        { id: 'viewFront',  handler: () => setCameraTo(CAMERA_VIEWS.FRONT)},
        { id: 'viewSide',   handler: () => setCameraTo(CAMERA_VIEWS.SIDE)},
        { id: 'toggleAnnotations',  handler: () => {
            annotationsVisible = !annotationsVisible;
            toggleVisibiliteAnnotation(annotationsVisible);
            }, toggleClass: 'active', toastMsg: "Annotations"
        },
        { id: 'metaSidebarToggle',  handler: () => metaSidebar.classList.toggle('open')},
        { id: 'toggleAreaMeasure',  handler: () => {
            areaMesureActive = !areaMesureActive;
            if (!areaMesureActive) clearAreaMeasurement();
            }, toggleClass: 'active'
        }
    ]); 

    function zoomCamera(delta){
        const direction = new THREE.Vector3();
        direction.subVectors(camera.position, controls.target);

        direction.multiplyScalar(1 + delta);

        camera.position.copy(controls.target).add(direction);
        controls.update();
    }

    function onClickForMeasure(event) {
        const measureBtn = document.getElementById('toggleMeasure');
        if (!measureBtn?.classList.contains('active')) return;

        const hit = performRaycast(event, camera, model);
        if (!hit) return;

        const p = hit.point.clone();

        if (measurePoints.length === 0) {
            measurePoints.push(p);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const geo = new THREE.SphereGeometry(0.001, 16, 16);
            const marker = new THREE.Mesh(geo, mat);
            marker.position.copy(p);
            scene.add(marker);
            measurePoints3D.push(marker);
            return;    
        }

        if (measurePoints.length === 1) {
            measurePoints.push(p);
            drawMeasurement(measurePoints[0], measurePoints[1]);
            measurePoints = []; 
            return;
        }
    }

    function drawMeasurement(p1, p2) {
        if (measureLine) scene.remove(measureLine);
        measurePoints3D.forEach(p => scene.remove(p));
        if (measurePopup) measurePopup.remove();

        const { line, points } = createMeasurementLine(p1, p2);
        measureLine = line;
        measurePoints3D = points;

        scene.add(line, ...points);

        const distance = getDistanceCm(p1.distanceTo(p2));
        const text = `${distance.toFixed(1)} cm`;

        const container = document.getElementById('annotationPopupsContainer');

        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        const projected = mid.clone().project(camera);

        const html = `
            <div style="position: relative;">
            <button class="close-anno" style="position:absolute;top:-6px;right:-6px;
                width:24px;height:24px;border:none;color:white;font-size:16px;
                font-weight:bold;cursor:pointer;line-height:1">&times;</button>
            <div>${text}</div>
            </div>
        `;
        measurePopup = createPopup(html, 
            {x: projected.x, y: projected.y}, 
            container);

        measurePopup.querySelector('.close-anno').addEventListener('click', () => {
            scene.remove(measureLine);
            measureLine = null;
            measurePopup.remove();
            measurePopup = null;
            measurePoints3D.forEach(p => scene.remove(p));
            measurePoints3D = [];
        });

        document.getElementById('toggleMeasure')?.classList.remove('active');
    }

    function updateScale2D() {
        const scaleBar = document.getElementById('scaleBar');
        const scaleLabel = document.getElementById('scaleLabel');
        if (!scaleBar || !scaleLabel || !camera || !model) return;

        const PIXEL_LENGTH = 100;
        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const depth = center.distanceTo(camera.position);

        const viewportHeight = computeViewportHeight(camera.fov, depth);
        const distanceInUnits = computeLengthFromPixels(PIXEL_LENGTH, window.innerHeight, viewportHeight);

        let label;
        if (distanceInUnits >= 1) label = `${distanceInUnits.toFixed(2)} m`;
        else if (distanceInUnits >= 0.01) label = `${(distanceInUnits * 100).toFixed(1)} cm`;
        else if (distanceInUnits < 0.001) label = `< 1 mm`;
        else label = `${(distanceInUnits * 1000).toFixed(0)} mm`;

        scaleLabel.textContent = label;
    }

    /**
     * Positionne la caméra sur une vue prédéfinie.
     * @param {string} view – une clé de CAMERA_VIEWS
     */
    function setCameraTo(view) {
        if (!model) return;

        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);
        const distance = Math.max(size.x, size.y, size.z) * 1.05;

        const newPos = computeCameraPosition(view, center, distance);

        camera.position.copy(newPos);
        controls.target.copy(center);
        controls.update();
    }

    async function chargerAnnotations3D(code) {
        const path = `data/annotations/${code}.json`;
        let annotations = [];
        try {
            annotations = await loadJSON(path);
        } catch {
            console.warn(`Pas d'annotations pour ${code}`);
        }
        annotations.forEach(a => {
            if (a.viewer !== '3D') return;
            const mesh = a.type === 'point'
                ? createPointAnnotationMesh(a)
                : createZoneAnnotationMesh(a);
            scene.add(mesh);
            annotationMeshes.push(mesh);
        });
    }

    function onClickAnnotation(event) {
        const intersects = performRaycastOnObjects(event, camera, annotationMeshes);
        if (!intersects.length) return;

        const hit = intersects[0];
        const annotation = hit.object.userData.annotation;
        if (!annotation) return;

        afficherPopupAnnotation(annotation, hit.point);
    }

    function afficherPopupAnnotation(annotation, position3D) { 
        if (activeAnnotations.has(annotation.id)) return;
        const container = document.getElementById('annotationPopupsContainer');
        const html = buildAnnotationPopupHTML(annotation);
        const screenPos = projectToScreen(position3D, camera);
        const { popup, line } = attachAnnotationPopup(
            html, screenPos, container, position3D.clone(), camera, scene
        );

        activeAnnotations.set(annotation.id, {
            popup, line, pos: position3D.clone(), screen: screenPos
        });

        popup.querySelector('.close-anno').addEventListener('click', () => {
            popup.remove();
            scene.remove(line);
            activeAnnotations.delete(annotation.id);
        });
    }

    function toggleVisibiliteAnnotation(visible) {
        scene.traverse(obj => {
            if (obj.userData.annotation) {
                obj.visible = visible;
            }
        });

        document.querySelectorAll('.anno-popup').forEach(p => {
            p.style.display = visible ? 'block' : 'none';
        });

        activeAnnotations.forEach(({line}) => {
            if (line) line.visible = visible;
        });

        const btn = document.getElementById('toggleAnnotations');
        btn.classList.toggle('active', visible);
    }

    function getDistanceCm(distance) {
        return distance * (window.cmPerUnit || 1);
    }

    function onClickForArea(event) {
        if (!areaMesureActive || isDraggingMouse) return;

        const hit = performRaycast(event, camera, model);
        if (!hit) return;

        const pt = hit.point.clone();
        areaPoints.push(pt);

        addAreaPoint(pt, scene, areaPointsSphere);
        updateAreaPolygon();
    }

    function updateAreaPolygon() {
        if (areaMesh) {
            scene.remove(areaMesh);
            areaMesh = null;
        }

        if (areaPopup) {
            areaPopup.remove();
            areaPopup = null;
        }

        if (areaPoints.length < 3) return;
        areaMesh = createAreaMesh(areaPoints);
        scene.add(areaMesh);
        const area = calculateSurfaceArea(areaPoints);
        const container = document.getElementById('annotationPopupsContainer');
        areaPopup = createAreaPopup(area, areaPoints[0], camera, container);

        areaPopup.querySelector('.close-anno')
            .addEventListener('click', () => {
                clearArea();
            });
    }

    function clearArea() {
        clearAreaUtil(areaPointsSphere, areaMesh, areaPopup, scene);
        areaPoints = [];
        areaPointsSphere = [];
        areaMesh = null;
        areaPopup = null;
    }

    document.getElementById('closeMetaSidebar')?.addEventListener('click', () => {
        document.getElementById('metaSidebar')?.classList.remove('open');
    });

    window.chargerModele = async function(rock) {
        loader3D.style.display = 'block';

        try {
            const loadedModel = await loadModel(rock, scene);
            model = loadedModel;
            configureCameraForModel(model, camera, controls, scene, { cmPerUnit: 100 });
            await chargerAnnotations3D(rock.code);
            await fetchAndDisplayMetadata(`${rock.path}/metadata.json`, {
                sidebarEl: document.getElementById('metaSidebar'),
                contentEl: document.getElementById('metaSidebarContent')
            });

            loader3D.style.display = 'none';
            document.getElementById('sampleNameText').textContent = `Échantillon : ${rock.sampleName}`;
            window.rocheActuelle = rock;

        } catch (err) {
            console.error("Erreur chargement modèle :", err);
            loader3D.style.display = 'none';
            alert(`Impossible de charger ce modèle : ${rock.nom}. Contactez un administrateur.`)
        }
    };
};