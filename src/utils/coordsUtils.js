/**
 * Convertit un MouseEvent en coordonnée image (non transformée),
 * en tenant compte du scale et translate appliqués au parent panZoomLayer.
 * @param {MouseEvent} e
 * @param {HTMLImageElement} container – la balise <div class="ts-viewer">
 * @param {{ scale: number, translate: { x, y } }} state – état pan/zoom
 * @returns {[number,number]} – (x,y) en coordonnées relatives à l’image “d’origine”
 */
export function getImageCoordinates(e, container, state) {
    const rect = container.getBoundingClientRect();

    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;

    const xOrig = (relX - state.translate.x) / state.scale;
    const yOrig = (relY - state.translate.y) / state.scale;

    return [xOrig, yOrig];
}
