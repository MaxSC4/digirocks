import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
    calculateSurfaceArea,
    createAreaMesh
} from '../../src/utils/areaUtils.js';

describe('areaUtils', () => {
    it('calculates area of right triangle (0,0),(1,0),(0,1)', () => {
        const pts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0)
        ];
        const area = calculateSurfaceArea(pts);
        expect(area).toBeCloseTo(0.5, 5);
    });

    it('returns 0 for fewer than 3 points', () => {
        expect(calculateSurfaceArea([])).toBe(0);
        expect(calculateSurfaceArea([new THREE.Vector3()])).toBe(0);
    });

    it('createAreaMesh returns a mesh with correct vertex count', () => {
        const pts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(0, 1, 0)
        ];
        const mesh = createAreaMesh(pts);
        expect(mesh).toBeInstanceOf(THREE.Mesh);

        const attr = mesh.geometry.getAttribute('position');
        expect(attr.count).toBe(6);
    });
});
