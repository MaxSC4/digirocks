// src/utils/imageModal.js

/**
 * Initialise le modal d'images pour un sélecteur donné.
 * @param {string} selector - Sélecteur CSS des vignettes cliquables.
 * @param {Object} [options]
 * @param {string} [options.modalId='image-modal'] - ID de l'élément modal.
 */
export function initImageModal(selector, options = {}) {
    const { modalId = 'image-modal' } = options;
    const modal     = document.getElementById(modalId);
    const imgEl     = modal.querySelector('.modal-content');
    const captionEl = modal.querySelector('#modal-caption');
    const closeBtn  = modal.querySelector('.modal-close');

    if (!modal || !imgEl || !captionEl || !closeBtn) {
        console.warn(`initImageModal : éléments manquants pour #${modalId}`);
        return;
    }

    const openModal = (src, alt, caption) => {
        imgEl.src        = src;
        imgEl.alt        = alt;
        captionEl.innerHTML = caption;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
    };

    const closeModal = () => {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        imgEl.src = '';
        captionEl.textContent = '';
    };

    // délégation de click
    document.body.addEventListener('click', event => {
        const el = event.target.closest(selector);
        if (!el) return;

        const fullSrc = el.dataset.full;
        const caption = el.dataset.caption || el.alt || '';
        openModal(fullSrc, el.alt, caption);
    });

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
        }
    });
}
