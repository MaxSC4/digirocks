import html2canvas from 'html2canvas';

/**
 * Capture a screenshot of the 2D viewer (.ts-viewer) plus a footer bar at the bottom
 * containing:
 *   • a white scale‐bar of the same on-screen pixel width
 *   • the scale value text (e.g. “3.2 cm”)
 *   • “| Échantillon : <sampleName> | ID : <rockCode>”
 *
 * This entire footer is rendered into an OFF‐SCREEN clone of the viewer so that
 * the real viewer never “flashes” the footer. Once html2canvas finishes, we remove
 * the clone and return the PNG dataURL.
 *
 * @param {HTMLElement} wrapper
 *   The original `<div class="ts-viewer">…</div>` returned by setup2DEnvironment.
 * @returns {Promise<string>}
 *   A PNG dataURL of the final screenshot.
 */
export async function capture2DWithScale(wrapper) {
    // 1) Gather “live” scale‐bar metrics from the real DOM:
    const liveBar = document.querySelector('.scale-bar');
    const liveLabel = document.querySelector('.scale-label');
    if (!liveBar || !liveLabel) {
        // If no scale UI is found, just snapshot wrapper directly:
        console.warn('[capture2DWithScale] could not find .scale-bar or .scale-label. Doing a direct snapshot.');
        const fallbackCanvas = await html2canvas(wrapper, {
        backgroundColor: null,
        logging: false,
        useCORS: true,
        width: wrapper.clientWidth,
        height: wrapper.clientHeight
        });
        return fallbackCanvas.toDataURL('image/png');
    }

    const barRect = liveBar.getBoundingClientRect();
    const labelText = liveLabel.textContent?.trim() || '';

    // 2) Grab sampleName and rockCode:
    const sampleName = window.rocheActuelle?.sampleName || '';
    const rockCode   = window.rocheActuelle?.code       || '';

    // 3) Clone the entire viewer. This clone will be positioned off‐screen so the user never sees it.
    const cloneViewer = wrapper.cloneNode(true);
    cloneViewer.style.position = 'fixed';
    cloneViewer.style.top      = '-200%';
    cloneViewer.style.left     = '-200%';
    cloneViewer.style.opacity  = '1'; // Must be “visible” to html2canvas, but off‐screen so it never actually shows.

    // 4) Build a “footer” DIV at the bottom of the clone – exactly like the 3D footer
    const footer = document.createElement('div');
    footer.className = 'screenshot-footer';
    Object.assign(footer.style, {
        position: 'absolute',
        bottom: '0',
        left: '0',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        boxSizing: 'border-box',
        backgroundColor: 'rgba(0, 0, 0, 0.6)', // semi‐opaque black
        zIndex: '9999'
    });

    // 5) Create a white scale‐bar of the exact same pixel width/height as the live one:
    const scaleBarClone = document.createElement('div');
    Object.assign(scaleBarClone.style, {
        width:  `${barRect.width}px`,
        height: `${barRect.height}px`,
        backgroundColor: '#ffffff',
        flexShrink: '0'
    });

    // 6) Next, the scale‐value text (e.g. “3.2 cm”), in white:
    const scaleTextClone = document.createElement('div');
    scaleTextClone.textContent = labelText;
    Object.assign(scaleTextClone.style, {
        color: '#ffffff',
        fontSize: '14px',
        marginLeft: '8px',
        whiteSpace: 'nowrap',
        flexShrink: '0'
    });

    // 7) Finally, append the “| Échantillon : ... | ID : ...”:
    const infoTextClone = document.createElement('div');
    infoTextClone.textContent = `  |  Échantillon : ${sampleName}  |  ID : ${rockCode}`;
    Object.assign(infoTextClone.style, {
        color: '#ffffff',
        fontSize: '14px',
        marginLeft: '16px',
        whiteSpace: 'nowrap'
    });

    // 8) Assemble footer:
    footer.appendChild(scaleBarClone);
    footer.appendChild(scaleTextClone);
    footer.appendChild(infoTextClone);

    // 9) Attach footer into our cloneViewer:
    cloneViewer.appendChild(footer);

    // 10) Insert cloneViewer into document.body, off‐screen:
    document.body.appendChild(cloneViewer);

    // 11) Run html2canvas on the clone (which now has our footer at the bottom):
    const canvas = await html2canvas(cloneViewer, {
        backgroundColor: null,
        logging: false,
        useCORS: true,
        width:  cloneViewer.clientWidth,
        height: cloneViewer.clientHeight
    });

    // 12) Clean up the off‐screen clone immediately:
    document.body.removeChild(cloneViewer);

    // 13) Return the PNG dataURL:
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
    const barEl   = document.querySelector('.scale-bar');
    const labelEl = document.querySelector('.scale-label');
    const sampleName = window.rocheActuelle?.sampleName || '';
    const rockCode   = window.rocheActuelle?.code || '';

    if (barEl && labelEl) {
        // 5) Get on-screen sizes/positions
        const glRect  = glCanvas.getBoundingClientRect();
        const barRect = barEl.getBoundingClientRect();
        const labelRect = labelEl.getBoundingClientRect();
        const padding = 6;

        const relBarW      = barRect.width;
        const relBarH      = barRect.height;
        const rawFooterH   = relBarH + 2 * padding;
        const minFooterCSS = 30;                 // enforce at least 30 CSS px
        const footerHeight = Math.max(rawFooterH, minFooterCSS);

        // 6) As before, compute scale from CSS→canvas:
        const scaleX = off.width  / glRect.width;
        const scaleY = off.height / glRect.height;
        const useScale = scaleX;

        // 8) Convert to canvas px:
        const footerPxH = footerHeight * useScale;
        const footerTop = off.height - footerPxH;

        // 9) Draw the black footer background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, footerTop, off.width, footerPxH);

        // 10) Draw the white scale bar in that footer:
        const barCanvasW = relBarW * useScale;
        const barCanvasH = relBarH * useScale;
        const barCanvasX = padding * useScale;
        const barCanvasY = footerTop + (footerPxH - barCanvasH) / 2;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(barCanvasX, barCanvasY, barCanvasW, barCanvasH);

        // 11) Draw the scale label next to the bar in white:
        const fontMatch = getComputedStyle(labelEl).font.match(/([\d.]+)px\s*(.*)$/) || [];
        let fontSizePx = 14, fontFamily = 'sans-serif';
        if (fontMatch.length >= 3) {
        fontSizePx  = parseFloat(fontMatch[1]);
        fontFamily  = fontMatch[2];
        }
        ctx.font      = `${fontSizePx * useScale}px ${fontFamily}`;
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';

        const gapBetween = 8 * useScale;
        const textX      = barCanvasX + barCanvasW + gapBetween;
        const textY      = barCanvasY + barCanvasH / 2;
        ctx.fillText(labelEl.textContent || '', textX, textY);

        // 12) Draw “ | Échantillon : … | ID : …”
        const suffix = `  |  Échantillon : ${sampleName}  |  ID : ${rockCode}`;
        const baseTextWidth = ctx.measureText(labelEl.textContent || '').width;
        ctx.fillText(suffix, textX + baseTextWidth + gapBetween, textY);
    }

    // 13) Restore UI
    document.body.classList.remove('for-screenshot');

    return off.toDataURL('image/png');
}
