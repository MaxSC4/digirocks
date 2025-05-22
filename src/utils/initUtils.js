/**
 * Lie les événements d’initialisation de l’application :
 *  - DOMContentLoaded  → créer les icônes
 *  - load               → déclencher le clic 3D par défaut
 *
 * @param {{ onDomReady: ()=>void, onLoad: ()=>void }} handlers
 */
export function bindInitialLoad({ onDomReady, onLoad }) {
    window.addEventListener('DOMContentLoaded', () => {
        onDomReady();
    });

    window.addEventListener('load', () => {
        onLoad();
    });
}