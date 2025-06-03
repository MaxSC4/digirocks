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
export function attach2DPopup(annotation, position, state, container, popupsMap, viewer) {
    if (popupsMap.has(annotation.id)) return null;

    const popup = document.createElement('div');
    popup.className = 'ts-popup';
    popup.style.position = 'absolute';
    container.appendChild(popup);

    const html = build2DPopupHTML(annotation);
    popup.innerHTML = html;

    // 1) positionnement “idéal” en fonction de state (avant clamp)
    const [ax, ay] = position;
    const idealX = ax * state.scale + state.translate.x;
    const idealY = ay * state.scale + state.translate.y;

    // 2) on pose d’abord le popup “à l’endroit idéal” (pour pouvoir mesurer offsetWidth/offsetHeight)
    popup.style.left = `${idealX}px`;
    popup.style.top  = `${idealY}px`;

    // 3) récupérer le viewer parent (= .ts-viewer) pour connaître ses dimensions
    if (!viewer) {
        console.warn("attach2DPopup : le paramètre 'viewer' est manquant.");
    return popup;
    }

    const vw = viewer.clientWidth;
    const vh = viewer.clientHeight;
    const pw = popup.offsetWidth;
    const ph = popup.offsetHeight;

    // 4) faire le clamp sur la zone [8px .. (vw-ph-8px)] x [8px .. (vh-ph-8px)]
    const margin = 8;
    let clampedX = idealX;
    let clampedY = idealY;

    if (clampedX + pw > vw - margin) clampedX = vw - pw - margin;
    if (clampedX < margin)           clampedX = margin;

    if (clampedY + ph > vh - margin) clampedY = vh - ph - margin;
    if (clampedY < margin)           clampedY = margin;

    popup.style.left = `${clampedX}px`;
    popup.style.top  = `${clampedY}px`;


    // enregistrement et close handler
    popupsMap.set(annotation.id, { popup, position });
    popup.querySelector('.close-anno')?.addEventListener('click', () => {
        popup.remove();
        popupsMap.delete(annotation.id);
    });

    return popup;
}

/**
 * Met à jour la position de tous les popups 2D déjà ouverts,
 * en les clampant aux bords du viewer (.ts-viewer), et pas à la fenêtre entière.
 * @param {Map} popupsMap – map d’entrées { popup, position:[x,y] }
 * @param {{ scale:number, translate:{x,y} }} state
 */
export function update2DPopups(popupsMap, state, viewer) {
    if (!viewer) return;

    // 2) dimensions du viewer
    const vw = viewer.clientWidth;
    const vh = viewer.clientHeight;
    const margin = 8;

    // 3) pour chaque popup, recalcul de la position et clamp
    for (const { popup, position } of popupsMap.values()) {
        // recalcul de la position “idéale” (avant clamp) en px
        const [ax, ay] = position;
        const idealX = ax * state.scale + state.translate.x;
        const idealY = ay * state.scale + state.translate.y;

        // taille du popup
        const pw = popup.offsetWidth;
        const ph = popup.offsetHeight;

        // clamp horizontale
        let clampedX = idealX;
        if (clampedX + pw > vw - margin) clampedX = vw - pw - margin;
        if (clampedX < margin)           clampedX = margin;

        // clamp verticale
        let clampedY = idealY;
        if (clampedY + ph > vh - margin) clampedY = vh - ph - margin;
        if (clampedY < margin)           clampedY = margin;

        popup.style.left = `${clampedX}px`;
        popup.style.top  = `${clampedY}px`;
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
