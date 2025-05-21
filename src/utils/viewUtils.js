import * as THREE from 'three';

/**
 * Enum des vues prédéfinies.
 */
export const CAMERA_VIEWS = {
    TOP:   'top',
    FRONT: 'front',
    SIDE:  'side'
};

/**
 * Calcule la position de la caméra pour une vue donnée.
 * @param {string} view     – l’une des CAMERA_VIEWS
 * @param {THREE.Vector3} center  – centre du modèle
 * @param {number} distance      – distance souhaitée de la caméra au centre
 * @returns {THREE.Vector3} position à assigner à camera.position
 */
export function computeCameraPosition(view, center, distance) {
    switch (view) {
        case CAMERA_VIEWS.TOP:
            return new THREE.Vector3(center.x, center.y + distance, center.z);
        case CAMERA_VIEWS.FRONT:
            return new THREE.Vector3(center.x, center.y, center.z + distance);
        case CAMERA_VIEWS.SIDE:
            return new THREE.Vector3(center.x + distance, center.y, center.z);
        default:
            throw new Error(`Vue inconnue : ${view}`);
    }
}