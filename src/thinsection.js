import { contain } from "three/src/extras/TextureUtils.js";

export async function init2DViewer(container){
    container.innerHTML = '';

    const rock = window.rocheActuelle;
    if (!rock) return;

    const formats = ['.png', '.jpg', '.jpeg', '.tiff'];
    let thinSectionURL = null;

    let annotationsVisible2D = true;

    const popups2D = new Map();

    for (const ext of formats) {
        const tentative = `${rock.path}/TS${ext}`;
        if (await imageExists(tentative)) {
            console.log(tentative);
            thinSectionURL = tentative;
            console.log(thinSectionURL);
            console.log(rock.path);
            break;
        }
    }

    let loupeActive = false;
    let loupeElement = null;
    let loupeCtx = null;
    let lastDrawTime = 0;
    const MIN_DELAY = 16;

    if (!thinSectionURL) {
        console.warn("No thin section found for:", rock);
        return;
    }

    const viewer = document.createElement('div');
    viewer.style.position = 'relative';
    viewer.style.overflow = 'hidden';
    viewer.style.width = '100vw';
    viewer.style.height = '100vh';

    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.position = 'absolute';
    wrapper.style.left = '0';
    wrapper.style.top = '0';
    wrapper.style.transformOrigin = '0 0';
    wrapper.style.cursor = 'grab';
    wrapper.style.willChange = 'transform';

    viewer.appendChild(wrapper);
    container.appendChild(viewer);

    const img = document.createElement('img');
    img.src = thinSectionURL;
    img.style.transformOrigin = '0 0';
    img.style.position = 'absolute';
    img.style.left = '0';
    img.style.top = '0';
    img.style.userSelect = 'none';
    img.draggable = false;
    img.style.willChange = 'transform';


    let scale = 1;
    let translate = { x: 0, y: 0 };

    window.tsTransform = {
        scale,
        translate
    };

    let isDragging = false;
    let dragStart = {x: 0, y:0};

    const zoneSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    zoneSvg.style.width = '100%';
    zoneSvg.style.height = '100%';
    zoneSvg.style.position = 'absolute';
    zoneSvg.style.top = 0;
    zoneSvg.style.left = 0;
    zoneSvg.style.overflow = 'visible';
    zoneSvg.style.pointerEvents = 'none';
    zoneSvg.style.zIndex = 5;
    zoneSvg.id = 'tsZoneLayer';


    const overlay = document.createElement('div');
    overlay.id = 'tsAnnotations';
    overlay.style.position = 'absolute';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.pointerEvents = 'none';


    wrapper.appendChild(img);
    wrapper.appendChild(zoneSvg);
    wrapper.appendChild(overlay);



    // Zoom
    wrapper.addEventListener('wheel', (e) => {
        e.preventDefault();

        const delta = -e.deltaY * 0.001;
        const newScale = Math.min(Math.max(0.2, scale + delta), 5);

        const rect = img.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        translate.x -= offsetX * (newScale - scale) / scale;
        translate.y -= offsetY * (newScale - scale) / scale;

        scale = newScale;

        updateTransform();
    });

    // Drag
    // Quand on appuie sur la souris
    wrapper.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragStart.x = e.clientX;
        dragStart.y = e.clientY;
        wrapper.style.cursor = 'grabbing';
    });

    // Quand on arrête d'appuyer 
    window.addEventListener('mouseup', (e) => {
        isDragging = false;
        wrapper.style.cursor = 'grab';
    })

    // Quand on déplace la souris
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        translate.x += e.clientX - dragStart.x;
        translate.y += e.clientY - dragStart.y;
        dragStart.x = e.clientX;
        dragStart.y = e.clientY;

        updateTransform();
    });

    document.getElementById('resetThinView')?.addEventListener('click', () => {
        scale = 1;
        translate = { x: 0, y: 0 };
        updateTransform();
    });
    
    document.getElementById('fullscreenThin')?.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });

    document.getElementById('toggleAnnotations2D')?.addEventListener('click', () => {
        annotationsVisible2D = !annotationsVisible2D;

        document.querySelectorAll('.ts-anno-point').forEach(p => {
            p.style.display = annotationsVisible2D ? 'block' : 'none';
        });

        document.querySelectorAll('.ts-popup').forEach(p => {
            p.style.display = annotationsVisible2D ? 'block' : 'none'
        });

        const svg = document.getElementById('tsZoneLayer');
        if (svg) {
            svg.style.display = annotationsVisible2D ? 'block' : 'none';
        }
    });

    document.getElementById('captureThinScreenshot')?.addEventListener('click', () => {
        const wrapper = container.querySelector('div');
        html2canvas(wrapper).then(canvas => {
            const link = document.createElement('a');
            link.download = `lame-mince-${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        });
    });

    document.getElementById('toggleMagnifier2D')?.addEventListener('click', () => {
        loupeActive = !loupeActive;

        if (loupeActive) {
            container.style.cursor = 'none';

            loupeElement = document.createElement('canvas');
            loupeElement.width = 100;
            loupeElement.height = 100;
            loupeElement.className = 'loupe2d';

            loupeCtx = loupeElement.getContext('2d');
            document.body.appendChild(loupeElement);

            wrapper.addEventListener('mousemove', handleLoupe);
        } else {
            container.style.cursor = 'default';
            wrapper.removeEventListener('mousemove', handleLoupe);
            loupeElement?.remove();
            loupeElement = null;
            loupeCtx = null;
        }
    });


    function updateTransform(){
        wrapper.style.transform = `translate(${translate.x}px, ${translate.y}px) scale(${scale})`;

        window.tsTransform.scale = scale;
        window.tsTransform.translate = { ...translate };

        updatePopups2D();

        if (loupeActive){
            lastMouseEvent && handleLoupe(lastMouseEvent);
        }
    }

    async function imageExists(url) {
        try {
            const res = await fetch(url, {method: 'HEAD'});

            const type = res.headers.get('Content-Type') || '';
            return res.ok && type.startsWith('image/');
        } catch (e) {
            return false;
        }
    }

    async function chargerAnnotations2D(code){
        const path = `data/annotations/${code}.json`;

        console.log('Chargement de :', code);

        try {
            const res = await fetch(path);
            const annotations = await res.json();
            console.log('Données :', annotations);
            annotations
                .filter(a => a.viewer === '2D' && a.type === 'point')
                .forEach(a => afficherAnnotations2D(a));

            annotations
                .filter(a => a.viewer == '2D' && a.type === 'zone')
                .forEach(a => afficherAnnotationPolygon2D(a));
        } catch (err) {
            console.warn("Pas d'annotations 2D trouvées", err);
        }
    }

    // +++++++++++++ GESTION POPUP POINT +++++++++++++
    function afficherAnnotations2D(annotation){
        const point = document.createElement('div');
        point.className = 'ts-anno-point';
        point.style.position = 'absolute';
        point.style.width = '10px';
        point.style.height = '10px';
        point.style.borderRadius = '50%';
        point.style.background = '#ff0000';
        point.style.border = '2px solid white';

        const scale = window.tsTransform.scale;
        const translate = window.tsTransform.translate;
        
        const x = annotation.position[0] * scale + translate.x;
        const y = annotation.position[1] * scale + translate.y;
        
        point.style.left = `${x}px`;
        point.style.top = `${y}px`;
        
        point.style.cursor = 'pointer';
        point.style.pointerEvents = 'auto';

        point.addEventListener('click', (e) => {
            e.stopPropagation();
            afficherPopupAnnotation2D(annotation, annotation.position);
        });

        const overlay = document.getElementById('tsAnnotations');
        if (overlay) {
            overlay.appendChild(point);
        } else {
            console.warn("Pas de conteneur tsAnnotations pour afficher les points.")
        }

        console.log(annotation);
    }

    function afficherPopupAnnotation2D(annotation, position) {
        const container = document.getElementById('popup2DContainer');

        if (popups2D.has(annotation.id)) return;

        const popup = document.createElement('div');
        popup.className = 'ts-popup';

        const content = document.createElement('div');
        content.innerHTML = `
            <button class="close-anno">&times;</button>
            ${annotation.content.title ? `<h4>${annotation.content.title}</h4>` : ''}
            ${annotation.content.text ? `<p>${annotation.content.text}</p>` : ''}
            ${annotation.content.image ? `<img src="${annotation.content.image}" style=max-width:100%; border-radius:6px;" />` : ''}
        `;
        popup.appendChild(content);
        popup.style.position = 'absolute';
        container.appendChild(popup);

        popups2D.set(annotation.id, {
            popup,
            position: [...position]
        });

        popup.querySelector('.close-anno').addEventListener('click', () => {
            popup.remove();
            popups2D.delete(annotation.id)
        });

        updatePopups2D?.();
    }

    function updatePopups2D() {
        const scale = window.tsTransform?.scale || 1;
        const translate = window.tsTransform?.translate || {x: 0, y:0};

        for (const {popup, position} of popups2D.values()){
            const x = position[0] * scale + translate.x;
            const y = position[1] * scale + translate.y;

            const popupRect = popup.getBoundingClientRect();
            const margin = 10;
            const maxX = window.innerWidth - popupRect.width - margin;
            const maxY = window.innerHeight - popupRect.height - margin;

            popup.style.left = `${Math.max(margin, Math.min(x, maxX))}px`;
            popup.style.top = `${Math.max(margin, Math.min(y, maxY))}px`
        }
    }


    // +++++++++++++ GESTION POPUP POLYGON +++++++++++++
    function afficherAnnotationPolygon2D(annotation) {
        const svg = document.getElementById('tsZoneLayer');
        if (!svg || !annotation.points || annotation.points.length < 3) return;

        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('fill', 'rgba(255, 0, 0, 0.2)');
        polygon.setAttribute('stroke', 'rgba(255, 0, 0, 0.7)');
        polygon.setAttribute('stroke-width', '2');
        polygon.setAttribute('pointer-events', 'auto');
        polygon.style.cursor = 'pointer';

        const points = annotation.points.map(([x, y]) => `${x},${y}`).join(' ');
        polygon.setAttribute('points', points);

        polygon.addEventListener('click', (e) => {
            e.stopPropagation();
            const center = calculerCentre(annotation.points);
            afficherPopupAnnotation2D(annotation, center);
        });

        svg.appendChild(polygon);

        console.log(annotation);

        if (!window.zones2D) window.zones2D = [];
        window.zones2D.push({ element: polygon, annotation });
    }

    function calculerCentre(points){
        const n = points.length;
        let sumX = 0, sumY = 0;
        for (const [x, y] of points) {
            sumX += x;
            sumY += y;
        }
        return [sumX / n, sumY / n];
    }

    // +++++++++++++ GESTION LOUPE +++++++++++++
    let lastMouseEvent = null;
    function handleLoupe(e) {
        lastMouseEvent = e;

        const now = performance.now();
        if (now - lastDrawTime < MIN_DELAY) return;
        lastDrawTime = now;

        if (!loupeElement || !loupeCtx) return;

        const img = document.querySelector('img');
        if(!img) return;

        const { scale, translate } = window.tsTransform;
        const zoomFactor = 4;
        const zoomEffectif = zoomFactor * scale;

        const size = 100 / zoomEffectif;

        const rect = img.getBoundingClientRect();

        const sx = (e.clientX - rect.left) / scale;
        const sy = (e.clientY - rect.top) / scale;

        loupeElement.style.left = `${e.clientX}px`;
        loupeElement.style.top = `${e.clientY}px`;

        loupeCtx.clearRect(0, 0, 100, 100);
        loupeCtx.save();
        loupeCtx.beginPath();
        loupeCtx.arc(50, 50, 50, 0, Math.PI * 2);
        loupeCtx.clip();
        loupeCtx.drawImage(
            img,
            sx - size / 2, sy - size / 2, size, size, 
            0, 0, 100, 100
        );
        loupeCtx.restore();
    }


    

    chargerAnnotations2D(rock.code);

}