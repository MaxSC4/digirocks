import { setup2DEnvironment } from "./utils/view2DUtils";
import { applyTransform, bindPanZoomEvents } from './utils/transformUtils.js';
import { setupToolbarActions } from './utils/toolbar.js';
import { THIN_SECTION_EXTENSIONS, imageExists } from './utils/ioUtils.js';
import { createMagnifier } from './utils/magnifierUtils.js';


import {
    draw2DMarker,
    draw2DLine,
    show2DMeasurePopup,
    clear2DMeasure
} from './utils/measurementUtils.js';

import {
    createAnnotationPoint2D,
    createAnnotationPolygon2D,
    attach2DPopup,
    update2DPopups,
    computeCentroid
} from './utils/annotation2DUtils.js';

import {
    enableAngleMeasure,
    disableAngleMeasure
} from './utils/angleMeasurementUtils.js';

import {
    enableSurfaceMeasure,
    disableSurfaceMeasure
} from './utils/surfaceMeasurementUtils.js';

import { showToast } from "./utils/toastUtils.js";

export async function init2DViewer(container){

    let measure2DActive = false;
    let measurePoints2D = [];
    let measureMarkers2D = [];

    let measureLine2D = null;
    let measurePopup2D = null;

    let previewLine2D = null;
    let previewMarker2D = null;

    let angleActive = false;

    let surfaceActive = false;

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
    },
    {
        id: 'measure2DBtn',
        handler: () => {
            measure2DActive = !measure2DActive;
            if (!measure2DActive) {
                clear2DMeasure(zoneSvg, measureMarkers2D, measureLine2D, measurePopup2D);
                clearAllMeasures();
                measureMarkers2D = [];
                measureLine2D = null;
                measurePopup2D = null;
            }
        },
        toggleClass: 'active',
        toastMsg: 'Mesure rectiligne'
    },
    {
        id: 'angle2DBtn',
        handler: () => {
            if (angleActive) {
                disableAngleMeasure();
                angleActive = false;
                showToast('Angle : annulé');
            } else {
                enableAngleMeasure(panZoomLayer, zoneSvg, popupLayer, state);
                angleActive = true;
                showToast('Angle : placez le point A');
            }
        },
        toggleClass: 'active',
        toastMsg: ''
    },
    {
        id: 'surface2DBtn',
        handler: () => {
            const btn = document.getElementById('surface2DBtn');
            if (surfaceActive) {
                disableSurfaceMeasure();
                surfaceActive = false;
                btn.classList.remove('active');
                showToast('Surface : annulé');
            } else {
                enableSurfaceMeasure(panZoomLayer, zoneSvg, popupLayer, state, window.cmPerUnit || 1);
                surfaceActive = true;
                btn.classList.add('active');
            }
        },
        toggleClass: 'active',
        toastMsg: 'Mesure de surface'
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

    function onMeasure2DMouseMove(event) {
        if (measurePoints2D.length !== 1) return;
        const rect = img.getBoundingClientRect();
        const x = (event.clientX - rect.left) / state.scale;
        const y = (event.clientY - rect.top)  / state.scale;

        // écran coords du point 1
        const [x1, y1] = measurePoints2D[0];
        const x1p = x1 * state.scale + state.translate.x;
        const y1p = y1 * state.scale + state.translate.y;
        // écran coords du point courant
        const x2p = x * state.scale + state.translate.x;
        const y2p = y * state.scale + state.translate.y;

        // previewLine2D (mise à jour ou création)
        previewLine2D = draw2DLine(zoneSvg,
        [x1, y1], [x, y], state, previewLine2D
        );
        // previewMarker2D
        if (!previewMarker2D) {
        previewMarker2D = draw2DMarker(zoneSvg, {x, y}, state);
        } else {
        previewMarker2D.setAttribute('cx', x2p);
        previewMarker2D.setAttribute('cy', y2p);
        }
    }

    function clearAllMeasures() {
        // retire preview
        if (previewLine2D)   zoneSvg.removeChild(previewLine2D);
        if (previewMarker2D) zoneSvg.removeChild(previewMarker2D);
        previewLine2D   = null;
        previewMarker2D = null;
        // retire définitif
        clear2DMeasure(zoneSvg, measureMarkers2D, measureLine2D, measurePopup2D);
        measureMarkers2D = [];
        measureLine2D    = null;
        measurePopup2D   = null;
        // désactive preview listener
        panZoomLayer.removeEventListener('mousemove', onMeasure2DMouseMove);
        // décocher bouton
        document.getElementById('measure2DBtn')?.classList.remove('active');
        measure2DActive = false;
    }

    panZoomLayer.addEventListener('click', (event) => {
        if (!measure2DActive) return;

        const rect = img.getBoundingClientRect();
        const x = (event.clientX - rect.left) / state.scale;
        const y = (event.clientY - rect.top)  / state.scale;

        measurePoints2D.push([x,y]);

        if (measurePoints2D.length === 1) {
            const m = draw2DMarker(zoneSvg, {x,y}, state);
            measureMarkers2D.push(m);
            panZoomLayer.addEventListener('mousemove', onMeasure2DMouseMove);
            return;
        }
        else if (measurePoints2D.length === 2) {
            // stop preview
            panZoomLayer.removeEventListener('mousemove', onMeasure2DMouseMove);
            if (previewLine2D)   zoneSvg.removeChild(previewLine2D);
            if (previewMarker2D) zoneSvg.removeChild(previewMarker2D);
            previewLine2D   = null;
            previewMarker2D = null;

            const [x2, y2] = measurePoints2D[1];
            const m2 = draw2DMarker(zoneSvg, { x: x2, y: y2 }, state);
            measureMarkers2D.push(m2);

            measureLine2D = draw2DLine(zoneSvg, measurePoints2D[0], measurePoints2D[1], state, measureLine2D);
            measurePopup2D = show2DMeasurePopup(
                measurePoints2D[0],
                measurePoints2D[1],
                state,
                window.cmPerUnit || 1,
                document.getElementById('popup2DContainer')
            );
            measurePoints2D = [];

            measurePopup2D.querySelector('.close-anno').addEventListener('click', () => {
                measurePopup2D.remove();
                clearAllMeasures();
            });
        } 
    })
}