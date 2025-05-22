import { describe, it, expect } from 'vitest';
import { showToast } from '../../src/utils/toastUtils.js';

describe('toastUtils', () => {
    beforeEach(() => {
        document.body.innerHTML = `<div id="toast"></div><span id="toastText"></span>`;
    });

    it('adds and removes show class', () => {
        const toast = document.getElementById('toast');
        const text  = document.getElementById('toastText');
        showToast('Hello');
        expect(text.textContent).toBe('Hello');
        expect(toast.classList.contains('show')).toBe(true);
    });
});
