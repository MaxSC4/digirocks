import { setup2DEnvironment } from "./utils/view2DUtils";
import { applyTransform, bindPanZoomEvents } from './utils/transformUtils.js';
import { setupToolbarActions } from './utils/toolbar.js';
import { THIN_SECTION_EXTENSIONS, imageExists } from './utils/ioUtils.js';
import { createMagnifier } from './utils/magnifierUtils.js';

import {
    createAnnotationPoint2D,
    createAnnotationPolygon2D,
    attach2DPopup,
    update2DPopups,
    computeCentroid
} from './utils/annotation2DUtils.js';

export async function init2DViewer(container){
    container.innerHTML = '';

    const rock = window.rocheActuelle;
    if (!rock) return;

    let thinSectionURL = null;
    for (const ext of THIN_SECTION_EXTENSIONS) {
        const url = `${rock.path}TS${ext}`;
        if (await imageExists(url)) {
            thinSectionURL = url;
            break;
        }
    }
    if (!thinSectionURL) {
    console.warn("Pas de lame mince pour:", rock);
    return;
    }

    const { viewer, panZoomLayer, img, zoneSvg, annotationLayer, popupLayer } = setup2DEnvironment(container);

    setupToolbarActions([
    {
        id: 'resetThinView',
        handler: () => {
        state.scale = 1;
        state.translate = { x: 0, y: 0 };
        updateTransform();
        },
        toastMsg: 'Vue réinitialisée'
    },
    {
        id: 'fullscreenThin',
        handler: () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
        },
        toggleClass: 'active'
    },
    {
        id: 'toggleAnnotations2D',
        handler: () => {
        annotationsVisible2D = !annotationsVisible2D;
        annotationLayer.style.display = annotationsVisible2D ? 'block' : 'none';
        zoneSvg.style.display = annotationsVisible2D ? 'block' : 'none';
        update2DPopups(popups2D, state);
        },
        toggleClass: 'active'
    },
    {
        id: 'captureThinScreenshot',
        handler: () => {
        const wrapperEl = container.querySelector('.ts-viewer');
        html2canvas(wrapperEl).then(canvas => {
            const link = document.createElement('a');
            link.download = `lame-mince-${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        });
        },
        toastMsg: 'Capture téléchargée'
    },
    {
        id: 'toggleMagnifier2D',
        handler: () => {
        loupeActive = !loupeActive;
        if (loupeActive) {
            container.style.cursor = 'none';
            const { element, handleMouse } = createMagnifier(img, state, {
            size: 100,
            zoomFactor: 4
            });
            loupeElement = element;
            magnifierHandler = handleMouse;
            document.body.appendChild(loupeElement);
            panZoomLayer.addEventListener('mousemove', magnifierHandler);
        } else {
            container.style.cursor = 'default';
            panZoomLayer.removeEventListener('mousemove', magnifierHandler);
            magnifierHandler = null;
            loupeElement.remove();
            loupeElement = null;
        }
        },
        toggleClass: 'active'
    }
    ]);

    img.src = thinSectionURL;
    img.onload = () => updateTransform();

    let annotationsVisible2D = true;

    const popups2D = new Map();

    let loupeActive = false;
    let loupeElement = null;
    let magnifierHandler = null;

    const state = { scale: 1, translate: { x: 0, y: 0 } };
    window.tsTransform = state;

    bindPanZoomEvents(panZoomLayer, state, () => {
        applyTransform(panZoomLayer, state);
        update2DPopups(popups2D, state);
    }, {
        minScale: 0.2,
        maxScale: 5
    });

    function updateTransform(){
        applyTransform(panZoomLayer, state);
        window.tsTransform = {...state};
        update2DPopups(popups2D, state);
    }

    async function chargerAnnotations2D(code){
        const path = `data/annotations/${code}.json`;
        let anns = [];
        try {
            const res = await fetch(path);
            anns = await res.json();
        } catch {
            console.warn("Pas d'annotations 2D trouvées");
        }
        // points
        anns
        .filter(a => a.viewer==='2D' && a.type==='point')
        .forEach(a => {
            const pointEl = createAnnotationPoint2D(a, state);
            pointEl.addEventListener('click', e => {
            e.stopPropagation();
            attach2DPopup(a, a.position, state, popupLayer, popups2D);
            });
            annotationLayer.appendChild(pointEl);
        });
        // zones
        anns
        .filter(a => a.viewer==='2D' && a.type==='zone')
        .forEach(a => {
            const poly = createAnnotationPolygon2D(a);
            poly.addEventListener('click', e => {
            e.stopPropagation();
            const center = computeCentroid(a.points);
            attach2DPopup(a, center, state, popupLayer, popups2D);
            });
            zoneSvg.appendChild(poly);
        });
    }

    chargerAnnotations2D(rock.code);
}