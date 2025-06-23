import html2canvas from 'html2canvas';

/**
 * Capture un screenshot du wrapper 2D avec footer + échelle + infos.
 * Si `region` est renseigné ({ x,y,width,height }), on recadre la capture.
 *
 * @param {HTMLElement} wrapper  – l’élément .ts-viewer
 * @param {{ x:number, y:number, width:number, height:number } | null} [region=null]
 * @returns {Promise<string>}    – dataURL PNG (region ou full)
 */
export async function capture2DWithScale(wrapper, region = null) {
    // 1) Trouver la barre et le label “live”
    const liveBar   = document.querySelector('.scale-bar');
    const liveLabel = document.querySelector('.scale-label');
    if (!liveBar || !liveLabel) {
        console.warn('[capture2DWithScale] .scale-bar ou .scale-label introuvable, snapshot direct');
        const fb = await html2canvas(wrapper, { backgroundColor: null, logging: false, useCORS: true });
        return fb.toDataURL('image/png');
    }

    // 2) Récupérer positions / textes
    const barRect   = liveBar.getBoundingClientRect();
    const labelText = liveLabel.textContent?.trim() || '';
    const sample    = window.rocheActuelle?.sampleName || '';
    const code      = window.rocheActuelle?.code || '';

    // 3) Cloner invisiblement le viewer
    const clone = wrapper.cloneNode(true);
    Object.assign(clone.style, {
        position: 'fixed',
        top:      '-200%',
        left:     '-200%',
        opacity:  '1'
    });
    document.body.appendChild(clone);

    // 4) Construire le footer (comme en 3D)
    const footer = document.createElement('div');
    footer.className = 'screenshot-footer';
    Object.assign(footer.style, {
        position:      'absolute',
        bottom:        '0',
        left:          '0',
        width:         '100%',
        display:       'flex',
        alignItems:    'center',
        padding:       '4px 8px',
        boxSizing:     'border-box',
        background:    'rgba(0,0,0,0.6)',
        zIndex:        '9999',
    });

    // 5) barre blanche
    const barClone = document.createElement('div');
    Object.assign(barClone.style, {
        width:            `${barRect.width}px`,
        height:           `${barRect.height}px`,
        backgroundColor:  '#fff',
        flexShrink:       '0'
    });

    // 6) texte d’échelle
    const txt = document.createElement('div');
    txt.textContent = labelText;
    Object.assign(txt.style, {
        color:       '#fff',
        fontSize:    '14px',
        marginLeft:  '8px',
        whiteSpace:  'nowrap',
        flexShrink:  '0'
    });

    // 7) infos échantillon + ID
    const info = document.createElement('div');
    info.textContent = `  |  Échantillon : ${sample}  |  ID : ${code}`;
    Object.assign(info.style, {
        color:      '#fff',
        fontSize:   '14px',
        marginLeft: '16px',
        whiteSpace: 'nowrap'
    });

    // 8) assembler
    footer.append(barClone, txt, info);
    clone.appendChild(footer);

    // 9) screenshot du clone
    const canvas = await html2canvas(clone, {
        backgroundColor: null,
        logging:         false,
        useCORS:         true,
        width:           clone.clientWidth,
        height:          clone.clientHeight
    });

    // 10) cleanup
    document.body.removeChild(clone);

    // 11) si on veut recadrer la région
    if (region) {
        const { x, y, width, height } = region;
        const crop = document.createElement('canvas');
        crop.width  = width;
        crop.height = height;
        const ctx = crop.getContext('2d');
        ctx.drawImage(canvas,
        x, y, width, height,
        0, 0, width, height
        );
        return crop.toDataURL('image/png');
    }

    // 12) sinon, return full
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
