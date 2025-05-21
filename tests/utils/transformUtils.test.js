import { describe, it, expect, vi } from 'vitest';
import {
    applyTransform,
    bindPanZoomEvents
} from '../../src/utils/transformUtils.js';

describe('transformUtils', () => {
    it('applyTransform sets correct CSS transform', () => {
        const div = document.createElement('div');
        const state = { scale: 2, translate: { x: 10, y: 20 } };
        applyTransform(div, state);
        expect(div.style.transform).toBe('translate(10px, 20px) scale(2)');
    });

    it('bindPanZoomEvents updates state on wheel', () => {
        const div = document.createElement('div');
        // simulate size so getBoundingClientRect works
        div.getBoundingClientRect = () => ({ left: 0, top: 0 });
        const state = { scale: 1, translate: { x: 0, y: 0 } };
        const callback = vi.fn();
        bindPanZoomEvents(div, state, callback, { minScale: 0.5, maxScale: 3 });

        // simulate wheel event
        const wheelEvent = new WheelEvent('wheel', { deltaY: -100, clientX: 50, clientY: 50 });
        div.dispatchEvent(wheelEvent);

        expect(state.scale).toBeGreaterThan(1);
        expect(callback).toHaveBeenCalled();
    });

    it('bindPanZoomEvents updates state on drag-pan', () => {
        const div = document.createElement('div');
        const state = { scale: 1, translate: { x: 0, y: 0 } };
        const callback = vi.fn();
        bindPanZoomEvents(div, state, callback);

        // mousedown
        const down = new MouseEvent('mousedown', { clientX: 5, clientY: 5 });
        div.dispatchEvent(down);
        // mousemove
        const move = new MouseEvent('mousemove', { clientX: 15, clientY: 25 });
        window.dispatchEvent(move);

        expect(state.translate.x).toBe(10);
        expect(state.translate.y).toBe(20);
        expect(callback).toHaveBeenCalled();
    });
});
