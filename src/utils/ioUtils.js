/**
 * Extensions à tester pour les lames minces.
 */
export const THIN_SECTION_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.tiff'];

/**
 * Vérifie si une URL d’image existe (HEAD + type image).
 * @param {string} url
 * @returns {Promise<boolean>}
 */
export async function imageExists(url) {
    try {
        const res = await fetch(url, { method: 'HEAD' });
        const type = res.headers.get('Content-Type') || '';
        return res.ok && type.startsWith('image/');
    } catch {
        return false;
    }
}