import html2canvas from 'html2canvas';

/**
 * Capture un screenshot du wrapper 2D ET y incruste
 * la barre d'échelle .scale-ui et son label.
 * @param {HTMLElement} wrapper – l’élément .ts-viewer
 * @returns {Promise<string>} dataURL PNG
 */
export async function capture2DWithScale(wrapper) {
    const canvas = await html2canvas(wrapper, {
        backgroundColor: null,
        logging: false,
        useCORS: true,
        width: wrapper.clientWidth,
        height: wrapper.clientHeight
    });
    const ctx = canvas.getContext('2d');

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

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x0, y0, x1 - x0, y1 - y0);

        const barColor = getComputedStyle(bar).backgroundColor;
        ctx.fillStyle = barColor;
        ctx.fillRect(relBar.x, relBar.y, relBar.w, relBar.h);

        const fontStyle = getComputedStyle(label).font;
        const textColor = getComputedStyle(label).color;
        ctx.font      = fontStyle;
        ctx.fillStyle = textColor;
        ctx.fillText(label.textContent, relLabel.x, relLabel.y + relLabel.h);
    }

    return canvas.toDataURL('image/png');
}