import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

export function init3DViewer(canvas) {
    let scene, camera, renderer, controls;
    let model, axesHelper;
    let measurePoints = [], measureLine;
    let annotationsVisible = true;

    let measurePoints3D = [];
    let measurePopup = null;

    let areaMesureActive = false;
    let areaPoints = [];
    let areaMesh = null;
    let areaPopup = null;
    let areaPointsSphere = [];

    let isDraggingMouse = false;
    let mouseDownPos = {x: 0, y: 0};

    const activeAnnotations = new Map();

    const defaultCamPos = new THREE.Vector3(0, 0, 5);
    let defaultTarget = new THREE.Vector3(0, 0, 0);

    const loader3D = document.getElementById('loader3D');

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
    camera.position.copy(defaultCamPos);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xf0f0f0);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0,0,0);
    controls.autoRotate = false;
    controls.enableDamping = true;
    controls.autoRotateSpeed = 1.5;

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const light = new THREE.DirectionalLight(0xffffff, 0.6);
    light.position.set(10, 10, 10);
    scene.add(light);

    axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);
    axesHelper.visible = false;

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

    bindToolbar();
    animate();

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        updateScale2D();
        renderer.render(scene, camera);

        activeAnnotations.forEach((item, id) => {
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
            item.popup.style.top = `${screenY}px`;
        });

    }

    function bindToolbar() {
        const resetBtn = document.getElementById('resetView');
        const zoomInBtn = document.getElementById('zoomIn');
        const zoomOutBtn = document.getElementById('zoomOut');
        const fullscreenBtn = document.getElementById('toggleFullscreen');
        const autoRotateBtn = document.getElementById('toggleAutoRotate');
        const axesBtn = document.getElementById('toggleAxes');
        const measureBtn = document.getElementById('toggleMeasure');
        const captureBtn = document.getElementById('captureView');
        const topBtn = document.getElementById('viewTop');
        const frontBtn = document.getElementById('viewFront');
        const sideBtn = document.getElementById('viewSide');
        const annotationBtn = document.getElementById('toggleAnnotations');
        const metaToggle = document.getElementById('metaSidebarToggle');
        const metaSidebar = document.getElementById('metaSidebar');
        const areaBtn = document.getElementById('toggleAreaMeasure');

        resetBtn?.addEventListener('click', () => {
            camera.position.copy(defaultCamPos);
            controls.target.copy(defaultTarget);
            controls.update();
            showToast("Vue réinitialisée");
        });

        zoomInBtn?.addEventListener('click', () => {
            zoomCamera(-0.2);
        }); 

        zoomOutBtn?.addEventListener('click', () => {
            zoomCamera(0.2);
        });

        fullscreenBtn?.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
                showToast("Plein écran activé");
            } else {
                document.exitFullscreen();
                showToast("Plein écran désactivé");
            }
        });

        autoRotateBtn?.addEventListener('click', () => {
            controls.autoRotate = !controls.autoRotate;
            autoRotateBtn.classList.toggle('active', controls.autoRotate);
            showToast("Auto-rotation activée");
        });

        axesBtn?.addEventListener('click', () => {
            if (axesHelper.visible) {
                showToast("Axes désactivés");
            } else {
                showToast("Axes activés");
            } 
            
            axesHelper.visible = !axesHelper.visible;
        });

        measureBtn?.addEventListener('click', () => {
            measurePoints = [];
            if (measureLine) {
                scene.remove(measureLine);
                measureLine = null;
            }

            measurePoints3D.forEach(p => scene.remove(p));
            measurePoints3D = [];

            if (measurePopup) {
                measurePopup.remove();
                measurePopup = null;
            }

            measureBtn.classList.toggle('active');
            showToast("Mesure activée");

        });

        captureBtn?.addEventListener('click', () => {
            renderer.render(scene, camera);

            const dataURL = renderer.domElement.toDataURL('image/png');

            const nomRoche = window.rocheActuelle?.nom || 'capture';
            const fileName = `${nomRoche}_capture.png`;

            const a = document.createElement('a');
            a.href = dataURL;
            a.download = fileName;
            a.click();

            showToast("Capture téléchargée");

        });

        topBtn?.addEventListener('click', () => setCameraTo('top'));
        frontBtn?.addEventListener('click', () => setCameraTo('front'));
        sideBtn?.addEventListener('click', () => setCameraTo('side'));

        annotationBtn?.addEventListener('click', () => {
            if (annotationsVisible){
                showToast("Annotations masquées");
            } else {
                showToast("Annotations visibles");
            }
            annotationsVisible = !annotationsVisible;
            toggleVisibiliteAnnotation(annotationsVisible);
        })

        metaToggle?.addEventListener('click', () => {
            metaSidebar.classList.toggle('open');
        })

        areaBtn?.addEventListener('click', () => {
            areaMesureActive = !areaMesureActive;
            areaBtn.classList.toggle('active', areaMesureActive);

            if (!areaMesureActive){
                clearAreaMeasurement();
            }
        });
    }

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

        const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(model, true);

        if (intersects.length > 0) {
        measurePoints.push(intersects[0].point.clone());

            if (measurePoints.length === 2) {
                drawMeasurement(measurePoints[0], measurePoints[1]);
                measurePoints = [];
            }
        }
    }

    function drawMeasurement(p1, p2) {
        if (measureLine) {
            scene.remove(measureLine);
            measureLine = null;
        }

        measurePoints3D.forEach(p => scene.remove(p));
        measurePoints3D = [];

        if (measurePopup) {
            measurePopup.remove();
            measurePopup = null;
        }

        const geometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const material = new THREE.LineBasicMaterial({ 
            color: 0xff0000,
            linewidth: 3,
            depthTest: false,
            transparent: true,
            opacity: 0.9 
        });

        measureLine = new THREE.Line(geometry, material);

        const sphereMat = new THREE.MeshBasicMaterial({color : 0xff0000});
        const sphereGeo = new THREE.SphereGeometry(0.001, 16, 16);

        const pointA = new THREE.Mesh(sphereGeo, sphereMat);
        const pointB = new THREE.Mesh(sphereGeo, sphereMat);

        pointA.position.copy(p1);
        pointB.position.copy(p2);

        measurePoints3D = [pointA, pointB];

        scene.add(pointA, pointB);
        scene.add(measureLine);

        const distance = getDistanceCm(p1.distanceTo(p2));
        const distanceText = `${distance.toFixed(1)} cm`;

        const container = document.getElementById('annotationPopupsContainer');
        const popup = document.createElement('div');
        popup.className = 'anno-popup';
        popup.style.position = 'absolute';
        popup.style.padding = '6px 12px 6px 12px';
        popup.style.background = 'rgba(0, 0, 0, 0.7)';
        popup.style.color = 'white';
        popup.style.borderRadius = '6px';
        popup.style.fontSize = '14px';
        popup.style.minWidth = '80px';
        popup.style.maxWidth = '200px';
        popup.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)';

        popup.innerHTML = `
        <div style="position: relative;">
            <button class="close-anno" style="
            position: absolute;
            top: -6px;
            right: -6px;
            width: 24px;
            height: 24px;
            border: none;
            color: white;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            line-height: 1;
            ">&times;</button>
            <div>${distanceText}</div>
        </div>
        `;

        container.appendChild(popup);
        measurePopup = popup;

        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        const screen = mid.clone().project(camera);
        const x = (screen.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-screen.y * 0.5 + 0.5) * window.innerHeight;

        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;

        popup.querySelector('.close-anno').addEventListener('click', () => {
            scene.remove(measureLine);
            measureLine = null;
            popup.remove();
            measurePopup = null;
            measurePoints3D.forEach(p => scene.remove(p));
            measurePoints3D = [];
        });

        const measureBtn = document.getElementById('toggleMeasure');
        measureBtn?.classList.remove('active');
    }

    function updateScale2D() {
        const scaleE1 = document.getElementById('scaleBar');
        const labelE1 = document.getElementById('scaleLabel');
        if (!scaleE1 || !labelE1 || !camera || !model) return;

        const pixelLength = 100;

        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const depth = center.distanceTo(camera.position);

        const fov = THREE.MathUtils.degToRad(camera.fov);
        const viewportHeightAtDepth = 2 * Math.tan(fov / 2) * depth;

        const pixelsPerUnit = window.innerHeight / viewportHeightAtDepth;
        const distance = pixelLength / pixelsPerUnit;

        let label = '';
        if (distance >= 1) {
            label = `${distance.toFixed(2)} m`;
        } else if (distance >= 0.01) {
            label = `${(distance * 100).toFixed(1)} cm`;
        } else if (distance < 0.001) { 
            label = '< 1 mm';
        } else {
            label = `${(distance * 1000).toFixed(0)} mm`;
        }

        labelE1.textContent = label;
    }

    function setCameraTo(view) {
        if (!model) return;

        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);
        const distance = Math.max(size.x, size.y, size.z) * 1.05;

        let position = new THREE.Vector3();

        switch (view) {
            case 'top':
                position.set(center.x, center.y + distance, center.z); break;
            case 'front':
                position.set(center.x, center.y, center.z + distance); break;
            case 'side':
                position.set(center.x + distance, center.y, center.z); break;
            default:
                return;
        }

        camera.position.copy(position);
        controls.target.copy(center);
        controls.update();
    }

    async function chargerAnnotations3D(code) {
        const path = `/data/annotations/${code}.json`;

        try {
            const res = await fetch(path);
            const annotations = await res.json();

            annotations
                .forEach(a => {
                    if (a.viewer !== '3D') return;

                    if (a.type === 'point') afficherPointAnnotation(a);
                    if (a.type === 'zone') afficherZoneAnnotation(a);
                });
        } catch (err) {
            console.warn(`Pas d'annotations pour ${code}`, err);
        }
    }

    function afficherPointAnnotation(annotation) {
        const geometry = new THREE.SphereGeometry(0.005, 16, 16);
        const material = new THREE.MeshBasicMaterial({color: 0xff0000});
        const sphere = new THREE.Mesh(geometry, material);

        sphere.position.set(...annotation.position);
        sphere.name = `annotation-${annotation.id}`;
        sphere.userData.annotation = annotation;

        scene.add(sphere);
    }

    function afficherZoneAnnotation(annotation) {
        const shape = new THREE.Shape();
        const pts = annotation.points.map(p => new THREE.Vector3(p[0], p[2]));

        pts.forEach((pt, i) => {
            if (i === 0) shape.moveTo(pt.x, pt.y);
            else shape.lineTo(pt.x, pt.y);
        });

        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff8800,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const mesh = new THREE.Mesh(geometry, material);
        const y = annotation.points[0][1];
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = y;

        mesh.userData.annotation = annotation;
        scene.add(mesh);
    }

    function onClickAnnotation(event) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        const hit = intersects.find(i => i.object.userData.annotation);
        if (hit) {
            const annotation = hit.object.userData.annotation;
            afficherPopupAnnotation(annotation, hit.point);
        }
    }

    function afficherPopupAnnotation(annotation, position3D) { 
        if (activeAnnotations.has(annotation.id)) return;

        const container = document.getElementById('annotationPopupsContainer');

        const popup = document.createElement('div');
        popup.className = 'anno-popup';

        const content = document.createElement('div');
        content.className = 'anno-popup-content';

        const {title, text, image} = annotation.content;
        content.innerHTML = `
            <button class="close-anno">&times;</button>
            ${title ?  `<h4>${title}</h4` : ''}
            ${text ? `<p>^${text}</p>` : ''}
            ${image ? `<img src="${image}" style="max-width:100%; border-radius:6px;" />`: ''}
        `;

        popup.appendChild(content);
        container.appendChild(popup);

        const projected = position3D.clone().project(camera);
        const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;

        popup.style.left = `${x}px`
        popup.style.top = `${y}px`
        popup.style.position = 'absolute';
        popup.style.display = 'block';

        const unprojectedScreen = new THREE.Vector3(projected.x, projected.y, 0.5).unproject(camera);
        const points = [position3D, unprojectedScreen];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({color: 0x000000});
        const line = new THREE.Line(geometry, material);
        scene.add(line);

        activeAnnotations.set(annotation.id, {
            popup, line,
            pos: position3D.clone(),
            screen: projected.clone()
        });

        content.querySelector('.close-anno').addEventListener('click', () => {
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

        const mouse = new THREE.Vector3(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 +1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(model, true);

        if (intersects.length > 0){
            const point = intersects[0].point.clone();
            areaPoints.push(point);

            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.001, 8, 8),
                new THREE.MeshBasicMaterial({color: 0x00aa00})
            );

            sphere.position.copy(point);
            scene.add(sphere);
            areaPointsSphere.push(sphere);

            updateAreaPolygon();
        }
    }

    function updateAreaPolygon() {
        if (areaMesh){
            scene.remove(areaMesh);
            areaMesh = null;
        }

        if (areaPoints.length >= 3) {
            const vertices = [];
            const normal = new THREE.Vector3(0, 1, 0);

            const p0 = areaPoints[0];

            for(let i = 1; i < areaPoints.length - 1; i++){
                const p1 = areaPoints[i];
                const p2 = areaPoints[i + 1];

                const lift = 0.001;

                vertices.push(p0.x, p0.y + lift, p0.z);
                vertices.push(p1.x, p1.y + lift, p1.z);
                vertices.push(p2.x, p2.y + lift, p2.z);
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.computeVertexNormals();

            const material = new THREE.MeshBasicMaterial({
                color: 0x00aa00,
                opacity: 0.3,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false
            });

            areaMesh = new THREE.Mesh(geometry, material);
            scene.add(areaMesh);

            const area = calculerAireSurface3D(areaPoints);
            afficherSurfacePopup(area);
        }

    }

    function calculerAireSurface3D(points) {
        if (points.length < 3) return 0;
        
        let totalArea = 0;

        const p0 = points[0];
        for (let i = 1; i < points.length - 1; i++){
            const a = points[i];
            const b = points[i + 1];

            const v1 = new THREE.Vector3().subVectors(a, p0);
            const v2 = new THREE.Vector3().subVectors(b, p0);

            const cross = new THREE.Vector3().crossVectors(v1, v2);
            const triangleArea = cross.length() / 2;

            totalArea += triangleArea;
        }

        return totalArea;
    }

    function afficherSurfacePopup(areaUnits) {
        if (areaPopup) areaPopup.remove();

        const container = document.getElementById('annotationPopupsContainer');
        areaPopup = document.createElement('div');
        areaPopup.className = 'anno-popup';

        const cm2 = areaUnits * 10000;

        const content = document.createElement('div');
        content.className = 'anno-popup-content';
        content.innerHTML = `
            <button class="close-anno"¨style="position: absolute; top:4px; right:6px; background:none; cursor:pointer;">x</button>
            <p> Surface : ${cm2.toFixed(1)} cm²</p>
        `;

        areaPopup.appendChild(content);


        const screenPos = areaPoints[0].clone().project(camera);
        const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

        areaPopup.style.position = 'absolute';
        areaPopup.style.left = `${x}px`;
        areaPopup.style.top = `${y}px`;

        container.appendChild(areaPopup);

        const closeBtn = areaPopup.querySelector('.close-anno');
        closeBtn.addEventListener('click', () => {
            clearAreaMeasurement();
        })
    }

    function clearAreaMeasurement() {
        areaPoints = [];
        if (areaMesh) {
            scene.remove(areaMesh);
            areaMesh = null;
        }

        if (areaPointsSphere) {
            areaPointsSphere.forEach(s => {
                scene.remove(s);
            });
            areaPointsSphere = [];
        }


        if (areaPopup) {
            areaPopup.remove();
            areaPopup = null;
        }
    }

    function afficherMetadata(metadata) {
        console.log(metadata.meta);
        const sidebar = document.getElementById('metaSidebar');
        const content = document.getElementById('metaSidebarContent');
        if (!sidebar || !content){
            console.warn("Sidebar introuvable dans le DOM")
            return;
        }

        const meta = metadata.meta;
        console.log('[Metadata]', metadata);
        if (!meta) {
            content.innerHTML = "<p style='padding:1rem;'>Aucune métadonnée disponible.</p>";
            return;
        }

        Object.entries(meta).forEach(([KeyboardEvent, data]) => {
            const { title, icon, content: value } = data;

            const section = document.createElement('div');
            section.className = 'meta-section';

            const header = document.createElement('h4');
            header.innerHTML = `
                ${icon ? `<i data-lucide="${icon}" class="icon"></i>` : ''}
                ${title || key}
            `;
            section.appendChild(header);

            const body = document.createElement('div');
            if (typeof value === 'string' && value.trim().startsWith('<')) {
                body.innerHTML = value;
            } else {
                body.textContent = value;
            }

            section.appendChild(body);
            content.appendChild(section);
        });

        sidebar.classList.add('open');

        lucide?.createIcons();
    }

    document.getElementById('closeMetaSidebar')?.addEventListener('click', () => {
        document.getElementById('metaSidebar')?.classList.remove('open');
    });

    function loadMTL(loader, path, file) {
        return new Promise((resolve, reject) => {
            loader.setPath(path);
            loader.load(file, resolve, undefined, reject);
        });
    }

    function loadOBJ(loader, path, file, materials) {
        return new Promise((resolve, reject) => {
            loader.setMaterials(materials);
            loader.setPath(path);
            loader.load(file, resolve, undefined, reject);
        });
    }

    window.chargerModele = async function(rock) {
        loader3D.style.display = 'block';

        const objLoader = new OBJLoader();
        const mtlLoader = new MTLLoader();

        console.log(rock.path);
        console.log(`${rock.code}-${rock.nom}.obj`);

        try {
            const materials = await loadMTL(mtlLoader, rock.path, `${rock.code}-${rock.nom}.mtl`);
            materials.preload();

            const object = await loadOBJ(objLoader, rock.path, `${rock.code}-${rock.nom}.obj`, materials);

            if (model) scene.remove(model);
            model = object;
            scene.add(model);

            const box = new THREE.Box3().setFromObject(model);
            const center = new THREE.Vector3();
            box.getCenter(center);
            const size = new THREE.Vector3();
            box.getSize(size);

            axesHelper.position.copy(center);

            const maxDim = Math.max(size.x, size.y, size.z);
            const distance = maxDim * 2.5;

            window.cmPerUnit = 100;

            camera.position.set(
                center.x + distance * 0.6, 
                center.y + distance * 0.4, 
                center.z + distance
            );
            
            camera.updateProjectionMatrix();
            controls.target.copy(center);
            defaultCamPos.copy(camera.position);

            defaultTarget.copy(center);

            controls.update();

            chargerAnnotations3D(rock.code);


            loader3D.style.display = 'none';
            const label = document.getElementById('sampleNameText');
            if (label) label.textContent = `Échantillon : ${rock.sampleName}`;

            console.log('chargement');
            fetch(`${rock.path}/metadata.json`)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    console.log(data);
                    afficherMetadata(data);
                })
                .catch(err => console.warn("Pas de métadonnées trouvées pour", rock.nom, err));

            window.rocheActuelle = rock;
        } catch (err) {
            console.error("Erreur lors du chargement du modèle :", err);
            loader3D.style.display = 'none';

            alert(`Impossible de charger ce modèle : ${rock.nom}. Contactez un administrateur.`)
        }
    };
};