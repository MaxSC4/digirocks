import * as THREE from 'three';
import { contain } from 'three/src/extras/TextureUtils.js';
import { materialIOR } from 'three/tsl';

/**
 * Crée et retourne un objet { line, points } pour mesurer la distance entre p1 et p2.
 * @param {THREE.Vector3} p1
 * @param {THREE.Vector3} p2
 * @param {Object} styleConfig  – contient { lineColor, lineWidth, sphereColor, sphereRadius }
 * @returns {{ line: THREE.Line, points: THREE.Mesh[] }}
 */

export function createMeasurementLine(p1, p2, {
    lineColor = 0xff0000,
    lineWidth = 3,
    sphereColor = 0xff0000,
    sphereRadius = 0.001
} = {}) {
    // Line
    const geometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
    const material = new THREE.LineBasicMaterial({
        color: lineColor,
        linewidth: lineWidth,
        depthTest: false,
        transparent: true,
        opacity: 0.9
    });
    const line = new THREE.Line(geometry, material);

    // Sphere
    const sphereMat = new THREE.MeshBasicMaterial({ color: sphereColor });
    const sphereGeo = new THREE.SphereGeometry(sphereRadius, 16, 16);
    const pointA = new THREE.Mesh(sphereGeo, sphereMat);
    const pointB = new THREE.Mesh(sphereGeo, sphereMat);
    pointA.position.copy(p1);
    pointB.position.copy(p2);

    return { line, points: [pointA, pointB] };
}

/**
 * Crée un élément DOM de popup d’annotation avec le HTML donné,
 * le positionne à l’écran, et renvoie l’élément.
 * @param {string} innerHtml
 * @param {{ x: number, y: number }} screenPos – coordonnées normalisées [-1,1]
 * @param {HTMLElement} container
 * @returns {HTMLDivElement}
 */
export function createPopup(innerHTML, screenPos, container) {
    const popup = document.createElement('div');
    popup.className = 'anno-popup';
    popup.style.position = 'absolute';
    popup.style.padding = '6px 12px';
    popup.style.background = 'rgba(0,0,0,0.7)';
    popup.style.color = 'white';
    popup.style.borderRadius = '6px';
    popup.style.fontSize = '14px';
    popup.style.minWidth = '80px';
    popup.style.maxWidth = '200px';
    popup.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)';
    popup.innerHTML = innerHTML;

    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;

    container.appendChild(popup);
    return popup;
}
