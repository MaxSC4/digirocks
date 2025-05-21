import { describe, it, expect, beforeAll } from 'vitest';
import * as THREE from 'three';
import { performRaycastOnObjects } from '../../src/utils/raycast.js';

describe('raycast utils', () => {
    let camera, meshes;

    beforeAll(() => {
        global.innerWidth = 800;
        global.innerHeight = 600;

        camera = new THREE.PerspectiveCamera(75, 800/600, 0.1, 100);
        camera.position.set(0, 0, 5);
        camera.lookAt(0, 0, 0);

        const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1, 8, 8),
        new THREE.MeshBasicMaterial()
        );
        sphere.position.set(0, 0, 0);

        meshes = [sphere];
    });

    it('intersects a center sphere', () => {
        const event = { clientX: 400, clientY: 300 };
        const intersects = performRaycastOnObjects(event, camera, meshes);
        expect(intersects.length).toBeGreaterThan(0);
        expect(intersects[0].object).toBe(meshes[0]);
    });

    it('returns empty array when no intersection', () => {
        const event = { clientX: 0, clientY: 0 };
        const intersects = performRaycastOnObjects(event, camera, meshes);
        expect(intersects.length).toBe(0);
    });
});
