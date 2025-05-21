/**
 * Pour chaque entrée de config, lie un click listener au bouton et renvoie la collection d’éléments trouvés.
 * @param {Array<{ id: string, handler: Function, toggleClass?: string, toastMsg?: string}>} configs
 */
export function setupToolbarActions(configs) {
    const elements = {};
    configs.forEach(({ id, handler, toggleClass, toastMsg}) => {
        const btn = document.getElementById(id);
        if (!btn) {
            console.warn(`Toolbar : bouton introuvable - ${id}`);
            return;
        }
        elements[id] = btn;
        btn.addEventListener('click', (e) => {
            handler(e);
            if (toggleClass) btn.classList.toggle(toggleClass);
            if (toastMsg) showToast(toastMsg);
        });
    });

    return elements;
}