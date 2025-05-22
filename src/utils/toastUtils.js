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

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}