import * as THREE from 'three';

/**
 * Renvoie la première intersection entre un clic souris et un objet 3D (ou l’un de ses descendants).
 * @param {MouseEvent}     event  – l’événement souris
 * @param {THREE.Camera}   camera – la caméra de la scène
 * @param {THREE.Object3D} target – l’objet ou groupe à tester (model, scene, etc.)
 * @returns {THREE.Intersection|null}
 */

export function performRaycast(event, camera, target) {
    if (!camera || !target){
        console.warn('performRaycast: missing camera or target', { camera, target });
        return null;
    }
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(target, true);
    return intersects.length > 0 ? intersects[0] : null;
}

/**
 * Lance un raycast sur un tableau de THREE.Object3D et renvoie la liste des intersections triées.
 * @param {MouseEvent} event
 * @param {THREE.Camera} camera
 * @param {THREE.Object3D[]} objects  – liste de meshes/groupes à tester
 * @returns {THREE.Intersection[]} intersections triées par distance
 */
export function performRaycastOnObjects(event, camera, objects) {
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    return raycaster.intersectObjects(objects, true);
}