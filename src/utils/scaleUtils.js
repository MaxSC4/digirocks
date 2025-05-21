import * as THREE from 'three';

/**
 * Calcule la hauteur (en unités monde) du plan de vision à une distance donnée.
 * @param {number} fovDeg    – field-of-view vertical en degrés
 * @param {number} depth     – distance de la caméra au plan
 * @returns {number} hauteur du viewport en unités monde
 */
export function computeViewportHeight(fovDeg, depth) {
    const fovRad = THREE.MathUtils.degToRad(fovDeg);
    return 2 * Math.tan(fovRad / 2) * depth;
}

/**
 * Convertit une longueur en pixels en longueur monde (unités)
 * @param {number} pixelLength      – longueur en pixels
 * @param {number} screenHeightPx   – hauteur de l’écran en pixels
 * @param {number} viewportHeight   – hauteur du viewport en unités monde
 * @returns {number} longueur en unités monde
 */
export function computeLengthFromPixels(pixelLength, screenHeightPx, viewportHeight){
    return pixelLength / (screenHeightPx / viewportHeight);
}