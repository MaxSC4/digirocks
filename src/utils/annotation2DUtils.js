/**
 * Crée un élément point pour une annotation 2D.
 * @param {object} annotation – doit contenir id et position [x,y]
 * @param {{ scale: number, translate: { x,y } }} state
 * @returns {HTMLDivElement}
 */
export function createAnnotationPoint2D(annotation, state) {
    const { scale, translate } = state;
    const [ax, ay] = annotation.position;
    const x = ax * scale + translate.x;
    const y = ay * scale + translate.y;

    const point = document.createElement('div');
    point.className = 'ts-anno-point';
    point.style.position = 'absolute';
    point.style.width    = '35px';
    point.style.height   = '35px';
    point.style.borderRadius = '50%';
    point.style.background   = '#ff0000';
    point.style.border       = '2px solid white';
    point.style.left   = `${x}px`;
    point.style.top    = `${y}px`;
    point.style.cursor = 'pointer';
    point.style.pointerEvents = 'auto';
    return point;
}

/**
 * Crée un élément polygon SVG pour une annotation 2D de type zone.
 * @param {object} annotation – doit contenir points: [[x,y],…]
 * @returns {SVGPolygonElement}
 */
export function createAnnotationPolygon2D(annotation) {
    const polygon = document.createElementNS(
        'http://www.w3.org/2000/svg', 'polygon'
    );
    polygon.setAttribute('fill', 'rgba(255,0,0,0.2)');
    polygon.setAttribute('stroke', 'rgba(255,0,0,0.7)');
    polygon.setAttribute('stroke-width', '2');
    polygon.setAttribute('pointer-events', 'auto');
    polygon.style.cursor = 'pointer';

    const pts = annotation.points
        .map(([x, y]) => `${x},${y}`)
        .join(' ');
    polygon.setAttribute('points', pts);

    return polygon;
}

/**
 * Bâtit le HTML interne au popup 2D.
 * @param {object} annotation – { content: { title,text,image } }
 * @returns {string}
 */
export function build2DPopupHTML(annotation) {
    const { title, text, image } = annotation.content;
    return `
        <button class="close-anno">&times;</button>
        ${title ? `<h4>${title}</h4>` : ''}
        ${text  ? `<p>${text}</p>` : ''}
        ${image ? `<img src="${image}" style="max-width:100%;border-radius:6px;" />` : ''}
    `;
}

/**
 * Attache un popup 2D dans un container HTML à une position donnée, 
 * et renvoie la div popup.
 * @param {string} html      – innerHTML
 * @param {[number,number]} position – [x,y] logique (non transformée)
 * @param {{ scale:number, translate:{x,y} }} state
 * @param {HTMLElement} container
 * @param {Map} popupsMap    – map des popups pour éviter doublons
 * @returns {HTMLDivElement|null}
 */
export function attach2DPopup(annotation, position, state, container, popupsMap) {
    if (popupsMap.has(annotation.id)) return null;

    const popup = document.createElement('div');
    popup.className = 'ts-popup';
    popup.style.position = 'absolute';
    container.appendChild(popup);

    const html = build2DPopupHTML(annotation);
    popup.innerHTML = html;

    // positionnement initial
    const [ax, ay] = position;
    const x = ax * state.scale + state.translate.x;
    const y = ay * state.scale + state.translate.y;
    popup.style.left = `${x}px`;
    popup.style.top  = `${y}px`;

    // enregistrement et close handler
    popupsMap.set(annotation.id, { popup, position });
    popup.querySelector('.close-anno')?.addEventListener('click', () => {
        popup.remove();
        popupsMap.delete(annotation.id);
    });

    return popup;
}

/**
 * Met à jour la position de tous les popups 2D déjà ouverts.
 * @param {Map} popupsMap – valeurs { popup, position:[x,y] }
 * @param {{ scale:number, translate:{x,y} }} state
 */
export function update2DPopups(popupsMap, state) {
    for (const { popup, position } of popupsMap.values()) {
        const [ax, ay] = position;
        const x = ax * state.scale + state.translate.x;
        const y = ay * state.scale + state.translate.y;
        const rect = popup.getBoundingClientRect();
        const margin = 10;
        const maxX = window.innerWidth - rect.width - margin;
        const maxY = window.innerHeight - rect.height - margin;
        popup.style.left = `${Math.max(margin, Math.min(x, maxX))}px`;
        popup.style.top  = `${Math.max(margin, Math.min(y, maxY))}px`;
    }
}

/**
 * Calcule le centroïde d'une liste de points 2D.
 * @param {[number,number][]} points
 * @returns {[number,number]}
 */
export function computeCentroid(points) {
    const n = points.length;
    let sumX = 0, sumY = 0;
    for (const [x, y] of points) {
        sumX += x; sumY += y;
    }
    return [ sumX / n, sumY / n ];
}
