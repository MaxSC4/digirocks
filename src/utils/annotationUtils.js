import * as THREE from 'three';

/**
 * Charge et parse un fichier JSON.
 * @param {string} url
 * @returns {Promise<any>}
 */
export async function loadJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/**
 * Crée une sphère THREE.Mesh pour une annotation de type point.
 * @param {object} annotation – doit avoir { id, position: [x,y,z] }
 * @returns {THREE.Mesh}
 */
export function createPointAnnotationMesh(annotation) {
    const geom = new THREE.SphereGeometry(0.005, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(...annotation.position);
    mesh.name = `annotation-${annotation.id}`;
    mesh.userData.annotation = annotation;
    return mesh;
}

/**
 * Crée un mesh pour une annotation de type zone (polygon).
 * @param {object} annotation – doit avoir { id, points: [[x,y,z], …] }
 * @returns {THREE.Mesh}
 */
export function createZoneAnnotationMesh(annotation) {
    const shape = new THREE.Shape();
    annotation.points.forEach((p, i) => {
        const v = new THREE.Vector3(p[0], p[2]);
        i === 0 ? shape.moveTo(v.x, v.y) : shape.lineTo(v.x, v.y);
    });

    const geom = new THREE.ShapeGeometry(shape);
    const mat = new THREE.MeshBasicMaterial({
        color: 0xff8800,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
        depthWrite: false
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = annotation.points[0][1];
    mesh.userData.annotation = annotation;
    return mesh;
}

/**
 * Génère le HTML du popup pour une annotation.
 * @param {object} annotation – { id, content: { title, text, image } }
 * @returns {string}
 */
export function buildAnnotationPopupHTML(annotation) {
    const { title, text, image } = annotation.content;
    return `
        <div>
        <button class="close-anno">&times;</button>
        ${title ? `<h4>${title}</h4>` : ''}
        ${text  ? `<p>${text}</p>` : ''}
        ${image ? `<img src="${image}" style="max-width:100%;border-radius:6px;" />` : ''}
        </div>
    `;
}

/**
 * Calcule les coordonnées écran normalisées [-1,+1] d’un point 3D.
 * @param {THREE.Vector3} position3D
 * @param {THREE.Camera} camera
 * @returns {{ x: number, y: number }}
 */
export function projectToScreen(position3D, camera) {
    const proj = position3D.clone().project(camera);
    return { x: proj.x, y: proj.y };
}

/**
 * Ajoute un popup DOM et une ligne de liaison dans la scène.
 * @param {string} html        – innerHTML du contenu
 * @param {{ x, y }} screenPos – normalisé [-1..1]
 * @param {HTMLElement} container
 * @param {THREE.Vector3} worldPos
 * @param {THREE.Camera} camera
 * @param {THREE.Scene} scene
 * @returns {{ popup: HTMLDivElement, line: THREE.Line }}
 */
export function attachAnnotationPopup(html, screenPos, container, worldPos, camera, scene) {
    const popup = document.createElement('div');
    popup.className = 'anno-popup';
    popup.style.position = 'absolute';
    popup.style.display  = 'block';
    popup.innerHTML      = html;
    container.appendChild(popup);

    const px = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const py = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
    popup.style.left = `${px}px`;
    popup.style.top = `${py}px`;

    const unproj = new THREE.Vector3(screenPos.x, screenPos.y, 0.5).unproject(camera);
    const geom = new THREE.BufferGeometry().setFromPoints([ worldPos, unproj ]);
    const mat = new THREE.LineBasicMaterial({ color: 0x000000 });
    const line = new THREE.Line(geom, mat);
    scene.add(line);

    return { popup, line };
}