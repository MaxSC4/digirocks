import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createMeasurementLine, createPopup } from '../../src/utils/measurementUtils.js';

describe('measurementUtils', () => {
    it('createMeasurementLine returns line and two point meshes at correct positions', () => {
        const p1 = new THREE.Vector3(1, 2, 3);
        const p2 = new THREE.Vector3(4, 5, 6);
        const { line, points } = createMeasurementLine(p1, p2, { sphereRadius: 0.01 });

        expect(points).toHaveLength(2);
        expect(points[0].position.equals(p1)).toBe(true);
        expect(points[1].position.equals(p2)).toBe(true);

        const positions = Array.from(line.geometry.getAttribute('position').array);
        expect(positions).toEqual([
        p1.x, p1.y, p1.z,
        p2.x, p2.y, p2.z
        ]);
    });

    it('createPopup appends to container with correct styles and content', () => {
        const container = document.createElement('div');
        const screenPos = { x: 0, y: 0 };
        const html = '<div>Test</div>';
        const popup = createPopup(html, screenPos, container);

        expect(container.contains(popup)).toBe(true);
        expect(popup.innerHTML).toContain('Test');
        expect(popup.style.position).toBe('absolute');
    });
});
