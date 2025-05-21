/**
 * Applique la transformation CSS à un élément à partir de l’état { scale, translate }.
 * @param {HTMLElement} element
 * @param {{ scale: number, translate: { x: number, y: number } }} state
 */
export function applyTransform(element, state) {
    const { scale, translate } = state;
    element.style.transform = `translate(${translate.x}px, ${translate.y}px) scale(${scale})`;
}

/**
 * Lie les événements wheel & drag-pan sur un élément pour modifier state
 * et appeler updateCallback() à chaque changement.
 * @param {HTMLElement} element          – la couche sur laquelle on écoute
 * @param {{ scale: number, translate: { x: number, y: number } }} state
 * @param {() => void} updateCallback    – fonction à appeler après mutation de state
 * @param {{ minScale?: number, maxScale?: number }} [options]
 */
export function bindPanZoomEvents(element, state, updateCallback, {
    minScale = 0.2,
    maxScale = 5
    } = {}) {
        let isDragging = false;
        let dragStart = { x: 0, y: 0 };

        // ZOOM
        element.addEventListener('wheel', e => {
            e.preventDefault();
            const delta = -e.deltaY * 0.001;
            const newScale = Math.min(Math.max(minScale, state.scale + delta), maxScale);

            const rect = element.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;

            state.translate.x -= offsetX * (newScale - state.scale) / state.scale;
            state.translate.y -= offsetY * (newScale - state.scale) / state.scale;
            state.scale = newScale;

            updateCallback();
        });

        // PAN – début drag
        element.addEventListener('mousedown', e => {
            isDragging = true;
            dragStart.x = e.clientX;
            dragStart.y = e.clientY;
            element.style.cursor = 'grabbing';
        });

        // PAN – fin drag
        window.addEventListener('mouseup', () => {
            isDragging = false;
            element.style.cursor = 'grab';
        });

        // PAN – mouvement
        window.addEventListener('mousemove', e => {
            if (!isDragging) return;
            state.translate.x += e.clientX - dragStart.x;
            state.translate.y += e.clientY - dragStart.y;
            dragStart.x = e.clientX;
            dragStart.y = e.clientY;
            updateCallback();
    });
}