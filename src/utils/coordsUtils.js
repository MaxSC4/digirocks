/**
 * Convertit un MouseEvent en coordonnée image (non transformée),
 * en tenant compte du scale et translate appliqués au parent panZoomLayer.
 * @param {MouseEvent} e
 * @param {HTMLImageElement} imgEl – la balise <img> sous panZoomLayer
 * @param {{ scale: number, translate: { x, y } }} state – état pan/zoom
 * @returns {[number,number]} – (x,y) en coordonnées relatives à l’image “d’origine”
 */
export function getImageCoordinates(e, imgEl, state) {
    const rectImg = imgEl.getBoundingClientRect();

    const relX = e.clientX - rectImg.left;
    const relY = e.clientY - rectImg.top;

    const xOrig = (relX - state.translate.x) / state.scale;
    const yOrig = (relY - state.translate.y) / state.scale;

    return [xOrig, yOrig];
}
