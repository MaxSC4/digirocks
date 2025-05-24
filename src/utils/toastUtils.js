let toastTimeout = null;

/**
 * Affiche un toast avec le message donné.
 * @param {string} message
 */
export function showToast(message) {
    const toast = document.getElementById('toast');
    const text  = document.getElementById('toastText');
    if (!toast || !text) return;

    text.textContent = message;
    toast.classList.add('show');

    if (toastTimeout !== null) {
        clearTimeout(toastTimeout);
    }

    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        toastTimeout = null;
    }, 2500);
}