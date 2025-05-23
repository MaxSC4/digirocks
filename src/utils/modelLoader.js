import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OBJLoader }  from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader }  from 'three/examples/jsm/loaders/MTLLoader.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
dracoLoader.setWorkerLimit(4);

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Charge un .glb (draco) et renvoie la scène interne.
 * @param {string} url - URL vers le fichier .glb
 * @returns {Promise<THREE.Object3D>}
 */
export async function loadGLBAsync(url) {
    const gltf = await gltfLoader.loadAsync(url);
    return gltf.scene;
}

/**
 * Fallback : charge OBJ + MTL comme avant.
 */
export async function loadOBJAsync(path, code, name) {
    const mtlLoader = new MTLLoader().setPath(path);
    const materials = await new Promise((res, rej) =>
        mtlLoader.load(`${code}-${name}.mtl`, res, undefined, rej)
    );
    materials.preload();

    const objLoader = new OBJLoader();
    objLoader.setMaterials(materials).setPath(path);
    const object = await new Promise((res, rej) =>
        objLoader.load(`${code}-${name}.obj`, res, undefined, rej)
    );
    return object;
}

/**
 * Charge et insère un modèle dans la scène.  
 * Priorité au GLB compressé, sinon fallback OBJ/MTL.
 * @param {{ path, code, nom }} rock
 * @param {THREE.Scene} scene
 * @returns {Promise<THREE.Object3D>}
 */
export async function loadModel(rock, scene) {
    const glbUrl = `${rock.path}/${rock.code}-${rock.nom}.glb`;
    const useGLB = await urlExists(glbUrl);
    let model;

    if (useGLB) {
        model = await loadGLBAsync(glbUrl);
    } else {
        model = await loadOBJAsync(rock.path, rock.code, rock.nom);
    }

    if (scene.userData.currentModel) {
        disposeHierarchy(scene.userData.currentModel);
        scene.remove(scene.userData.currentModel);
    }

    scene.add(model);
    scene.userData.currentModel = model;

    return model;
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
    model.position.sub(center);
    const size = new THREE.Vector3();  box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2.5;

    window.cmPerUnit = cmPerUnit;
    camera.position.set(
        distance * 0.6,
        distance * 0.4,
        distance
    );
    controls.target.set(0, 0, 0);

    controls.update();

    scene.userData.initialCameraPosition = camera.position.clone();
    scene.userData.initialCameraTarget = new THREE.Vector3(0, 0, 0);
}

async function urlExists(url) {
    try {
        const res = await fetch(url, { method: 'HEAD' });
        return res.ok;
    } catch {
        return false;
    }
}

function disposeHierarchy(root) {
    root.traverse((node) => {
        if (node.isMesh) {
            node.geometry.dispose();
            if (Array.isArray(node.material)) {
                node.material.forEach((m) => m.dispose());
            } else {
                node.material.dispose();
            }
        }
    });
}