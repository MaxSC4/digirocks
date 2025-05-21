import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
    buildAnnotationPopupHTML,
    projectToScreen,
    attachAnnotationPopup
} from '../../src/utils/annotationUtils.js';

describe('annotationUtils', () => {
    it('buildAnnotationPopupHTML includes title, text and image', () => {
        const annotation = {
        content: { title: 'T', text: 'Hello', image: 'img.png' }
        };
        const html = buildAnnotationPopupHTML(annotation);
        expect(html).toContain('<h4>T</h4>');
        expect(html).toContain('<p>Hello</p>');
        expect(html).toContain('src="img.png"');
    });

    it('projectToScreen returns {x, y} at center for camera looking at origin', () => {
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
        camera.position.set(0, 0, 5);
        camera.lookAt(0, 0, 0);
        const pos = projectToScreen(new THREE.Vector3(0, 0, 0), camera);
        expect(pos).toEqual({ x: 0, y: 0 });
    });

    it('attachAnnotationPopup appends popup and returns a THREE.Line', () => {
        const container = document.createElement('div');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
        camera.position.set(0, 0, 5);
        camera.lookAt(0, 0, 0);

        const worldPos = new THREE.Vector3(0, 0, 0);
        const screenPos = projectToScreen(worldPos, camera);
        const html = '<button class="close-anno">x</button><p>Hi</p>';

        const { popup, line } = attachAnnotationPopup(
        html, screenPos, container, worldPos, camera, scene
        );

        expect(container.contains(popup)).toBe(true);
        expect(line).toBeInstanceOf(THREE.Line);
    });
});
