import { showToast } from './toastUtils';
import { getImageCoordinates } from './coordsUtils.js';


/**
 * Calcule l’aire d’un polygone donné en coords image (non transformées).
 * Renvoie l’aire en unités d’image².
 */
function computePolygonArea(points) {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[(i + 1) % points.length];
        area += x1 * y2 - x2 * y1;
    }

    return Math.abs(area) / 2;
}

let stateSM, panZoomLayerSM, zoneSvgSM, popupLayerSM, cmPerUnitSM;
let pointsSM = [], markersSM = [], polygonSM = null, previewLineSM = null, popupSM = null;
let _cleanupSM = null;

/**
 * Active la mesure de surface :
 * - clic pour ajouter des sommets
 * - mousemove pour prévisualiser le dernier segment
 * - clic sur le premier point (ou bouton) pour terminer
 */
export function enableSurfaceMeasure(panZoomLayer, zoneSvg, popupLayer, state, cmPerUnit = 1) {
    stateSM = state;
    panZoomLayerSM = panZoomLayer;
    zoneSvgSM = zoneSvg;
    popupLayerSM = popupLayer;
    cmPerUnitSM = cmPerUnit;

    pointsSM = [];
    markersSM = [];
    polygonSM = document.createElementNS('http://www.w3.org/2000/svg','polygon');
    polygonSM.setAttribute('fill','rgba(0,150,0,0.3)');
    polygonSM.setAttribute('stroke','green');
    polygonSM.setAttribute('stroke-width','2');
    polygonSM.setAttribute('pointer-events','none');
    zoneSvgSM.appendChild(polygonSM);

    panZoomLayerSM.style.cursor = 'crosshair';
    panZoomLayerSM.addEventListener('click', onClick);
    panZoomLayerSM.addEventListener('mousemove', onMouseMove);
    showToast('Surface : cliquez pour poser chaque point (≥3 pour terminer)');

    _cleanupSM = cleanup;
}

function onClick(e) {
    const [x, y] = getImageCoordinates(e, panZoomLayerSM, stateSM);

    if (pointsSM.length >= 3) {
        const [x0, y0] = pointsSM[0];
        const dx = x0 - x, dy = y0 - y;
        if (Math.hypot(dx, dy) * stateSM.scale < 10) {
            finalizeSurface();
            return;
        }
    }

    pointsSM.push([x,y]);
    const cx = x*stateSM.scale + stateSM.translate.x;
    const cy = y*stateSM.scale + stateSM.translate.y;
    const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('cx',cx);
    c.setAttribute('cy',cy);
    c.setAttribute('r','4');
    c.setAttribute('fill','green');
    c.setAttribute('pointer-events','none');
    zoneSvgSM.appendChild(c);
    markersSM.push(c);

    updatePolygon();
}

function onMouseMove(e) {
    if (pointsSM.length === 0) return;
    if (previewLineSM) zoneSvgSM.removeChild(previewLineSM);

    const rect = panZoomLayerSM.getBoundingClientRect();
    const x = (e.clientX - rect.left - stateSM.translate.x) / stateSM.scale;
    const y = (e.clientY - rect.top  - stateSM.translate.y) / stateSM.scale;
    const last = pointsSM[pointsSM.length - 1];

    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    const x1 = last[0]*stateSM.scale+stateSM.translate.x;
    const y1 = last[1]*stateSM.scale+stateSM.translate.y;
    const x2 = x*stateSM.scale+stateSM.translate.x;
    const y2 = y*stateSM.scale+stateSM.translate.y;
    line.setAttribute('x1',x1);
    line.setAttribute('y1',y1);
    line.setAttribute('x2',x2);
    line.setAttribute('y2',y2);
    line.setAttribute('stroke','green');
    line.setAttribute('stroke-width','2');
    line.setAttribute('pointer-events','none');
    zoneSvgSM.appendChild(line);
    previewLineSM = line;
}

function updatePolygon() {
    const pointsAttr = pointsSM
        .map(([x,y]) => `${x*stateSM.scale+stateSM.translate.x},${y*stateSM.scale+stateSM.translate.y}`)
        .join(' ');
    polygonSM.setAttribute('points', pointsAttr);
}

function finalizeSurface() {
    cleanup();

    const areaImage = computePolygonArea(pointsSM);
    const areaCm2 = areaImage * cmPerUnitSM * cmPerUnitSM;

    const [cx,cy] = pointsSM.reduce((a,p)=>[a[0]+p[0],a[1]+p[1]], [0,0])
                    .map((v,i)=>v/pointsSM.length * stateSM.scale + (i?stateSM.translate.y:stateSM.translate.x));
    const popup = document.createElement('div');
    popup.className = 'ts-popup';
    popup.style.position = 'absolute';
    popup.style.left = `${cx}px`;
    popup.style.top  = `${cy}px`;
    popup.innerHTML = `<button class="close-anno">&times;</button><div>${areaCm2.toFixed(1)} cm²</div>`;
    popupLayerSM.appendChild(popup);
    popupSM = popup;

    popup.querySelector('.close-anno').addEventListener('click', () => disableSurfaceMeasure());

    showToast(`Surface : ${areaCm2.toFixed(1)} cm²`);
}

function cleanup() {
    panZoomLayerSM.style.cursor = '';
    panZoomLayerSM.removeEventListener('click', onClick);
    panZoomLayerSM.removeEventListener('mousemove', onMouseMove);

    markersSM.forEach(c=>c.parentNode&&c.parentNode.removeChild(c));
    markersSM = [];

    polygonSM && polygonSM.parentNode && polygonSM.parentNode.removeChild(polygonSM);
    polygonSM = null;

    previewLineSM && previewLineSM.parentNode && previewLineSM.parentNode.removeChild(previewLineSM);
    previewLineSM = null;

    popupSM && popupSM.parentNode && popupSM.parentNode.removeChild(popupSM);
    popupSM = null;

    pointsSM = [];
    _cleanupSM = null;
}

export function disableSurfaceMeasure() {
    if (typeof _cleanupSM === 'function') {
        _cleanupSM();
    }
}

