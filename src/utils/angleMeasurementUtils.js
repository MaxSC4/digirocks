import { showToast } from './toastUtils.js';
import { getImageCoordinates } from './coordsUtils.js';


/**
 * État interne de la mesure d’angle :
 * - phase 0 : inactif
 * - phase 1 : normal défini par deux points A→B
 * - phase 2 : angle depuis B vers curseur → clic définit C
 */
let phase = 0;
let A = null, B = null, C = null;
let markerA, markerB, markerC;
let lineAB, lineBC, arc;
let popup;
let angleGroup = null;

let _cleanup = null;

/**
 * Initialise l’outil d’angle : bind click & mousemove.
 * @param {HTMLElement} panZoomLayer – couche d’interaction
 * @param {SVGSVGElement} zoneSvg     – couche SVG pour dessiner
 * @param {HTMLElement} popupLayer    – container popups
 * @param {{ scale, translate }} state
 */
export function enableAngleMeasure(panZoomLayer, zoneSvg, popupLayer, imgEl, state) {
    phase = 1;

    angleGroup = document.createElementNS('http://www.w3.org/2000/svg','g');
    zoneSvg.appendChild(angleGroup);

    panZoomLayer.style.cursor = 'crosshair';
    panZoomLayer.addEventListener('click', onClick);
    panZoomLayer.addEventListener('mousemove', onMouseMove);

    _cleanup = cleanup;

    function onClick(e) {
        const pt = getImageCoordinates(e, imgEl, state);
        if (phase === 1) {
            A = pt;
            markerA = drawCircle(angleGroup, pt, state, 'blue');
            showToast('Angle : placez le point B pour la normale');
            phase = 2;
        } else if (phase === 2) {
            B = pt;
            markerB = drawCircle(angleGroup, pt, state, 'blue');
            lineAB = drawLine(angleGroup, A, B, state, 'blue');
            showToast('Angle : placez le point C pour mesurer l\'angle');
            phase = 3;
        } else if (phase === 3) {
            C = pt;
            markerC = drawCircle(angleGroup, pt, state, 'red');
            lineBC = drawLine(angleGroup, B, C, state, 'red');
            arc = drawArc(angleGroup, A, B, C, state, 40, 'green');
            popup = showAnglePopup(B, A, C, state, popupLayer, disableAngleMeasure);
            phase = 0;
        }
    }

    function onMouseMove(e) {
        if (phase === 2) {
            const p = getImageCoordinates(e, imgEl, state);
            if (lineAB) angleGroup.removeChild(lineAB);
            if (markerB) angleGroup.removeChild(markerB);
            lineAB = drawLine(angleGroup, A, p, state, 'rgba(0, 0, 255, 0.5)');
            markerB = drawCircle(angleGroup, p, state, 'rgba(0, 0, 255, 0.5)');
        }
        if (phase === 3) {
            const p = getImageCoordinates(e, imgEl, state);
            if (lineBC) angleGroup.removeChild(lineBC);
            lineBC = drawLine(angleGroup, B, p, state, 'rgba(255, 0, 0, 0.5)');
        }
    }

    function cleanup() {
        panZoomLayer.style.cursor = '';
        panZoomLayer.removeEventListener('click', onClick);
        panZoomLayer.removeEventListener('mousemove', onMouseMove);

        if (angleGroup && angleGroup.parentNode) {
            angleGroup.parentNode.removeChild(angleGroup);
        }
        angleGroup = null;

        [markerA, markerB, markerC].forEach(el => {
            if (el && el.parentNode) el.parentNode.removeChild(el);
        });
        [lineAB, lineBC, arc].forEach(el => {
            if (el && el.parentNode) el.parentNode.removeChild(el);
        });

        if (popup && popup.parentNode) popup.parentNode.removeChild(popup);

        phase = 0;
        A = B = C = null;
        markerA = markerB = markerC = null;
        lineAB = lineBC = arc = null;
        popup = null;
        _cleanup = null;
    }
    }

function drawCircle(svg, [x, y], state, color) {
    const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
    c.setAttribute('cx', x);
    c.setAttribute('cy', y);
    c.setAttribute('r', '4');
    c.setAttribute('fill', color);
    c.setAttribute('pointer-events','none');
    svg.appendChild(c);
    return c;
}

function drawLine(svg, p1, p2, state, color) {
    const [x1,y1] = p1, [x2,y2] = p2;
    const l = document.createElementNS('http://www.w3.org/2000/svg','line');
    l.setAttribute('x1', x1);
    l.setAttribute('y1', y1);
    l.setAttribute('x2', x2);
    l.setAttribute('y2', y2);
    l.setAttribute('stroke', color);
    l.setAttribute('stroke-width', '2');
    l.setAttribute('pointer-events','none');
    svg.appendChild(l);
    return l;
}

function drawArc(svg, A, B, C, state, radius=30, fill) {
    const dx1 = A[0] - B[0], dy1 = A[1] - B[1];
    const dx2 = C[0] - B[0], dy2 = C[1] - B[1];
    let a1 = Math.atan2(dy1, dx1);
    let a2 = Math.atan2(dy2, dx2);

    // (|delta| ≤ π)
    let delta = a2 - a1;
    if (delta > Math.PI)      delta -= 2*Math.PI;
    else if (delta < -Math.PI) delta += 2*Math.PI;

    const sweepFlag = delta > 0 ? 1 : 0;
    const largeArcFlag = 0; 
    const r = radius;

    const sx = (B[0] + Math.cos(a1)*r);
    const sy = (B[1] + Math.sin(a1)*r);

    const ex = (B[0] + Math.cos(a1 + delta)*r);
    const ey = (B[1] + Math.sin(a1 + delta)*r);

    const d = `M ${sx} ${sy} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${ex} ${ey}`;
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', fill);
    path.setAttribute('stroke-width', '2');
    svg.appendChild(path);

    return path;
}

function dot(u,v){ return u[0]*v[0]+u[1]*v[1] }
function len(u){ return Math.hypot(u[0],u[1]) }

function showAnglePopup(B, A, C, state, container, onClose) {
    const v1=[A[0]-B[0],A[1]-B[1]];
    const v2=[C[0]-B[0],C[1]-B[1]];
    const angle = Math.acos(dot(v1,v2)/(len(v1)*len(v2))) * 180/Math.PI;
    const popup = document.createElement('div');
    popup.className = 'ts-popup';
    popup.innerHTML = `<button class="close-anno">&times;</button><div>${angle.toFixed(1)}°</div>`;
    popup.style.position='absolute';
    const mx = B[0]*state.scale+state.translate.x;
    const my = B[1]*state.scale+state.translate.y;
    popup.style.left = `${mx}px`;
    popup.style.top  = `${my}px`;
    container.appendChild(popup);
    popup.querySelector('.close-anno')
        .addEventListener('click', () => {
            popup.remove();
            onClose();
            showToast('Angle : mesure terminée');
        });
    return popup;
}

export function disableAngleMeasure() {
    if (typeof _cleanup === 'function'){
        _cleanup();
        _cleanup = null;
    }
}