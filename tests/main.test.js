import { describe, it, beforeEach, expect, vi } from 'vitest';

// ——— Top‐level mocks (no external vars) ———————————————————————————
vi.mock('lucide', () => ({
    createIcons: vi.fn(),
    icons: {}
}));

vi.mock('../src/utils/domUtils.js', () => ({
    getDomElements: () => ({
        btn3D: document.getElementById('btn3D'),
        btn2D: document.getElementById('btn2D'),
        canvas3D: document.getElementById('threeCanvas'),
        viewer2D: document.getElementById('thinSectionViewer'),
        toolbar: document.getElementById('toolbar'),
        thinUI: document.getElementById('thinSectionUI'),
        toggleBg: document.querySelector('.toggle-background'),
        rockListContainer: document.getElementById('rockList'),
        toast: {
        root: document.getElementById('toast'),
        text: document.getElementById('toastText')
        },
        themeToggleBtn: document.getElementById('toggleTheme'),
        htmlRoot: document.documentElement
    })
}));

vi.mock('../src/utils/initUtils.js', () => ({
    bindInitialLoad: vi.fn(({ onDomReady, onLoad }) => {
        onDomReady();
        onLoad();
    })
}));

vi.mock('../src/utils/rockListUtils.js', () => ({
    renderRockList: vi.fn()
}));

vi.mock('../src/utils/viewToggleUtils.js', () => ({
    show3DView: vi.fn(),
    show2DView: vi.fn(),
    showSelectModelAlert: vi.fn()
}));

vi.mock('../src/utils/themeUtils.js', () => ({
    bindThemeToggle: vi.fn()
}));

vi.mock('../src/utils/toastUtils.js', () => ({
    showToast: vi.fn()
}));

vi.mock('../src/viewer3d.js', () => ({
    init3DViewer: vi.fn()
}));

vi.mock('../src/thinsection.js', () => ({
    init2DViewer: vi.fn()
}));

vi.mock('../src/rockParser.js', () => ({
    loadRockDatabase: vi.fn(() =>
        Promise.resolve([{ origine: 'Magmatique', nom: 'R1' }])
    )
}));

// ——— Imports under test (mocks applied) ———————————————————————
import { bindInitialLoad } from '../src/utils/initUtils.js';
import { createIcons }     from 'lucide';
import {
    show3DView,
    show2DView,
    showSelectModelAlert
} from '../src/utils/viewToggleUtils.js';
import { init3DViewer }    from '../src/viewer3d.js';
import { loadRockDatabase }from '../src/rockParser.js';
import { renderRockList }  from '../src/utils/rockListUtils.js';
import { bindThemeToggle } from '../src/utils/themeUtils.js';
import { showToast }       from '../src/utils/toastUtils.js';

describe('main.js orchestration', () => {
    beforeEach(async () => {
        // 1) reset module cache so main.js re-executes with fresh mocks
        vi.resetModules();

        // 2) set up a minimal DOM
        document.body.innerHTML = `
        <button id="btn3D"></button>
        <button id="btn2D"></button>
        <canvas id="threeCanvas"></canvas>
        <div id="thinSectionViewer"></div>
        <div id="toolbar"></div>
        <div id="thinSectionUI"></div>
        <div class="toggle-background"></div>
        <div id="rockList"></div>
        <div id="loader3D"></div>
        <div id="toast"><span id="toastText"></span></div>
        <button id="toggleTheme">
            <span class="icon"></span>
            <span class="tooltip-text"></span>
        </button>
        `;
        // 3) ensure a model is selected by default
        window.rocheActuelle = { origine: 'Magmatique', nom: 'R1' };

        // 4) import the module under test
        await import('../src/main.js');
    });

    it('binds initial load and creates icons & 3D view', () => {
        expect(bindInitialLoad).toHaveBeenCalled();
        expect(createIcons).toHaveBeenCalledWith({ icons: {} });
        expect(show3DView).toHaveBeenCalled();
    });

    it('handles 3D button click correctly', async () => {
        document.getElementById('btn3D').click();
        expect(show3DView).toHaveBeenCalled();
        expect(init3DViewer).toHaveBeenCalledWith(
        document.getElementById('threeCanvas')
        );
        // wait for loadRockDatabase .then()
        await Promise.resolve();
        expect(loadRockDatabase).toHaveBeenCalled();
        expect(renderRockList).toHaveBeenCalled();
    });

    it('alerts when no model on 2D click', () => {
        window.rocheActuelle = null;
        document.getElementById('btn2D').click();
        expect(showSelectModelAlert).toHaveBeenCalled();
    });

    it('handles 2D button click with model', async () => {
        const { init2DViewer } = await import('../src/thinsection.js');

        window.rocheActuelle = { origine: 'Magmatique', nom: 'R1' };

        document.getElementById('btn2D').click();

        expect(show2DView).toHaveBeenCalled();

        await new Promise(r => setTimeout(r, 0));

        expect(init2DViewer).toHaveBeenCalledWith(
            document.getElementById('thinSectionViewer')
        );
    });

    it('binds theme toggle and toast correctly', () => {
        expect(showToast).toBe(window.showToast);
        expect(bindThemeToggle).toHaveBeenCalledWith({
        themeToggleBtn: document.getElementById('toggleTheme'),
        htmlRoot: document.documentElement
        });
    });
});




