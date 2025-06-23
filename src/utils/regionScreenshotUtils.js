let overlayEl = null;
let selectionEl = null;
let btnContainer = null;
let startX = 0;
let startY = 0;
let isSelecting = false;

/**
 * Passe en mode “sélection de zone”.  
 * Renvoie une Promise qui :
 *  - résout {x,y,width,height} quand l’utilisateur clique sur “V”
 *  - résout null si l’utilisateur annule.
 *
 * @param {HTMLElement} container – la div .ts-viewer
 * @returns {Promise<{x:number,y:number,width:number,height:number}|null>}
 */
export function enterRegionCaptureMode(container) {
    // Empêche double appel
    if (overlayEl) return Promise.resolve(null);

    return new Promise(resolve => {
        // 1) Création de l’overlay
        overlayEl    = document.createElement('div');
        overlayEl.className = 'region-screenshot-overlay';
        container.appendChild(overlayEl);

        // 2) Le rectangle sélectionnable
        selectionEl  = document.createElement('div');
        selectionEl.className = 'selection-rect';
        overlayEl.appendChild(selectionEl);

        // 3) Gestion des events
        function onMouseDown(e) {
        isSelecting = true;
        const rect = overlayEl.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
        Object.assign(selectionEl.style, {
            left:   `${startX}px`,
            top:    `${startY}px`,
            width:  `0px`,
            height: `0px`
        });
        e.preventDefault();
        }

        function onMouseMove(e) {
        if (!isSelecting) return;
        const rect = overlayEl.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const w = Math.abs(x - startX);
        const h = Math.abs(y - startY);
        Object.assign(selectionEl.style, {
            left:   `${Math.min(x, startX)}px`,
            top:    `${Math.min(y, startY)}px`,
            width:  `${w}px`,
            height: `${h}px`
        });
        }

        function onMouseUp() {
        if (!isSelecting) return;
        isSelecting = false;

        // 4) Création des boutons
        btnContainer = document.createElement('div');
        btnContainer.className = 'region-screenshot-btn-container';

        const ok     = document.createElement('button');
        ok.textContent   = '✓';
        ok.title         = 'Valider la capture';
        ok.className     = 'region-screenshot-btn';

        const cancel = document.createElement('button');
        cancel.textContent = '✕';
        cancel.title       = 'Annuler la capture';
        cancel.className   = 'region-screenshot-btn';

        btnContainer.append(ok, cancel);
        overlayEl.appendChild(btnContainer);

        // 5) Positionnement du container de boutons
        const sel = selectionEl.getBoundingClientRect();
        const ov  = overlayEl.getBoundingClientRect();
        const bw  = btnContainer.offsetWidth;
        const bh  = btnContainer.offsetHeight;
        btnContainer.style.left = `${sel.right - ov.left - bw}px`;
        btnContainer.style.top  = `${sel.bottom - ov.top + 6}px`;

        // 6) Handlers de validation / annulation
        ok.addEventListener('click', () => {
            const ov2 = overlayEl.getBoundingClientRect();
            const sel2 = selectionEl.getBoundingClientRect();
            const region = {
            x: Math.round(sel2.left   - ov2.left),
            y: Math.round(sel2.top    - ov2.top),
            width:  Math.round(sel2.width),
            height: Math.round(sel2.height)
            };
            cleanup();
            resolve(region);
        });

        cancel.addEventListener('click', () => {
            cleanup();
            resolve(null);
        });

        // on ne ré–écoute plus ces events
        selectionEl.removeEventListener('mousedown', onMouseDown);
        overlayEl.removeEventListener('mousemove', onMouseMove);
        overlayEl.removeEventListener('mouseup',   onMouseUp);
        }

        // 7) Lancement des écouteurs
        selectionEl.addEventListener('mousedown', onMouseDown);
        overlayEl .addEventListener('mousemove', onMouseMove);
        overlayEl .addEventListener('mouseup',   onMouseUp);

        // 8) Fonction interne de nettoyage
        function cleanup() {
        overlayEl.remove();
        overlayEl = selectionEl = btnContainer = null;
        startX = startY = 0;
        isSelecting = false;
        }
    });
}
