import { describe, it, expect } from 'vitest';
import {
    setup2DEnvironment
} from '../../src/utils/view2DUtils.js';

describe('view2DUtils', () => {
    let container;

    beforeEach(() => {
        // simulate a container
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should create the correct DOM structure and classes', () => {
        const { viewer, panZoomLayer, img, zoneSvg, annotationLayer, popupLayer } =
        setup2DEnvironment(container, { width: '200px', height: '150px' });

        // viewer
        expect(container.firstChild).toBe(viewer);
        expect(viewer.classList.contains('ts-viewer')).toBe(true);
        expect(viewer.style.width).toBe('200px');
        expect(viewer.style.height).toBe('150px');

        // panZoomLayer
        expect(viewer.querySelector('.ts-panzoom')).toBe(panZoomLayer);

        // image
        expect(panZoomLayer.querySelector('.ts-image')).toBe(img);
        expect(img.tagName).toBe('IMG');

        // SVG zone layer
        expect(panZoomLayer.querySelector('svg.ts-zone-layer')).toBe(zoneSvg);

        // annotation layer inside panZoomLayer
        expect(panZoomLayer.querySelector('.ts-annotation-layer')).toBe(annotationLayer);

        // popup layer inside viewer
        expect(viewer.querySelector('.ts-popup-layer')).toBe(popupLayer);
    });
});
