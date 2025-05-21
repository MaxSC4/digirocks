import { describe, it, expect, vi } from 'vitest';
import { createMagnifier } from '../../src/utils/magnifierUtils.js';

describe('magnifierUtils', () => {
    it('createMagnifier returns canvas and handler', () => {
        // prepare dummy image
        const img = document.createElement('img');
        img.getBoundingClientRect = () => ({ left: 0, top: 0 });
        const state = { scale: 1, translate: { x: 0, y: 0 } };

        const { element, handleMouse } = createMagnifier(img, state, { size: 50, zoomFactor: 3 });
        expect(element.tagName).toBe('CANVAS');
        expect(typeof handleMouse).toBe('function');
    });

    it('handleMouse positions canvas correctly', () => {
        const img = document.createElement('img');
        img.getBoundingClientRect = () => ({ left: 10, top: 20 });
        const state = { scale: 2, translate: { x: 5, y: 5 } };

        const { element, handleMouse } = createMagnifier(img, state, { size: 40, zoomFactor: 2 });
        document.body.appendChild(element);

        // simulate mouse at client coordinates
        const evt = new MouseEvent('mousemove', { clientX: 30, clientY: 50 });
        handleMouse(evt);

        // canvas should move to the event location
        expect(element.style.left).toBe('30px');
        expect(element.style.top).toBe('50px');
    });
});
