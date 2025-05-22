import { describe, it, expect, vi } from 'vitest';
import { bindInitialLoad } from '../../src/utils/initUtils.js';

describe('initUtils', () => {
    it('calls onDomReady and onLoad appropriately', () => {
        const onDom = vi.fn();
        const onLoad = vi.fn();
        bindInitialLoad({ onDomReady: onDom, onLoad });
        // simulate events
        window.dispatchEvent(new Event('DOMContentLoaded'));
        window.dispatchEvent(new Event('load'));
        expect(onDom).toHaveBeenCalled();
        expect(onLoad).toHaveBeenCalled();
    });
});
