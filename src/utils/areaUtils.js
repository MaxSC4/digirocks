import { Copy } from 'lucide';
import * as THREE from 'three';
import { materialIOR } from 'three/tsl';

/**
 * Ajoute un point à liste et crée sa sphère visuelle.
 * @param {THREE.Vector3} point3D
 * @param {THREE.Scene} scene
 * @param {THREE.Mesh[]} sphereList – tableau dans lequel on stocke les sphères
 */

export function addAreaPoint(point3D, scene, sphereList) {
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.001, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x00aa00 })
    );
    sphere.position.copy(point3D);
    scene.add(sphere);
    sphereList.push(sphere);
}

/**
 * Construit et retourne un Mesh triangulé pour la surface définie par les points.
 * @param {THREE.Vector3[]} points – en ordre
 * @returns {THREE.Mesh}
 */
export function createAreaMesh(points) {
    const lift = 0.001;
    const verts = [];
    const p0 = points[0];
    for (let i = 1; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        verts.push(p0.x, p0.y + lift, p0.z);
        verts.push(p1.x, p1.y + lift, p1.z);
        verts.push(p2.x, p2.y + lift, p2.z);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geometry.computeVertexNormals();
    const material = new THREE.MeshBasicMaterial({
        color: 0x00aa00,
        opacity: 0.3,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    return new THREE.Mesh(geometry, material);
}

/**
 * Calcule l’aire totale (en unités monde²) d’un polygone en 3D.
 * Triangule en fan à partir du premier point.
 * @param {THREE.Vector3[]} points
 * @returns {number}
 */
export function calculateSurfaceArea(points) {
    if (points.length < 3) return 0;
    let area = 0;
    const p0 = points[0];
    for (let i = 1; i < points.length -1; i++) {
        const v1 = new THREE.Vector3().subVectors(points[i], p0);
        const v2 = new THREE.Vector3().subVectors(points[i + 1], p0);
        area += new THREE.Vector3().crossVectors(v1, v2).length() / 2;
    }

    return area;
}

/**
 * Crée et affiche un popup de surface (cm²) au premier point.
 * @param {number} areaUnits – aire en unités
 * @param {THREE.Vector3} pointRef – point 3D où positionner
 * @param {THREE.Camera} camera
 * @param {HTMLElement} container
 * @returns {HTMLDivElement} popup
 */
export function createAreaPopup(areaUnits, pointRef, camera, container) {
    const cm2 = areaUnits * 10000;
    const html = `
        <button class="close-anno" style="position:absolute;top:4px;right:6px;
        background:none;cursor:pointer;">×</button>
        <p>Surface : ${cm2.toFixed(1)} cm²</p>
    `;

    const proj = pointRef.clone().project(camera);
    const x = (proj.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-proj.y * 0.5 + 0.5) * window.innerHeight;
    const popup = document.createElement('div');
    popup.className = 'anno-popup';
    popup.style.position = 'absolute';
    popup.style.left = `${x}px`;
    popup.style.top  = `${y}px`;

    const content = document.createElement('div');
    content.className = 'anno-popup-content';
    content.innerHTML = html;

    popup.appendChild(content);
    container.appendChild(popup);

    return popup;
}

/**
 * Supprime tous les éléments de la mesure de surface.
 * @param {THREE.Mesh[]} sphereList
 * @param {THREE.Mesh|null} areaMesh
 * @param {HTMLDivElement|null} areaPopup
 * @param {THREE.Scene} scene
 */
export function clearAreaMeasurement(sphereList, areaMesh, areaPopup, scene) {
    sphereList.forEach(s => scene.remove(s));
    if (areaMesh) scene.remove(areaMesh);
    if (areaPopup) areaPopup.remove();
}

