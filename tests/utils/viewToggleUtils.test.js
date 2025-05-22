import { describe, it, expect, vi } from 'vitest';
import { show3DView, show2DView, showSelectModelAlert } from '../../src/utils/viewToggleUtils.js';

describe('viewToggleUtils', () => {
    const dom = {};
    beforeEach(() => {
        dom.canvas3D = document.createElement('div');
        dom.viewer2D = document.createElement('div');
        dom.btn3D    = document.createElement('button');
        dom.btn2D    = document.createElement('button');
        dom.thinUI   = document.createElement('div');
        dom.toolbar  = document.createElement('div');
        dom.toggleBg = document.createElement('div');
    });

    it('show3DView toggles classes/styles correctly', () => {
        show3DView(dom);
        expect(dom.canvas3D.classList.contains('active')).toBe(true);
        expect(dom.toolbar.style.display).toBe('flex');
    });

    it('show2DView toggles classes/styles correctly', () => {
        show2DView(dom);
        expect(dom.viewer2D.classList.contains('active')).toBe(true);
        expect(dom.toolbar.style.display).toBe('none');
    });

    it('showSelectModelAlert calls alert', () => {
        const spy = vi.spyOn(window, 'alert').mockImplementation(()=>{});
        showSelectModelAlert();
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});
