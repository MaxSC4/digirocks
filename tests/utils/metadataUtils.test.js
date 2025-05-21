import { describe, it, expect, vi } from 'vitest';
import {
    displayMetadata,
    fetchAndDisplayMetadata
} from '../../src/utils/metadataUtils.js';

describe('metadataUtils', () => {
    it('displayMetadata populates sidebar and content', () => {
        const sidebar = document.createElement('div');
        const content = document.createElement('div');
        const meta = {
        key1: { title: 'Title1', icon: 'icon1', content: 'Value1' }
        };

        displayMetadata(meta, sidebar, content);

        expect(sidebar.classList.contains('open')).toBe(true);
        expect(content.querySelectorAll('.meta-section').length).toBe(1);
        expect(content.textContent).toContain('Value1');
    });

    it('fetchAndDisplayMetadata handles success and error', async () => {
        const sidebar = document.createElement('div');
        const content = document.createElement('div');

        global.fetch = vi.fn(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve({ meta: { k:{ title:'t', icon:'', content:'c' } } }) })
        );
        await fetchAndDisplayMetadata('/meta.json', { sidebarEl: sidebar, contentEl: content });
        expect(fetch).toHaveBeenCalledWith('/meta.json');
        expect(content.textContent).toContain('c');

        global.fetch = vi.fn(() =>
        Promise.resolve({ ok: false, status: 404 })
        );
        await fetchAndDisplayMetadata('/meta.json', { sidebarEl: sidebar, contentEl: content });
        expect(content.textContent).toContain('Aucune métadonnée disponible');
    });
});
