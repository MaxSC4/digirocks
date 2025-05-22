import { describe, it, expect } from 'vitest';
import { renderRockList } from '../../src/utils/rockListUtils.js';

describe('rockListUtils', () => {
    it('groups rocks and binds click handlers', () => {
        const container = document.createElement('div');
        const data = [
        { origine:'Magmatique', nom:'A' },
        { origine:'Sédimentaire', nom:'B' },
        { origine:'Unknown', nom:'C' }
        ];
        const clicks = [];
        renderRockList(data, container, r => clicks.push(r.nom));

        // should create 4 sections: Magmatique, Métamorphique(empty), Sédimentaire, Autre
        const sections = container.querySelectorAll('div > h3');
        expect(sections.length).toBe(4);
        // click each button
        container.querySelectorAll('button').forEach(btn => btn.click());
        expect(clicks.sort()).toEqual(['A','B','C'].sort());
    });
});
