import { describe, it, expect, beforeEach } from 'vitest';
import { getDomElements } from '../../src/utils/domUtils.js';

describe('domUtils', () => {
    beforeEach(() => {
        document.body.innerHTML = `
        <button id="btn3D"></button>
        <button id="btn2D"></button>
        <canvas id="threeCanvas"></canvas>
        <div id="thinSectionViewer"></div>
        <div id="toolbar"></div>
        <div id="thinSectionUI"></div>
        <div class="toggle-background"></div>
        <div id="rockList"></div>
        <div id="toast"><span id="toastText"></span></div>
        <button id="toggleTheme"><span class="icon"></span><span class="tooltip-text"></span></button>
        `;
    });

    it('getDomElements returns all required elements', () => {
        const {
        btn3D, btn2D, canvas3D, viewer2D,
        toolbar, thinUI, toggleBg, rockListContainer,
        toast, themeToggleBtn, htmlRoot
        } = getDomElements();

        expect(btn3D.id).toBe('btn3D');
        expect(btn2D.id).toBe('btn2D');
        expect(canvas3D.id).toBe('threeCanvas');
        expect(viewer2D.id).toBe('thinSectionViewer');
        expect(toolbar.id).toBe('toolbar');
        expect(thinUI.id).toBe('thinSectionUI');
        expect(toggleBg).not.toBeNull();
        expect(rockListContainer.id).toBe('rockList');
        expect(toast.root.id).toBe('toast');
        expect(toast.text.id).toBe('toastText');
        expect(themeToggleBtn.id).toBe('toggleTheme');
        expect(htmlRoot.tagName).toBe('HTML');
    });
});
