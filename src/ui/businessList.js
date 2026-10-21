import { BUSINESS_COLOR_PALETTE, getBusinessInitial } from '../domain/business.js';
import { formatPhone } from '../domain/phone.js';

/**
 * Renderiza la lista de negocios como tarjetas.
 * @param {Object} state - Estado actual { businessColors: Object }
 * @returns {HTMLElement} Sección con la lista de negocios
 */
export function renderBusinessList(state) {
  const section = document.createElement('section');
  section.id = 'business-list';
  section.className = 'business-list';
  section.setAttribute('role', 'region');
  section.setAttribute('aria-label', 'Lista de negocios');

  // Header con título y botón crear
  const header = document.createElement('header');
  header.className = 'business-list__header';

  const title = document.createElement('h1');
  title.className = 'business-list__title';
  title.textContent = 'Negocios';
  header.appendChild(title);

  const actions = document.createElement('div');
  actions.className = 'business-list__actions';

  const createBtn = document.createElement('button');
  createBtn.type = 'button';
  createBtn.className = 'business-list__create-btn';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');

  const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line1.setAttribute('x1', '12');
  line1.setAttribute('y1', '5');
  line1.setAttribute('x2', '12');
  line1.setAttribute('y2', '19');
  svg.appendChild(line1);

  const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line2.setAttribute('x1', '5');
  line2.setAttribute('y1', '12');
  line2.setAttribute('x2', '19');
  line2.setAttribute('y2', '12');
  svg.appendChild(line2);

  createBtn.appendChild(svg);
  createBtn.appendChild(document.createTextNode(' Nuevo negocio'));
  createBtn.setAttribute('aria-label', 'Crear nuevo negocio');
  createBtn.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('business:create'));
  });
  actions.appendChild(createBtn);

  header.appendChild(actions);
  section.appendChild(header);

  // Obtener lista de negocios desde businessColors
  const businesses = Object.entries(state.businessColors || {}).map(([id, info]) => ({
    id,
    name: info.name,
    color: info.color,
    numbers: info.numbers || [],
  }));

  // Lista de tarjetas
  const cardsContainer = document.createElement('div');
  cardsContainer.className = 'business-cards';

  if (businesses.length === 0) {
    // Estado vacío
    const empty = document.createElement('div');
    empty.className = 'business-list__empty';

    const iconDiv = document.createElement('div');
    iconDiv.className = 'business-list__empty-icon';
    iconDiv.setAttribute('aria-hidden', 'true');
    iconDiv.textContent = '🏢';
    empty.appendChild(iconDiv);

    const title = document.createElement('h2');
    title.className = 'business-list__empty-title';
    title.textContent = 'No hay negocios';
    empty.appendChild(title);

    const text = document.createElement('p');
    text.className = 'business-list__empty-text';
    text.textContent = 'Crea tu primer negocio para empezar a gestionar conversaciones.';
    empty.appendChild(text);

    empty.appendChild(createBtn.cloneNode(true));
    cardsContainer.appendChild(empty);
  } else {
    for (const business of businesses) {
      cardsContainer.appendChild(renderBusinessCard(business));
    }
  }

  section.appendChild(cardsContainer);
  return section;
}

/**
 * Renderiza una tarjeta de negocio.
 * @param {Object} business - { id, name, color, numbers }
 * @returns {HTMLElement}
 */
