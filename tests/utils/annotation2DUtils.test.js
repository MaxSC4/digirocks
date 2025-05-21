import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
    createAnnotationPoint2D,
    createAnnotationPolygon2D,
    build2DPopupHTML,
    attach2DPopup,
    update2DPopups,
    computeCentroid
} from '../../src/utils/annotation2DUtils.js';

describe('annotation2DUtils', () => {
    const state = { scale: 2, translate: { x: 10, y: 20 } };

    it('createAnnotationPoint2D positions correctly', () => {
        const ann = { id: 'a1', position: [5, 5] };
        const el = createAnnotationPoint2D(ann, state);
        expect(el.className).toBe('ts-anno-point');
        expect(el.style.left).toBe(`${5*2 + 10}px`);
        expect(el.style.top).toBe(`${5*2 + 20}px`);
    });

    it('createAnnotationPolygon2D builds correct SVG polygon', () => {
        const ann = { points: [[0,0],[10,0],[10,10]] };
        const poly = createAnnotationPolygon2D(ann);
        expect(poly.tagName).toBe('polygon');
        expect(poly.getAttribute('points')).toBe('0,0 10,0 10,10');
    });

    it('build2DPopupHTML includes content', () => {
        const ann = { content: { title:'T', text:'Hello', image:'img.png' } };
        const html = build2DPopupHTML(ann);
        expect(html).toContain('<h4>T</h4>');
        expect(html).toContain('<p>Hello</p>');
        expect(html).toContain('src="img.png"');
    });

    it('attach2DPopup adds popup and registers in map', () => {
        const container = document.createElement('div');
        const popupsMap = new Map();
        const ann = { id: 'p1', content:{}, position:[1,1] };
        const popup = attach2DPopup(ann, ann.position, state, container, popupsMap);
        expect(popup).not.toBeNull();
        expect(container.contains(popup)).toBe(true);
        expect(popupsMap.has('p1')).toBe(true);
    });

    it('update2DPopups repositions popups correctly', () => {
        const container = document.createElement('div');
        const popupsMap = new Map();
        const ann = { id: 'p2', content:{}, position:[3,4] };
        const popup = attach2DPopup(ann, ann.position, state, container, popupsMap);
        // simulate bounding rect
        popup.getBoundingClientRect = () => ({ width: 5, height: 5 });
        update2DPopups(popupsMap, state);
        expect(popup.style.left).toMatch(/\d+px/);
        expect(popup.style.top).toMatch(/\d+px/);
    });

    it('computeCentroid returns center of points', () => {
        const pts = [[0,0],[2,0],[2,2],[0,2]];
        expect(computeCentroid(pts)).toEqual([1,1]);
    });
});
