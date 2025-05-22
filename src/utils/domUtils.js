/**
 * Rassemble et renvoie toutes les références DOM nécessaires au main controller.
 * @returns {{
 *   btn3D: HTMLElement,
 *   btn2D: HTMLElement,
 *   canvas3D: HTMLElement,
 *   viewer2D: HTMLElement,
 *   toolbar: HTMLElement,
 *   thinUI: HTMLElement,
 *   toggleBg: HTMLElement|null,
 *   rockListContainer: HTMLElement,
 *   toast: { root: HTMLElement, text: HTMLElement },
 *   themeToggleBtn: HTMLElement,
 *   htmlRoot: HTMLElement
 * }}
 */
export function getDomElements() {
    const btn3D             = document.getElementById('btn3D');
    const btn2D             = document.getElementById('btn2D');
    const canvas3D          = document.getElementById('threeCanvas');
    const viewer2D          = document.getElementById('thinSectionViewer');
    const toolbar           = document.getElementById('toolbar');
    const thinUI            = document.getElementById('thinSectionUI');
    const toggleBg          = document.querySelector('.toggle-background');
    const rockListContainer = document.getElementById('rockList');
    const toastRoot         = document.getElementById('toast');
    const toastText         = document.getElementById('toastText');
    const themeToggleBtn    = document.getElementById('toggleTheme');
    const htmlRoot          = document.documentElement;

    return {
        btn3D,
        btn2D,
        canvas3D,
        viewer2D,
        toolbar,
        thinUI,
        toggleBg,
        rockListContainer,
        toast: { root: toastRoot, text: toastText },
        themeToggleBtn,
        htmlRoot
    };
}