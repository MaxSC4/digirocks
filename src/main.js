import { init3DViewer } from './viewer3d.js';
import { loadRockDatabase } from './rockParser.js';
import { createIcons, icons } from 'lucide'

import { getDomElements } from './utils/domUtils.js';
import { bindInitialLoad } from './utils/initUtils.js';
import { renderRockList } from './utils/rockListUtils.js';
import { showToast }       from './utils/toastUtils.js';
import { bindThemeToggle } from './utils/themeUtils.js';

import {
    show3DView,
    show2DView,
    showSelectModelAlert
} from './utils/viewToggleUtils.js';

const {
    btn3D,
    btn2D,
    canvas3D,
    viewer2D,
    toolbar,
    thinUI,
    toggleBg,
    rockListContainer,
    toast,
    themeToggleBtn,
    htmlRoot
} = getDomElements();

let viewer3DInitialized = false;
let viewer2DInitialized = false;

// 3D
btn3D.addEventListener('click', () => {
    show3DView({ canvas3D, viewer2D, btn3D, btn2D, thinUI, toolbar, toggleBg });

    if (!viewer3DInitialized) {
        init3DViewer(canvas3D);
        viewer3DInitialized = true;
    }

    loadRockDatabase().then(roches => {
        renderRockList(
            roches,
            rockListContainer,
            rock => {
            loader3D.style.display = 'flex';
            requestAnimationFrame(() => {
                setTimeout(() => {
                window.chargerModele(rock).finally(() => {
                    loader3D.style.display = 'none';
                });
                });
            });
            }
        );
    });
});

// 2D
btn2D.addEventListener('click', async () => {
    const rock = window.rocheActuelle;
    if (!rock){
        showSelectModelAlert();
        return;
    }

    show2DView({ canvas3D, viewer2D, btn3D, btn2D, thinUI, toolbar, toggleBg });

    if (!viewer2DInitialized) {
        const { init2DViewer } = await import('./thinsection.js');
        init2DViewer(viewer2D);
        viewer2DInitialized = true;
    }
});

window.showToast = showToast;
bindThemeToggle({ themeToggleBtn, htmlRoot });

// Binding initial : création des icônes + clic 3D par défaut
bindInitialLoad({
    onDomReady: () => createIcons({ icons }),
    onLoad:     () => btn3D.click()
});



