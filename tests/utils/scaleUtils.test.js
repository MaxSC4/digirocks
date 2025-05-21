import { describe, it, expect } from 'vitest';
import { computeViewportHeight, computeLengthFromPixels } from '../../src/utils/scaleUtils.js';

describe('scaleUtils', () => {
    it('computes viewport height correctly for FOV=90°, depth=1', () => {
        const h = computeViewportHeight(90, 1);
        expect(h).toBeCloseTo(2, 5);
    });

    it('converts pixels to world units', () => {
        const world = computeLengthFromPixels(100, 200, 2);
        expect(world).toBeCloseTo(1, 5);
    });
});
