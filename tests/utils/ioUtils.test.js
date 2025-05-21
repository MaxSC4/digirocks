import { describe, it, expect, vi } from 'vitest';
import {
    THIN_SECTION_EXTENSIONS,
    imageExists
} from '../../src/utils/ioUtils.js';

describe('ioUtils', () => {
    it('exports the correct extensions list', () => {
        expect(THIN_SECTION_EXTENSIONS).toEqual(['.png', '.jpg', '.jpeg', '.tiff']);
    });

    it('imageExists returns true on valid image', async () => {
        global.fetch = vi.fn(() =>
        Promise.resolve({
            ok: true,
            headers: { get: () => 'image/png' }
        })
        );
        const result = await imageExists('url.png');
        expect(result).toBe(true);
        expect(fetch).toHaveBeenCalledWith('url.png', { method: 'HEAD' });
    });

    it('imageExists returns false on non-image or error', async () => {
        global.fetch = vi.fn(() =>
        Promise.resolve({ ok: true, headers: { get: () => 'text/html' } })
        );
        expect(await imageExists('url.txt')).toBe(false);

        global.fetch = vi.fn(() => Promise.reject(new Error('network')));
        expect(await imageExists('bad.png')).toBe(false);
    });
});
