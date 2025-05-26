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
    const geom = new THREE.SphereGeometry(0.002, 16, 16);
    const mat = new THREE.MeshBasicMaterial({ 
        color: 0xff0000, 
        opacity: 0.25,
        transparent: true
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(...annotation.position);
    mesh.name = `annotation-${annotation.id}`;
    mesh.userData.annotation = annotation;
    return mesh;
}

/**
 * Construit une BufferGeometry triangulée à partir d’un polygone défini
 * par ses points 3D. On part du principe que tous les sommets sont coplanaires.
 * @param {Array<[number,number,number]>} points3D
 * @returns {THREE.BufferGeometry}
 */
function buildSurfaceGeometry(points3D) {
    const vertices = [];
    const p0 = points3D[0];

    for (let i = 1; i < points3D.length - 1; i++){
        const p1 = points3D[i];
        const p2 = points3D[i + 1];
        vertices.push(
            p0[0], p0[1], p0[2],
            p1[0], p1[1], p1[2],
            p2[0], p2[1], p2[2]
        );
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.computeVertexNormals();
    return geom;
}

/**
 * Crée un mesh pour une annotation de type zone (polygon),
 * directement à partir des points 3D.
 * @param {{ id: string, points: Array<[number,number,number]> }} annotation
 * @returns {THREE.Mesh}
 */
export function createZoneAnnotationMesh(annotation) {
    const geom = buildSurfaceGeometry(annotation.points);

    const mat = new THREE.MeshBasicMaterial({
        color: 0xff8800,
        transparent: true,
        opacity: 0.25, 
        side: THREE.DoubleSide,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: 1
    });

    const mesh = new THREE.Mesh(geom, mat);
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
        ${text  ? `<div>${text}</div>` : ''}
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

    const unproj0 = new THREE.Vector3(screenPos.x, screenPos.y, 0.5).unproject(camera);
    const geom = new THREE.BufferGeometry().setFromPoints([ worldPos, unproj0 ]);
    const mat = new THREE.LineBasicMaterial({ color: 0x000000 });
    const line = new THREE.Line(geom, mat);
    scene.add(line);

    function updateFrame() {
        const proj = worldPos.clone().project(camera);

        const px = (proj.x * 0.5 + 0.5) * window.innerWidth;
        const py = (-proj.y * 0.5 + 0.5) * window.innerHeight;
        popup.style.left = `${px}px`;
        popup.style.top = `${py}px`;

        const unproj = new THREE.Vector3(proj.x, proj.y, 0.5).unproject(camera);
        line.geometry.setFromPoints([ worldPos, unproj ]);

        requestAnimationFrame(updateFrame);
    }

    requestAnimationFrame(updateFrame);

    return { popup, line };
}