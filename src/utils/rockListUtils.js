/**
 * Génère la liste de roches groupées par origine et bind le handler de clic.
 *
 * @param {object[]} roches             – tableau de roches { origine, nom, … }
 * @param {HTMLElement} container       – élément dans lequel injecter la liste
 * @param {(rock: object) => void} onRockClick – callback appelé avec la roche cliquée
 */
export function renderRockList(roches, container, onRockClick) {
    container.innerHTML = '';

    const groupes = {
        Magmatique:    [],
        Métamorphique: [],
        Sédimentaire:  [],
        Autre:         []
    };
    roches.forEach(r => {
        const grp = groupes[r.origine] || groupes.Autre;
        grp.push(r);
    });

    Object.entries(groupes).forEach(([origine, items]) => {
        const section = document.createElement('div');

        const header = document.createElement('h3');
        header.textContent = origine;
        section.appendChild(header);

        items.forEach(rock => {
        const btn = document.createElement('button');
        btn.textContent = rock.nom;
        btn.addEventListener('click', () => onRockClick(rock));
        section.appendChild(btn);
        });

        container.appendChild(section);
    });
}