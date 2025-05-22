import { describe, it, beforeEach, expect, vi } from 'vitest';

// Mock all 2D utils
vi.mock('../src/utils/view2DUtils.js', () => ({
    setup2DEnvironment: vi.fn(container => ({
        viewer:{}, panZoomLayer:{ addEventListener:vi.fn()}, img:{}, zoneSvg:{}, annotationLayer:{}, popupLayer:{}
    }))
    }));
    vi.mock('../src/utils/transformUtils.js', () => ({
    applyTransform: vi.fn(),
    bindPanZoomEvents: vi.fn()
    }));
    vi.mock('../src/utils/toolbar.js', () => ({
    setupToolbarActions: vi.fn()
    }));
    vi.mock('../src/utils/ioUtils.js', () => ({
    THIN_SECTION_EXTENSIONS: ['.png'],
    imageExists: vi.fn(async () => true)
    }));
    vi.mock('../src/utils/annotation2DUtils.js', () => ({
    createAnnotationPoint2D: vi.fn(),
    createAnnotationPolygon2D: vi.fn(),
    attach2DPopup: vi.fn(),
    update2DPopups: vi.fn(),
    computeCentroid: vi.fn()
    }));
    vi.mock('../src/utils/magnifierUtils.js', () => ({
    createMagnifier: vi.fn(() => ({ element:{}, handleMouse: vi.fn() }))
}));

import { init2DViewer } from '../src/thinsection.js';

describe('init2DViewer', () => {
    let container;
    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        window.rocheActuelle = { path:'p', code:'c' };
    });

    it('initializes environment and binds utilities', async () => {
        await init2DViewer(container);
        const { setup2DEnvironment } = await import('../src/utils/view2DUtils.js');
        const { bindPanZoomEvents } = await import('../src/utils/transformUtils.js');
        const { setupToolbarActions } = await import('../src/utils/toolbar.js');
        expect(setup2DEnvironment).toHaveBeenCalledWith(container);
        expect(bindPanZoomEvents).toHaveBeenCalled();
        expect(setupToolbarActions).toHaveBeenCalled();
    });

    it('sets the image src and calls updateTransform on load', async () => {
        const fakeURL = 'p/TS.png';
        // override imageExists to return this URL
        const io = await import('../src/utils/ioUtils.js');
        io.imageExists.mockImplementation(async url => url === fakeURL);
        window.rocheActuelle = { path: 'p', code:'c', sampleName:'S' };
        // ensure our fake URL is found
        await init2DViewer(container);
        const { setup2DEnvironment } = await import('../src/utils/view2DUtils.js');
        const { img } = setup2DEnvironment.mock.results[0].value;
        expect(img.src).toContain('TS.png');
    });
});
