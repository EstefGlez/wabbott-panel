import { getBusinessInitial } from '../domain/business.js';
import { formatPhone } from '../domain/phone.js';

/**
 * Renderiza el detalle de un negocio.
 * @param {Object} state - Estado actual { currentBusiness, businessNumbers, businessColors }
 * @param {string} businessId - ID del negocio
 * @returns {HTMLElement} Sección con el detalle del negocio
 */
export function renderBusinessDetail(state, businessId) {
  const section = document.createElement('section');
  section.id = 'business-detail';
  section.className = 'business-detail';
  section.setAttribute('role', 'region');
  section.setAttribute('aria-label', 'Detalle de negocio');

  const business = state.currentBusiness || state.businessColors?.[businessId];
  const numbers = state.businessNumbers || [];

  if (!business) {
    section.appendChild(renderError('Negocio no encontrado'));
    return section;
  }

  // Header del negocio
  const header = document.createElement('header');
  header.className = 'business-detail__header';
  header.style.setProperty('--biz-color', business.color);

  const headerRow = document.createElement('div');
  headerRow.className = 'business-detail__header-row';

  const avatar = document.createElement('div');
  avatar.className = 'business-detail__avatar';
  avatar.textContent = getBusinessInitial(business.name);
  headerRow.appendChild(avatar);

  const nameGroup = document.createElement('div');
  nameGroup.className = 'business-detail__name-group';

  const name = document.createElement('h1');
  name.className = 'business-detail__name';
  name.textContent = business.name;
  nameGroup.appendChild(name);

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'business-detail__edit-btn';

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
  editBtn.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('business:edit', { detail: { businessId: business.id } }));
  });
  nameGroup.appendChild(editBtn);

  headerRow.appendChild(nameGroup);
  header.appendChild(headerRow);

  // Meta info
  const meta = document.createElement('div');
  meta.className = 'business-detail__meta';

  if (numbers.length > 0) {
    const numbersItem = document.createElement('div');
    numbersItem.className = 'business-detail__meta-item';

    const phoneSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    phoneSvg.setAttribute('width', '14');
    phoneSvg.setAttribute('height', '14');
    phoneSvg.setAttribute('viewBox', '0 0 24 24');
    phoneSvg.setAttribute('fill', 'none');
    phoneSvg.setAttribute('stroke', 'currentColor');
    phoneSvg.setAttribute('stroke-width', '2');
    phoneSvg.setAttribute('stroke-linecap', 'round');
    phoneSvg.setAttribute('stroke-linejoin', 'round');
    phoneSvg.setAttribute('aria-hidden', 'true');

    const phonePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    phonePath.setAttribute('d', 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z');
    phoneSvg.appendChild(phonePath);

    numbersItem.appendChild(phoneSvg);
    numbersItem.appendChild(document.createTextNode(` ${numbers.length} número${numbers.length !== 1 ? 's' : ''}`));
    meta.appendChild(numbersItem);
  }

  header.appendChild(meta);
  section.appendChild(header);

  // Sección de números de teléfono
  const numbersSection = document.createElement('section');
  numbersSection.className = 'business-detail__section';
  numbersSection.setAttribute('aria-labelledby', 'numbers-title');

  const numbersHeader = document.createElement('header');
  numbersHeader.className = 'business-detail__section-header';

  const numbersTitle = document.createElement('h2');
  numbersTitle.id = 'numbers-title';
  numbersTitle.className = 'business-detail__section-title';
  numbersTitle.textContent = 'Números de WhatsApp';
  numbersHeader.appendChild(numbersTitle);

  const addNumberBtn = document.createElement('button');
  addNumberBtn.type = 'button';
  addNumberBtn.className = 'business-detail__add-number-btn';

  const addNumberSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  addNumberSvg.setAttribute('width', '16');
  addNumberSvg.setAttribute('height', '16');
  addNumberSvg.setAttribute('viewBox', '0 0 24 24');
  addNumberSvg.setAttribute('fill', 'none');
  addNumberSvg.setAttribute('stroke', 'currentColor');
  addNumberSvg.setAttribute('stroke-width', '2');
  addNumberSvg.setAttribute('stroke-linecap', 'round');
  addNumberSvg.setAttribute('stroke-linejoin', 'round');
  addNumberSvg.setAttribute('aria-hidden', 'true');

  const addLine1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  addLine1.setAttribute('x1', '12');
  addLine1.setAttribute('y1', '5');
  addLine1.setAttribute('x2', '12');
  addLine1.setAttribute('y2', '19');
  addNumberSvg.appendChild(addLine1);

  const addLine2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  addLine2.setAttribute('x1', '5');
  addLine2.setAttribute('y1', '12');
  addLine2.setAttribute('x2', '19');
  addLine2.setAttribute('y2', '12');
  addNumberSvg.appendChild(addLine2);

  addNumberBtn.appendChild(addNumberSvg);
  addNumberBtn.appendChild(document.createTextNode(' Agregar número'));
  addNumberBtn.setAttribute('aria-label', 'Agregar número de WhatsApp');
  addNumberBtn.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('number:create', { detail: { businessId: business.id } }));
  });
  numbersHeader.appendChild(addNumberBtn);

  numbersSection.appendChild(numbersHeader);

  const numbersList = document.createElement('ul');
  numbersList.className = 'business-numbers';
  numbersList.setAttribute('role', 'list');

  if (numbers.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'business-detail__empty';

    const emptySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    emptySvg.setAttribute('width', '48');
    emptySvg.setAttribute('height', '48');
    emptySvg.setAttribute('viewBox', '0 0 24 24');
    emptySvg.setAttribute('fill', 'none');
    emptySvg.setAttribute('stroke', 'currentColor');
    emptySvg.setAttribute('stroke-width', '1.5');
    emptySvg.setAttribute('stroke-linecap', 'round');
    emptySvg.setAttribute('stroke-linejoin', 'round');
    emptySvg.setAttribute('aria-hidden', 'true');
    emptySvg.style.marginBottom = 'var(--space-3)';
    emptySvg.style.opacity = '0.5';

    const emptyPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    emptyPath.setAttribute('d', 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z');
    emptySvg.appendChild(emptyPath);

    empty.appendChild(emptySvg);

    const p = document.createElement('p');
    p.textContent = 'No hay números configurados';
    empty.appendChild(p);

    numbersList.appendChild(empty);
  } else {
    for (const number of numbers) {
      numbersList.appendChild(renderBusinessNumber(number, business.id));
    }
  }

  numbersSection.appendChild(numbersList);
  section.appendChild(numbersSection);

  // Enlace a fuentes
  const sourcesLink = document.createElement('a');
  sourcesLink.href = `#/negocios/${business.id}/fuentes`;
  sourcesLink.className = 'business-detail__sources-link';

  const sourcesSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  sourcesSvg.setAttribute('width', '20');
  sourcesSvg.setAttribute('height', '20');
  sourcesSvg.setAttribute('viewBox', '0 0 24 24');
  sourcesSvg.setAttribute('fill', 'none');
  sourcesSvg.setAttribute('stroke', 'currentColor');
  sourcesSvg.setAttribute('stroke-width', '2');
  sourcesSvg.setAttribute('stroke-linecap', 'round');
  sourcesSvg.setAttribute('stroke-linejoin', 'round');
  sourcesSvg.setAttribute('aria-hidden', 'true');

  const sourcesCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  sourcesCircle.setAttribute('cx', '12');
  sourcesCircle.setAttribute('cy', '12');
  sourcesCircle.setAttribute('r', '10');
  sourcesSvg.appendChild(sourcesCircle);

  const sourcesLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  sourcesLine.setAttribute('x1', '2');
  sourcesLine.setAttribute('y1', '12');
  sourcesLine.setAttribute('x2', '22');
  sourcesLine.setAttribute('y2', '12');
  sourcesSvg.appendChild(sourcesLine);

  const sourcesPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  sourcesPath.setAttribute('d', 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z');
  sourcesSvg.appendChild(sourcesPath);

  sourcesLink.appendChild(sourcesSvg);
  sourcesLink.appendChild(document.createTextNode(' Gestionar fuentes de conocimiento'));
  sourcesLink.setAttribute('aria-label', `Ver fuentes de conocimiento de ${business.name}`);
  section.appendChild(sourcesLink);

  return section;
}

/**
 * Renderiza un número de teléfono en el detalle del negocio.
 * @param {Object} number - { id, displayName, e164, status }
 * @param {string} businessId
 * @returns {HTMLElement}
 */
function renderBusinessNumber(number, businessId) {
  const li = document.createElement('li');
  li.className = 'business-number';
  li.dataset.numberId = number.id;

  const info = document.createElement('div');
  info.className = 'business-number__info';

  const displayName = document.createElement('div');
  displayName.className = 'business-number__display-name';
  displayName.textContent = number.displayName;
  info.appendChild(displayName);

  const e164 = document.createElement('div');
  e164.className = 'business-number__e164';
  e164.textContent = formatPhone(number.e164);
  info.appendChild(e164);

  li.appendChild(info);

  // Badge de estado
  const statusBadge = document.createElement('span');
  statusBadge.className = `business-number__status business-number__status--${number.status || 'connected'}`;
  statusBadge.textContent = number.status === 'connected' ? 'Conectado' : number.status;
  li.appendChild(statusBadge);

  // Acciones
  const actions = document.createElement('div');
  actions.className = 'business-number__actions';

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'business-number__action';
  editBtn.setAttribute('aria-label', `Editar ${number.displayName}`);

  const editSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  editSvg.setAttribute('width', '18');
  editSvg.setAttribute('height', '18');
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
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('number:edit', { detail: { numberId: number.id, businessId } }));
  });
  actions.appendChild(editBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'business-number__action business-number__action--delete';
  deleteBtn.setAttribute('aria-label', `Eliminar ${number.displayName}`);

  const deleteSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  deleteSvg.setAttribute('width', '18');
  deleteSvg.setAttribute('height', '18');
  deleteSvg.setAttribute('viewBox', '0 0 24 24');
  deleteSvg.setAttribute('fill', 'none');
  deleteSvg.setAttribute('stroke', 'currentColor');
  deleteSvg.setAttribute('stroke-width', '2');
  deleteSvg.setAttribute('stroke-linecap', 'round');
  deleteSvg.setAttribute('stroke-linejoin', 'round');
  deleteSvg.setAttribute('aria-hidden', 'true');

  const deletePolyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  deletePolyline.setAttribute('points', '3 6 5 6 21 6');
  deleteSvg.appendChild(deletePolyline);

  const deletePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  deletePath.setAttribute('d', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2');
  deleteSvg.appendChild(deletePath);

  deleteBtn.appendChild(deleteSvg);
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('number:delete', { detail: { numberId: number.id, businessId } }));
  });
  actions.appendChild(deleteBtn);

  li.appendChild(actions);

  return li;
}

