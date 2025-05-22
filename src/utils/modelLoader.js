import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';

/**
 * Charge un fichier MTL et retourne le matériau.
 * @param {string} path – dossier
 * @param {string} file – nom du .mtl
 * @returns {Promise<THREE.MaterialCreator>}
 */
export function loadMTLAsync(path, file) {
    const loader = new MTLLoader().setPath(path);
    return new Promise((res, rej) => loader.load(file, res, undefined, rej));
}

/**
 * Charge un fichier OBJ avec les matériaux donnés.
 * @param {string} path
 * @param {string} file
 * @param {THREE.MaterialCreator} materials
 * @returns {Promise<THREE.Group>}
 */
export function loadOBJAsync(path, file, materials) {
    const loader = new OBJLoader();
    loader.setMaterials(materials).setPath(path);
    return new Promise((res, rej) => loader.load(file, res, undefined, rej));
}

/**
 * Charge le modèle complet (.mtl + .obj), l'ajoute à la scène et renvoie l'objet.
 * @param {{ path, code, nom }} rock
 * @param {THREE.Scene} scene
 * @returns {Promise<THREE.Object3D>}
 */
export async function loadModel(rock, scene) {
    const mtlName = `${rock.code}-${rock.nom}.mtl`;
    const materials = await loadMTLAsync(rock.path, mtlName);
    materials.preload();

    const objName = `${rock.code}-${rock.nom}.obj`;
    const object = await loadOBJAsync(rock.path, objName, materials);

    if (scene.userData.currentModel) {
        scene.remove(scene.userData.currentModel);
    }
    scene.add(object);
    scene.userData.currentModel = object;

    return object;
}

/**
 * Positionne la caméra autour du modèle et configure controls.
 * @param {THREE.Object3D} model
 * @param {THREE.Camera} camera
 * @param {OrbitControls} controls
 * @param {{ cmPerUnit?: number }} [options]
 */
export function configureCameraForModel(model, camera, controls, scene, { cmPerUnit = 100 } = {}) {
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3(); box.getCenter(center);
    const size = new THREE.Vector3();  box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2.5;

    window.cmPerUnit = cmPerUnit;
    camera.position.set(
        center.x + distance * 0.6,
        center.y + distance * 0.4,
        center.z + distance
    );
    controls.target.copy(center);
    controls.update();

    scene.userData.initialCameraPosition = camera.position.clone();
    scene.userData.initialCameraTarget = center.clone();
}