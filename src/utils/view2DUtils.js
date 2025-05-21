/**
 * Initialise le viewer 2D (DOM + styles) et renvoie tous les éléments clés.
 * @param {HTMLElement} container – l’élément parent dans lequel on injecte le viewer
 * @param {{ width?: string, height?: string }} [options]
 * @returns {{
 *   viewer: HTMLDivElement,
 *   panZoomLayer: HTMLDivElement,
 *   img: HTMLImageElement,
 *   zoneSvg: SVGSVGElement,
 *   overlay: HTMLDivElement
 * }}
 */
export function setup2DEnvironment(container, {
    width = '100vw',
    height = '100vh'
} = {}) {
    container.innerHTML = '';

    const viewer = document.createElement('div');
    viewer.classList.add('ts-viewer');
    viewer.style.position = 'relative';
    viewer.style.overflow = 'hidden';
    viewer.style.width   = width;
    viewer.style.height  = height;

    const panZoomLayer = document.createElement('div');
    panZoomLayer.classList.add('ts-panzoom');
    panZoomLayer.style.position        = 'absolute';
    panZoomLayer.style.top             = '0';
    panZoomLayer.style.left            = '0';
    panZoomLayer.style.width           = '100%';
    panZoomLayer.style.height          = '100%';
    panZoomLayer.style.transformOrigin = '0 0';
    panZoomLayer.style.cursor          = 'grab';
    panZoomLayer.style.willChange      = 'transform';

    const annotationLayer = document.createElement('div');
    annotationLayer.classList.add('ts-annotation-layer');
    annotationLayer.style.position = 'absolute';
    annotationLayer.style.top      = '0';
    annotationLayer.style.left     = '0';
    annotationLayer.style.width    = '100%';
    annotationLayer.style.height   = '100%';
    annotationLayer.style.pointerEvents = 'none';

    viewer.appendChild(panZoomLayer);
    container.appendChild(viewer);

    const img = document.createElement('img');
    img.classList.add('ts-image');
    img.style.position        = 'absolute';
    img.style.top             = '0';
    img.style.left            = '0';
    img.style.transformOrigin = '0 0';
    img.style.userSelect      = 'none';
    img.draggable             = false;
    img.style.willChange      = 'transform';
    panZoomLayer.appendChild(img);

    const zoneSvg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    zoneSvg.classList.add('ts-zone-layer');
    zoneSvg.style.position      = 'absolute';
    zoneSvg.style.top           = '0';
    zoneSvg.style.left          = '0';
    zoneSvg.style.width         = '100%';
    zoneSvg.style.height        = '100%';
    zoneSvg.style.overflow      = 'visible';
    zoneSvg.style.pointerEvents = 'none';
    
    panZoomLayer.appendChild(zoneSvg);
    panZoomLayer.appendChild(annotationLayer);



    const popupLayer = document.createElement('div');
    popupLayer.classList.add('ts-popup-layer');
    popupLayer.style.position = 'absolute';
    popupLayer.style.top      = '0';
    popupLayer.style.left     = '0';
    popupLayer.style.width    = '100%';
    popupLayer.style.height   = '100%';
    popupLayer.style.pointerEvents = 'none';
    viewer.appendChild(popupLayer);

    return { viewer, panZoomLayer, img, zoneSvg, annotationLayer, popupLayer };
}