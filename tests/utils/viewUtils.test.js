import { describe, it, expect } from 'vitest';
import { CAMERA_VIEWS, computeCameraPosition } from '../../src/utils/viewUtils.js';
import * as THREE from 'three';

describe('viewUtils', () => {
    const center = new THREE.Vector3(0, 0, 0);
    const dist = 10;

    it('positions camera for TOP view', () => {
        const pos = computeCameraPosition(CAMERA_VIEWS.TOP, center, dist);
        expect(pos).toEqual(new THREE.Vector3(0, 10, 0));
    });

    it('positions camera for FRONT view', () => {
        const pos = computeCameraPosition(CAMERA_VIEWS.FRONT, center, dist);
        expect(pos).toEqual(new THREE.Vector3(0, 0, 10));
    });

    it('positions camera for SIDE view', () => {
        const pos = computeCameraPosition(CAMERA_VIEWS.SIDE, center, dist);
        expect(pos).toEqual(new THREE.Vector3(10, 0, 0));
    });
});