function renderBusinessCard(business) {
  const article = document.createElement('article');
  article.className = 'business-card';
  article.style.setProperty('--biz-color', business.color);
  article.setAttribute('role', 'button');
  article.setAttribute('tabindex', '0');
  article.setAttribute('aria-label', `Ver detalle de ${business.name}`);

  // Click y teclado para navegar al detalle
  const handleActivate = () => {
    location.hash = `/negocios/${business.id}`;
  };

  article.addEventListener('click', handleActivate);
  article.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate();
    }
  });

  // Header con avatar y nombre
  const header = document.createElement('div');
  header.className = 'business-card__header';

  const avatar = document.createElement('div');
  avatar.className = 'business-card__avatar';
  avatar.textContent = getBusinessInitial(business.name);
  header.appendChild(avatar);

  const info = document.createElement('div');
  info.className = 'business-card__info';

  const name = document.createElement('div');
  name.className = 'business-card__name';
  name.textContent = business.name;
  info.appendChild(name);

  const meta = document.createElement('div');
  meta.className = 'business-card__meta';

  const numbersCount = document.createElement('span');
  numbersCount.textContent = `${business.numbers.length} número${business.numbers.length !== 1 ? 's' : ''}`;
  meta.appendChild(numbersCount);

  info.appendChild(meta);
  header.appendChild(info);

  article.appendChild(header);

  // Números del negocio
  if (business.numbers.length > 0) {
    const numbersDiv = document.createElement('div');
    numbersDiv.className = 'business-card__numbers';

    for (const number of business.numbers.slice(0, 3)) {
      const numBadge = document.createElement('span');
      numBadge.className = 'business-card__number';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'business-card__number-name';
      nameSpan.textContent = number.displayName;
      numBadge.appendChild(nameSpan);

      const phoneSpan = document.createElement('span');
      phoneSpan.textContent = formatPhone(number.e164);
      numBadge.appendChild(phoneSpan);

      numbersDiv.appendChild(numBadge);
    }

    if (business.numbers.length > 3) {
      const moreBadge = document.createElement('span');
      moreBadge.className = 'business-card__number';
      moreBadge.textContent = `+${business.numbers.length - 3} más`;
      numbersDiv.appendChild(moreBadge);
    }

    article.appendChild(numbersDiv);
  }

  // Acciones
  const actions = document.createElement('div');
  actions.className = 'business-card__actions';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'business-card__action';

  const editSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  editSvg.setAttribute('width', '16');
  editSvg.setAttribute('height', '16');
  editSvg.setAttribute('viewBox', '0 0 24 24');
  editSvg.setAttribute('fill', 'none');
  editSvg.setAttribute('stroke', 'currentColor');
  editSvg.setAttribute('stroke-width', '2');
  editSvg.setAttribute('stroke-linecap', 'round');
  editSvg.setAttribute('stroke-linejoin', 'round');
  editSvg.setAttribute('aria-hidden', 'true');

  const editPath1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  editPath1.setAttribute('d', 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7');
  editSvg.appendChild(editPath1);

  const editPath2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  editPath2.setAttribute('d', 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z');
  editSvg.appendChild(editPath2);

  editBtn.appendChild(editSvg);
  editBtn.appendChild(document.createTextNode(' Editar'));
  editBtn.setAttribute('aria-label', `Editar ${business.name}`);
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('business:edit', { detail: { businessId: business.id } }));
  });
  actions.appendChild(editBtn);

  const sourcesBtn = document.createElement('button');
  sourcesBtn.type = 'button';
  sourcesBtn.className = 'business-card__action business-card__action--sources';

  const sourcesSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  sourcesSvg.setAttribute('width', '16');
  sourcesSvg.setAttribute('height', '16');
  sourcesSvg.setAttribute('viewBox', '0 0 24 24');
  sourcesSvg.setAttribute('fill', 'none');
  sourcesSvg.setAttribute('stroke', 'currentColor');
  sourcesSvg.setAttribute('stroke-width', '2');
  sourcesSvg.setAttribute('stroke-linecap', 'round');
  sourcesSvg.setAttribute('stroke-linejoin', 'round');
  sourcesSvg.setAttribute('aria-hidden', 'true');

  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '12');
  circle.setAttribute('r', '10');
  sourcesSvg.appendChild(circle);

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', '2');
  line.setAttribute('y1', '12');
  line.setAttribute('x2', '22');
  line.setAttribute('y2', '12');
  sourcesSvg.appendChild(line);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z');
  sourcesSvg.appendChild(path);

  sourcesBtn.appendChild(sourcesSvg);
  sourcesBtn.appendChild(document.createTextNode(' Fuentes'));
  sourcesBtn.setAttribute('aria-label', `Ver fuentes de ${business.name}`);
  sourcesBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    location.hash = `/negocios/${business.id}/fuentes`;
  });
  actions.appendChild(sourcesBtn);

  article.appendChild(actions);

  return article;
}