/**
 * Basculer l’interface en affichage 3D.
 */
export function show3DView({
    canvas3D,
    viewer2D,
    btn3D,
    btn2D,
    thinUI,
    toolbar,
    toggleBg
}) {
    canvas3D.classList.add('active', 'viewer-fade');
    viewer2D.classList.remove('active', 'viewer-fade');
    btn3D.classList.add('active');
    btn2D.classList.remove('active');
    thinUI.style.display = 'none';
    toolbar.classList.add('active');
    toolbar.style.display = 'flex';
    if (toggleBg) toggleBg.style.transform = 'translateX(0%)';
}

/**
 * Basculer l’interface en affichage 2D.
 */
export function show2DView({
    canvas3D,
    viewer2D,
    btn3D,
    btn2D,
    thinUI,
    toolbar,
    toggleBg
}) {
    canvas3D.classList.remove('active', 'viewer-fade');
    viewer2D.classList.add('active', 'viewer-fade');
    btn3D.classList.remove('active');
    btn2D.classList.add('active');
    thinUI.style.display = 'flex';
    toolbar.classList.remove('active');
    toolbar.style.display = 'none';
    if (toggleBg) toggleBg.style.transform = 'translateX(100%)';
}

/**
 * Alerte quand aucun modèle n’est sélectionné.
 */
export function showSelectModelAlert() {
    alert("Veuillez d'abord sélectionner un modèle pour afficher la lame mince.");
}
