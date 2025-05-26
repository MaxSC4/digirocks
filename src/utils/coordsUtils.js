/**
 * Convertit un MouseEvent en coordonnée image (non transformée),
 * en tenant compte du scale et translate appliqués via CSS transform.
 * @param {MouseEvent} e
 * @param {HTMLElement} element – celui qui porte le CSS transform
 * @param {{ scale: number, translate: {x:number,y:number} }} state
 * @returns {[number,number]}
 */
export function getImageCoordinates(e, element, state) {
    const rect = element.getBoundingClientRect();

    const x = (e.clientX - rect.left) / state.scale;
    const y = (e.clientY - rect.top) / state.scale;

    return [x, y];
}