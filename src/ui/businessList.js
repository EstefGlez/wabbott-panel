import { BUSINESS_COLOR_PALETTE, getBusinessInitial } from '../domain/business.js';

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
  createBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
    Nuevo negocio
  `;
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
    empty.innerHTML = `
      <div class="business-list__empty-icon" aria-hidden="true">🏢</div>
      <h2 class="business-list__empty-title">No hay negocios</h2>
      <p class="business-list__empty-text">Crea tu primer negocio para empezar a gestionar conversaciones.</p>
    `;
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
      numBadge.innerHTML = `
        <span class="business-card__number-name">${number.displayName}</span>
        <span>${number.e164}</span>
      `;
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
  editBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
    Editar
  `;
  editBtn.setAttribute('aria-label', `Editar ${business.name}`);
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('business:edit', { detail: { businessId: business.id } }));
  });
  actions.appendChild(editBtn);

  const sourcesBtn = document.createElement('button');
  sourcesBtn.type = 'button';
  sourcesBtn.className = 'business-card__action business-card__action--sources';
  sourcesBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
    Fuentes
  `;
  sourcesBtn.setAttribute('aria-label', `Ver fuentes de ${business.name}`);
  sourcesBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    location.hash = `/negocios/${business.id}/fuentes`;
  });
  actions.appendChild(sourcesBtn);

  article.appendChild(actions);

  return article;
}