/**
 * Créé un élément « loupe » et renvoie une fonction de gestion du mousemove.
 * @param {HTMLImageElement} imgEl          – l’image source à zoomer
 * @param {{ scale: number, translate: {x:number, y:number} }} state 
 *                                            – l’état pan/zoom
 * @param {{ size?: number, zoomFactor?: number }} 
 *                                            [options] 
 * @returns {{
 *   element: HTMLCanvasElement,
 *   handleMouse: (e: MouseEvent) => void
 * }}
 */
export function createMagnifier(imgEl, state, {
    size       = 100,
    zoomFactor = 4
    } = {}) {
    // création du canvas loupe
    const canvas = document.createElement('canvas');
    canvas.width  = size;
    canvas.height = size;
    canvas.className = 'loupe2d';
    canvas.style.position = 'absolute';
    canvas.style.pointerEvents = 'none';
    const ctx = canvas.getContext('2d');

    let lastDraw = 0;
    const MIN_DELAY = 16;

    /** 
     * **HandleMouse** : dessine la portion zoomée sous la souris
     * @param {MouseEvent} e 
     */
    function handleMouse(e) {
        const now = performance.now();
        if (now - lastDraw < MIN_DELAY) return;
        lastDraw = now;

        const { scale, translate } = state;
        const rect = imgEl.getBoundingClientRect();

        const sx = (e.clientX - rect.left - translate.x) / scale;
        const sy = (e.clientY - rect.top  - translate.y) / scale;
        const effectiveZoom = zoomFactor * scale;
        const srcSize = size / effectiveZoom;

        canvas.style.left = `${e.clientX}px`;
        canvas.style.top  = `${e.clientY}px`;

        if (!ctx) return;

        ctx.clearRect(0, 0, size, size);
        ctx.save();
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2, 0, Math.PI*2);
        ctx.clip();
        ctx.drawImage(
            imgEl,
            sx - srcSize/2, sy - srcSize/2, srcSize, srcSize,
            0, 0, size, size
        );
        ctx.restore();
    }

    return { element: canvas, handleMouse };
}