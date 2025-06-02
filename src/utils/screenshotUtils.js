import html2canvas from 'html2canvas';

/**
 * Capture un screenshot du wrapper 2D ET y incruste
 * la barre d'échelle .scale-ui et son label.
 * @param {HTMLElement} wrapper – l’élément .ts-viewer
 * @returns {Promise<string>} dataURL PNG
 */
export async function capture2DWithScale(wrapper) {
    // 1. Force la barre d'échelle et son texte en blanc via CSS
    wrapper.classList.add('for-screenshot');

    // 2. Capture html2canvas du wrapper
    const canvas = await html2canvas(wrapper, {
        backgroundColor: null,
        logging: false,
        useCORS: true,
        width: wrapper.clientWidth,
        height: wrapper.clientHeight
    });
    const ctx = canvas.getContext('2d');

    // 3. Prépare le dessin de la barre et du label par-dessus
    const bar   = document.querySelector('.scale-bar');
    const label = document.querySelector('.scale-label');
    if (bar && label) {
        const wrapperRect = wrapper.getBoundingClientRect();
        const barRect     = bar.getBoundingClientRect();
        const labelRect   = label.getBoundingClientRect();

        const relBar   = {
            x: barRect.left   - wrapperRect.left,
            y: barRect.top    - wrapperRect.top,
            w: barRect.width,
            h: barRect.height
        };
        const relLabel = {
            x: labelRect.left   - wrapperRect.left,
            y: labelRect.top    - wrapperRect.top,
            w: labelRect.width,
            h: labelRect.height
        };

        const padding = 6;
        const x0 = Math.min(relBar.x, relLabel.x) - padding;
        const y0 = Math.min(relBar.y, relLabel.y) - padding;
        const x1 = Math.max(relBar.x + relBar.w, relLabel.x + relLabel.w) + padding;
        const y1 = Math.max(relBar.y + relBar.h, relLabel.y + relLabel.h) + padding;

        // Fond noir semi-opaque
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x0, y0, x1 - x0, y1 - y0);

        // Barre d'échelle (blanche grâce à .for-screenshot)
        const barColor = getComputedStyle(bar).backgroundColor;
        ctx.fillStyle = barColor;
        ctx.fillRect(relBar.x, relBar.y, relBar.w, relBar.h);

        // Texte du label (blanc grâce à .for-screenshot)
        const fontStyle = getComputedStyle(label).font;
        const textColor = getComputedStyle(label).color;
        ctx.font      = fontStyle;
        ctx.fillStyle = textColor;
        ctx.fillText(label.textContent, relLabel.x, relLabel.y + relLabel.h);
    }

    // 4. Nettoie la classe après la capture
    wrapper.classList.remove('for-screenshot');

    return canvas.toDataURL('image/png');
}

/**
 * Capture une image WebGL (renderer.domElement) et y incruste
 * la barre d'échelle (.scale-bar) et son label (.scale-label)
 * sur un fond sombre semi-opaque.
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 * @param {THREE.Camera} camera
 * @returns {Promise<string>} dataURL PNG
 */
export async function capture3DWithScale(renderer, scene, camera) {
    // 1. Affiche la scène 3D
    renderer.render(scene, camera);

    // 2. Force la barre d'échelle et son texte en blanc via CSS
    document.body.classList.add('for-screenshot');

    // 3. Copie le canvas WebGL dans un canvas temporaire
    const glCanvas = renderer.domElement;
    const off = document.createElement('canvas');
    off.width  = glCanvas.width;
    off.height = glCanvas.height;
    const ctx = off.getContext('2d');
    ctx.drawImage(glCanvas, 0, 0);

    // 4. Prépare le dessin de la barre et du label
    const bar   = document.querySelector('.scale-bar');
    const label = document.querySelector('.scale-label');
    if (bar && label) {
        const glRect    = glCanvas.getBoundingClientRect();
        const barRect   = bar.getBoundingClientRect();
        const labelRect = label.getBoundingClientRect();

        const x0 = Math.min(barRect.left, labelRect.left) - glRect.left - 6;
        const y0 = Math.min(barRect.top,  labelRect.top)  - glRect.top  - 6;
        const x1 = Math.max(barRect.right, labelRect.right) - glRect.left + 6;
        const y1 = Math.max(barRect.bottom,labelRect.bottom) - glRect.top  + 6;

        // Fond noir semi-opaque
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x0, y0, x1 - x0, y1 - y0);

        // Barre d'échelle (blanche grâce à .for-screenshot)
        const barColor = getComputedStyle(bar).backgroundColor;
        ctx.fillStyle = barColor;
        ctx.fillRect(
            barRect.left - glRect.left,
            barRect.top  - glRect.top,
            barRect.width,
            barRect.height
        );

        // Texte du label (blanc grâce à .for-screenshot)
        ctx.font      = getComputedStyle(label).font;
        ctx.fillStyle = getComputedStyle(label).color;
        ctx.fillText(
            label.textContent,
            labelRect.left - glRect.left,
            labelRect.top  - glRect.top  + labelRect.height
        );
    }

    // 5. Nettoie la classe après la capture
    document.body.classList.remove('for-screenshot');

    return off.toDataURL('image/png');
}