/**
 * Renderiza estado de error.
 * @param {string} message
 * @returns {HTMLElement}
 */
function renderError(message) {
  const div = document.createElement('div');
  div.className = 'business-detail__error';

  const errorSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  errorSvg.setAttribute('width', '48');
  errorSvg.setAttribute('height', '48');
  errorSvg.setAttribute('viewBox', '0 0 24 24');
  errorSvg.setAttribute('fill', 'none');
  errorSvg.setAttribute('stroke', 'currentColor');
  errorSvg.setAttribute('stroke-width', '1.5');
  errorSvg.setAttribute('stroke-linecap', 'round');
  errorSvg.setAttribute('stroke-linejoin', 'round');
  errorSvg.setAttribute('aria-hidden', 'true');
  errorSvg.style.marginBottom = 'var(--space-3)';

  const errorCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  errorCircle.setAttribute('cx', '12');
  errorCircle.setAttribute('cy', '12');
  errorCircle.setAttribute('r', '10');
  errorSvg.appendChild(errorCircle);

  const errorLine1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  errorLine1.setAttribute('x1', '15');
  errorLine1.setAttribute('y1', '9');
  errorLine1.setAttribute('x2', '9');
  errorLine1.setAttribute('y2', '15');
  errorSvg.appendChild(errorLine1);

  const errorLine2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  errorLine2.setAttribute('x1', '9');
  errorLine2.setAttribute('y1', '9');
  errorLine2.setAttribute('x2', '15');
  errorLine2.setAttribute('y2', '15');
  errorSvg.appendChild(errorLine2);

  div.appendChild(errorSvg);

  const p = document.createElement('p');
  p.textContent = message;
  div.appendChild(p);

  return div;
}