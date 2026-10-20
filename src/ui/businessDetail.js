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
  editBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
    Editar
  `;
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

  const idItem = document.createElement('div');
  idItem.className = 'business-detail__meta-item';
  idItem.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="2"></rect>
      <path d="M10 9h4"></path>
      <path d="M10 15h4"></path>
    </svg>
    <span>ID: ${business.id}</span>
  `;
  meta.appendChild(idItem);

  if (numbers.length > 0) {
    const numbersItem = document.createElement('div');
    numbersItem.className = 'business-detail__meta-item';
    numbersItem.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
      </svg>
      <span>${numbers.length} número${numbers.length !== 1 ? 's' : ''}</span>
    `;
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
  addNumberBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
    Agregar número
  `;
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
    empty.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-bottom: var(--space-3); opacity: 0.5;">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
      </svg>
      <p>No hay números configurados</p>
    `;
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
  sourcesLink.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
    Gestionar fuentes de conocimiento
  `;
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
  editBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  `;
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('number:edit', { detail: { numberId: number.id, businessId } }));
  });
  actions.appendChild(editBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'business-number__action business-number__action--delete';
  deleteBtn.setAttribute('aria-label', `Eliminar ${number.displayName}`);
  deleteBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  `;
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
  div.innerHTML = `
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-bottom: var(--space-3);">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
    <p>${message}</p>
  `;
  return div;
}