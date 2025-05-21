import { init3DViewer } from './viewer3d.js';
import { loadRockDatabase } from './rockParser.js';
import { createIcons } from 'lucide'

let viewer3DInitialized = false;
let viewer2DInitialized = false;

const btn3D = document.getElementById('btn3D');
const btn2D = document.getElementById('btn2D');
const canvas = document.getElementById('threeCanvas');
const viewer2D = document.getElementById('thinSectionViewer');
const toolbar = document.getElementById('toolbar');
const thinUI = document.getElementById('thinSectionUI');
const toggleBg = document.querySelector('.toggle-background');

window.addEventListener('DOMContentLoaded', () => {
    createIcons()
})

window.addEventListener('load', () => {
    btn3D.click(); 
});

// 3D
btn3D.addEventListener('click', () => {
    canvas.classList.add('active', 'viewer-fade');
    viewer2D.classList.remove('active', 'viewer-fade');
    btn3D.classList.add('active');
    btn2D.classList.remove('active');
    thinUI.style.display = 'none';
    toolbar.classList.add('active');
    toolbar.style.display = 'flex';

    if (toggleBg) toggleBg.style.transform = 'translateX(0%)';

    if (!viewer3DInitialized) {
        init3DViewer(canvas);
        viewer3DInitialized = true;
    }

    loadRockDatabase().then(roches => {
        const listContainer = document.getElementById('rockList');
        listContainer.innerHTML = '';

        const groupes = {
            Magmatique: [],
            Métamorphique: [],
            Sédimentaire: [],
            Autre: []
        };

        roches.forEach(r => {
            const groupe = groupes[r.origine] || groupes.Autre;
            groupe.push(r);
        });

        for (const [origine, items] of Object.entries(groupes)) {
            const section = document.createElement('div');
            section.innerHTML = `<h3>${origine}</h3>`;

            items.forEach(rock => {
                const btn = document.createElement('button');
                btn.textContent = rock.nom;
                btn.addEventListener('click', () => {
                    if (typeof window.chargerModele === 'function') {
                        document.getElementById('loader3D').style.display = 'flex';

                        requestAnimationFrame(() => {
                            setTimeout(() => {
                                window.chargerModele(rock).finally(() => {
                                    document.getElementById('loader3D').style.display = 'none';
                                });

                            })
                        })
                    }
                });

                section.appendChild(btn);
            });

            listContainer.appendChild(section);
        }
    });
});

// 2D
btn2D.addEventListener('click', async () => {
    const rock = window.rocheActuelle;
    if (!rock){
        alert("Veuillez d'abord sélectionner un modèle pour afficher la lame mince.");
        return;
    }


    canvas.classList.remove('active', 'viewer-fade');
    viewer2D.classList.add('active', 'viewer-fade');
    btn3D.classList.remove('active');
    btn2D.classList.add('active');
    thinUI.style.display = 'flex';
    toolbar.classList.remove('active');
    toolbar.style.display = 'none';

    if (toggleBg) toggleBg.style.transform = 'translateX(100%)';


    if (!viewer2DInitialized) {
        const { init2DViewer } = await import('./thinsection.js');
        init2DViewer(viewer2D);
        viewer2DInitialized = true;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('toggleTheme');
    const html = document.documentElement;

    function updateIcon() {
        const isDark = html.getAttribute('data-theme') === 'dark';
        const iconName = isDark ? 'sun' : 'moon';

        const iconWrapper = btn.querySelector('.icon');
        if (iconWrapper) {
            iconWrapper.setAttribute('data-lucide', iconName);
            lucide.createIcons(); 
        }

        btn.querySelector('.tooltip-text').textContent = isDark ? 'Mode clair' : 'Mode sombre';
    }

    btn.addEventListener('click', () => {
        const isDark = html.getAttribute('data-theme') === 'dark';
        html.setAttribute('data-theme', isDark ? 'light' : 'dark');
        updateIcon();
        updateRendererBackground(window.renderer); 
    });

    if (!html.hasAttribute('data-theme')) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }

    updateIcon();
});

function updateRendererBackground(renderer) {
    const color = getComputedStyle(document.body).getPropertyValue('--canvas-bg').trim();
    if (renderer && typeof renderer.setClearColor === 'function') {
        renderer.setClearColor(color);
    }
}


window.showToast = function (message) {
    const toast = document.getElementById('toast');
    const text = document.getElementById('toastText');

    text.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}
