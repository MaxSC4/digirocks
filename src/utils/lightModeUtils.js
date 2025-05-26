import { imageExists } from './ioUtils.js';
import { showToast } from './toastUtils.js';

/**
 * Recherche la première URL existante parmi baseName + suffixes EXTENSIONS.
 */
async function findVariant(path, baseName, suffixes) {
    for (const sfx of suffixes) {
        for (const ext of ['.png', '.jpg', '.jpeg', '.tiff']) {
            const url = `${path}/${baseName}${sfx}${ext}`;
            if (await imageExists(url)) return url;
        }
    }

    return null;
}

/**
 * Initialise le switcher lumière naturelle / polarisée.
 * - wrapper : le conteneur .ts-viewer où les <img> seront injectées
 * - rock.path : dossier contenant TS.png et TS_pol.png (ou autre suffixe)
 * - state : { scale, translate } pour réappliquer le transform
 */
export async function initLightModeSwitcher(wrapper, rockPath, state) {
    const NAT_SUFFIXES = [''];
    const POL_SUFFIXES = ['_pol', '-pol'];

    const natURL = await findVariant(rockPath, 'TS', NAT_SUFFIXES);
    const polURL = await findVariant(rockPath, 'TS', POL_SUFFIXES);

    if (!natURL) throw new Error('Aucune image en lumière naturelle trouvée');
    if (!polURL) showToast('Pas d\'image en lumière polarisée trouvée');

    const imgNat = document.createElement('img');
    imgNat.src = natURL;
    imgNat.style.position = 'absolute';
    imgNat.style.top = imgNat.style.left = '0';
    imgNat.style.transformOrigin = '0 0';
    imgNat.style.willChange = 'transform';
    imgNat.draggable = false;
    imgNat.style.userSelect = 'none';

    const imgPol = imgNat.cloneNode();
    imgPol.src = polURL;
    imgPol.style.display = 'none';

    wrapper.appendChild(imgNat);
    wrapper.appendChild(imgPol);

    function update() {
        const { scale, translate } = state;
        const t = `translate(${translate.x}px, ${translate.y}px) scale(${scale})`;
        imgNat.style.transform = t;
        imgPol.style.transform = t;
    }

    state._onChange = () => update();

    let mode = 'nat';
    function toggle() {
        if (mode === 'nat' && polURL) {
            imgNat.style.display = 'none';
            imgPol.style.display = 'block';
            showToast('Lumière polarisée');
            mode = 'pol';
        } else {
            imgPol.style.display = 'none';
            imgNat.style.display = 'block';
            showToast('Lumière naturelle');
            mode = 'nat';
        }
        update();
    }

    return { toggle };
    
}

