import { createIcons, icons } from 'lucide';

/**
 * Lie le toggle thème (bouton, icône et data-theme) et met à jour le renderer.
 * @param {{
 *   themeToggleBtn: HTMLElement,
 *   htmlRoot: HTMLElement
 * }} params
 */
export function bindThemeToggle({ themeToggleBtn, htmlRoot }) {
    function updateIcon() {
        const isDark    = htmlRoot.getAttribute('data-theme') === 'dark';
        const iconName  = isDark ? 'sun' : 'moon';
        const iconWrap  = themeToggleBtn.querySelector('.icon');
        const tooltip   = themeToggleBtn.querySelector('.tooltip-text');

        if (iconWrap) {
        iconWrap.setAttribute('data-lucide', iconName);
        createIcons({ icons });
        }
        if (tooltip) {
        tooltip.textContent = isDark ? 'Mode clair' : 'Mode sombre';
        }
    }

    themeToggleBtn.addEventListener('click', () => {
        const isDark = htmlRoot.getAttribute('data-theme') === 'dark';
        htmlRoot.setAttribute('data-theme', isDark ? 'light' : 'dark');
        updateIcon();
        if (window.renderer && typeof window.renderer.setClearColor === 'function') {
        const color = getComputedStyle(document.body).getPropertyValue('--canvas-bg').trim();
        window.renderer.setClearColor(color);
        }
    });

    if (!htmlRoot.hasAttribute('data-theme')) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        htmlRoot.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
    updateIcon();
}
