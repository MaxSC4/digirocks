/**
 * Récupère et affiche les métadonnées JSON dans la sidebar.
 * @param {string} url – chemin vers metadata.json
 * @param {{ sidebarEl: HTMLElement, contentEl: HTMLElement }} els
 */
export async function fetchAndDisplayMetadata(url, { sidebarEl, contentEl }) {
    try {
        const data = await fetch(url).then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        });
        displayMetadata(data.meta, sidebarEl, contentEl);
    } catch {
        console.warn(`Pas de métadonnées à ${url}`);
        contentEl.innerHTML = "<p style='padding:1rem;'>Aucune métadonnée disponible.</p>";
    }
}

/**
 * Injecte un objet meta dans la sidebar.
 * @param {object} meta  – donnnées { key: { title, icon, content } }
 * @param {HTMLElement} sidebarEl
 * @param {HTMLElement} contentEl
 */
export function displayMetadata(meta, sidebarEl, contentEl) {
    contentEl.innerHTML = '';
    Object.entries(meta).forEach(([key, data]) => {
        const section = document.createElement('div');
        section.className = 'meta-section';

        const header = document.createElement('h4');
        header.innerHTML =  `
            ${data.icon ? `<i data-lucide="${data.icon}" class="icon"></i>` : ''}
            ${data.title || key}
        `;
        section.appendChild(header);

        const body = document.createElement('div');
        if (typeof data.content === 'string' && data.content.trim().startsWith('<')) {
            body.innerHTML = data.content;
        } else {
            body.textContent = data.content;
        }
        section.appendChild(body);

        contentEl.appendChild(section);
    });

    sidebarEl.classList.add('open');
    lucide?.createIcons();
}