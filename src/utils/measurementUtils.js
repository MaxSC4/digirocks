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


/**
 * Draws a red marker (circle) on the given SVG <svg> element.
 * @param {SVGSVGElement} svg    – la couche SVG (zoneSvg)
 * @param {{ x: number, y: number }} imgPoint – coordonnées dans le plan image (avant zoom/translate)
 * @param {{ scale: number, translate: { x, y } }} state – état pan/zoom
 * @returns {SVGCircleElement}   – l’élément <circle> ajouté
 */
export function draw2DMarker(svg, imgPoint, state) {
    const { x, y } = imgPoint;
    const cx = x * state.scale + state.translate.x;
    const cy = y * state.scale + state.translate.y;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', '5');
    circle.setAttribute('fill', 'red');
    circle.setAttribute('pointer-events', 'none');
    svg.appendChild(circle);
    return circle;
}

/**
 * Draws or updates a line between two image-points on the SVG layer.
 * @param {SVGSVGElement} svg
 * @param {[number, number]} p1
 * @param {[number, number]} p2
 * @param {{ scale: number, translate: { x, y } }} state
 * @param {SVGLineElement|null} existingLine – element to replace (or null)
 * @returns {SVGLineElement}
 */
export function draw2DLine(svg, p1, p2, state, existingLine = null) {
    if (existingLine) svg.removeChild(existingLine);

    const [x1, y1] = p1, [x2, y2] = p2;
    const x1p = x1 * state.scale + state.translate.x;
    const y1p = y1 * state.scale + state.translate.y;
    const x2p = x2 * state.scale + state.translate.x;
    const y2p = y2 * state.scale + state.translate.y;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1p);
    line.setAttribute('y1', y1p);
    line.setAttribute('x2', x2p);
    line.setAttribute('y2', y2p);
    line.setAttribute('stroke','red');
    line.setAttribute('stroke-width','2');
    line.setAttribute('pointer-events','none');
    svg.appendChild(line);
    return line;
}

/**
 * Creates a DOM popup showing the distance between two image-points.
 * @param {[number, number]} p1
 * @param {[number, number]} p2
 * @param {{ scale: number, translate: { x, y } }} state
 * @param {number} cmPerUnit
 * @param {HTMLElement} container
 * @returns {HTMLElement}
 */
export function show2DMeasurePopup(p1, p2, state, cmPerUnit, container) {
    // Clean old popup
    const old = container.querySelector('.ts-popup[data-2d-measure]');
    if (old) old.remove();

    // distance px → cm
    const dx = (p2[0] - p1[0]);
    const dy = (p2[1] - p1[1]);
    const distUnits = Math.hypot(dx, dy);

    const distCm = distUnits * cmPerUnit;

    const distUm = distCm * 10000;
    let text;
    if (distUm <= 300) {
        text = `${distUm.toFixed(1)} µm`;
    } else {
        const distMm = distUm / 1000;
        text = `${distMm.toFixed(2)} mm`;
    }

    // position midpoint in screen px
    const midX = ((p1[0] + p2[0])/2) * state.scale + state.translate.x;
    const midY = ((p1[1] + p2[1])/2) * state.scale + state.translate.y;

    const popup = document.createElement('div');
    popup.className = 'ts-popup';
    popup.setAttribute('data-2d-measure','');
    popup.innerHTML = `<button class="close-anno">&times;</button><div>${text}</div>`;
    popup.style.position = 'absolute';
    popup.style.left = `${midX}px`;
    popup.style.top  = `${midY}px`;
    container.appendChild(popup);

    return popup;
}

/**
 * Clears all 2D measurement artifacts: markers, line, popup.
 * @param {SVGSVGElement} svg
 * @param {SVGCircleElement[]} markers
 * @param {SVGLineElement|null} line
 * @param {HTMLElement|null} popup
 */
export function clear2DMeasure(svg, markers, line, popup) {
    markers.forEach(c => svg.removeChild(c));
    if (line) svg.removeChild(line);
    if (popup) popup.remove();
}