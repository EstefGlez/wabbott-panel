import { filterConversations, sortConversations, searchConversations } from '../domain/conversations.js';
import { maskPhone } from '../domain/phone.js';
import { getWindowChip } from '../domain/window.js';

/**
 * Renderiza la lista completa de conversaciones con selector, filtros, buscador y filas.
 * @param {Object} state - Estado actual
 * @returns {HTMLElement} Sección con la lista
 */
export function renderConversationList(state) {
  const section = document.createElement('section');
  section.id = 'conversation-list';
  section.className = 'conversation-list';

  // Header con selector, filtros y buscador
  const header = document.createElement('header');
  header.className = 'conversation-list__header';

  header.appendChild(renderBusinessSelector(state));
  header.appendChild(renderStatusFilters(state));
  header.appendChild(renderSearchInput(state));

  section.appendChild(header);

  // Lista de filas
  const ul = document.createElement('ul');
  ul.className = 'conversation-rows';
  ul.setAttribute('role', 'list');

  const filtered = applyFiltersAndSort(state);
  if (filtered.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'conversation-row conversation-row--empty';
    empty.textContent = 'No hay conversaciones';
    ul.appendChild(empty);
  } else {
    for (const conversation of filtered) {
      ul.appendChild(renderConversationRow(conversation, state.businessColors));
    }
  }

  section.appendChild(ul);
  return section;
}

/**
 * Renderiza solo las filas de la lista (para actualizaciones parciales).
 * @param {Object} state - Estado actual
 * @returns {HTMLElement} Elemento <ul> con las filas
 */
export function renderConversationRows(state) {
  const ul = document.createElement('ul');
  ul.className = 'conversation-rows';
  ul.setAttribute('role', 'list');

  const filtered = applyFiltersAndSort(state);
  if (filtered.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'conversation-row conversation-row--empty';
    empty.textContent = 'No hay conversaciones';
    ul.appendChild(empty);
  } else {
    for (const conversation of filtered) {
      ul.appendChild(renderConversationRow(conversation, state.businessColors));
    }
  }

  return ul;
}

/**
 * Aplica filtros, orden y búsqueda al estado.
 * @param {Object} state
 * @returns {Conversation[]}
 */
function applyFiltersAndSort(state) {
  const filters = {
    businessId: state.selectedBusinessId,
    status: state.selectedStatus,
    search: state.searchQuery,
  };
  const filtered = filterConversations(state.conversations, filters);
  const sorted = sortConversations(filtered);
  return searchConversations(sorted, state.searchQuery);
}

/**
 * Renderiza el selector de negocio con colores y números anidados.
 * @param {Object} state
 * @returns {HTMLElement}
 */
function renderBusinessSelector(state) {
  const div = document.createElement('div');
  div.className = 'business-selector';

  const label = document.createElement('label');
  label.htmlFor = 'business-select';
  label.textContent = 'Negocio';
  label.className = 'visually-hidden';
  div.appendChild(label);

  const select = document.createElement('select');
  select.id = 'business-select';
  select.className = 'business-selector__select';
  select.setAttribute('aria-label', 'Seleccionar negocio');

  // Opción "Todos los negocios"
  const allOption = document.createElement('option');
  allOption.value = '';
  allOption.textContent = 'Todos los negocios';
  if (state.selectedBusinessId === null || state.selectedBusinessId === '') {
    allOption.selected = true;
  }
  select.appendChild(allOption);

  // Opciones por negocio (usando businessColors del estado)
  for (const [businessId, info] of Object.entries(state.businessColors || {})) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = info.name;

    // Opción del negocio principal
    const bizOption = document.createElement('option');
    bizOption.value = businessId;
    bizOption.textContent = info.name;
    bizOption.dataset.color = info.color;
    if (state.selectedBusinessId === businessId) {
      bizOption.selected = true;
    }
    optgroup.appendChild(bizOption);

    // Números del negocio
    if (info.numbers && info.numbers.length > 0) {
      for (const number of info.numbers) {
        const numOption = document.createElement('option');
        numOption.value = `${businessId}:${number.id}`;
        numOption.textContent = `  — ${number.displayName} (${number.e164})`;
        numOption.dataset.color = info.color;
        optgroup.appendChild(numOption);
      }
    }

    select.appendChild(optgroup);
  }

  div.appendChild(select);

  // Listener para cambio de negocio
  select.addEventListener('change', () => {
    const value = select.value;
    // El valor puede ser 'businessId' o 'businessId:numberId'
    state.selectedBusinessId = value || null;
    state.filteredConversations = applyFiltersAndSort(state);
    window.dispatchEvent(new CustomEvent('conversations:filter-change'));
  });

  return div;
}

/**
 * Renderiza los filtros de estado como botones chip con contadores.
 * @param {Object} state
 * @returns {HTMLElement}
 */
function renderStatusFilters(state) {
  const div = document.createElement('div');
  div.className = 'status-filters';
  div.setAttribute('role', 'group');
  div.setAttribute('aria-label', 'Filtrar por estado de atención');

  const statuses = [
    { key: 'all', label: 'Todos' },
    { key: 'waiting_human', label: 'Esperando asesor' },
    { key: 'human', label: 'Atendidos' },
    { key: 'bot', label: 'Bot' },
  ];

  // Calcular contadores
  const filtersBase = { businessId: state.selectedBusinessId, status: 'all', search: state.searchQuery };
  const allFiltered = filterConversations(state.conversations, filtersBase);
  const searched = searchConversations(allFiltered, state.searchQuery);

  const counts = {};
  for (const s of statuses) {
    if (s.key === 'all') {
      counts[s.key] = searched.length;
    } else {
      counts[s.key] = searched.filter(c => c.handler === s.key).length;
    }
  }

  for (const s of statuses) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `status-filter status-filter--${s.key}${state.selectedStatus === s.key ? ' status-filter--active' : ''}`;
    button.dataset.status = s.key;
    button.setAttribute('aria-pressed', state.selectedStatus === s.key);
    button.innerHTML = `${s.label} <span class="status-filter__count">${counts[s.key]}</span>`;

    button.addEventListener('click', () => {
      state.selectedStatus = s.key;
      state.filteredConversations = applyFiltersAndSort(state);
      // Re-render será manejado por app.js
      window.dispatchEvent(new CustomEvent('conversations:filter-change'));
    });

    div.appendChild(button);
  }

  return div;
}

/**
 * Renderiza el input de búsqueda con debounce.
 * @param {Object} state
 * @returns {HTMLElement}
 */
function renderSearchInput(state) {
  const div = document.createElement('div');
  div.className = 'conversation-search';

  const label = document.createElement('label');
  label.htmlFor = 'conversation-search';
  label.textContent = 'Buscar';
  label.className = 'visually-hidden';
  div.appendChild(label);

  const input = document.createElement('input');
  input.type = 'search';
  input.id = 'conversation-search';
  input.className = 'conversation-search__input';
  input.placeholder = 'Buscar nombre, teléfono, mensaje...';
  input.value = state.searchQuery || '';
  input.setAttribute('aria-label', 'Buscar conversaciones');

  let debounceTimer = null;
  input.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.searchQuery = e.target.value;
      state.filteredConversations = applyFiltersAndSort(state);
      window.dispatchEvent(new CustomEvent('conversations:filter-change'));
    }, 150);
  });

  div.appendChild(input);
  return div;
}

/**
 * Renderiza una fila de conversación.
 * @param {Conversation} conversation
 * @param {Object} businessColors - Mapa businessId -> { color, name }
 * @returns {HTMLElement}
 */
export function renderConversationRow(conversation, businessColors) {
  const li = document.createElement('li');
  li.className = 'conversation-row';
  li.dataset.conversationId = conversation.id;
  li.tabIndex = 0;
  li.setAttribute('role', 'button');
  li.setAttribute('aria-label', `Conversación con ${conversation.customerName || maskPhone(conversation.customerPhone)}`);

  // Handler para click y teclado
  const handleActivate = () => {
    location.hash = `/conversaciones/${conversation.id}`;
  };

  li.addEventListener('click', handleActivate);
  li.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate();
    }
  });

  // Punto de no leídos
  if (conversation.unreadCount > 0) {
    const dot = document.createElement('span');
    dot.className = 'conversation-row__unread';
    dot.setAttribute('aria-label', `${conversation.unreadCount} mensajes sin leer`);
    li.appendChild(dot);
  }

  // Nombre o teléfono enmascarado
  const nameDiv = document.createElement('div');
  nameDiv.className = 'conversation-row__name';
  nameDiv.textContent = conversation.customerName || maskPhone(conversation.customerPhone);
  li.appendChild(nameDiv);

  // Negocio/número con badge de color
  const bizInfo = businessColors?.[conversation.businessId];
  const bizDiv = document.createElement('div');
  bizDiv.className = 'conversation-row__business';

  const badge = document.createElement('span');
  badge.className = 'business-badge';
  if (bizInfo?.color) {
    badge.style.setProperty('--biz-color', bizInfo.color);
  }
  badge.textContent = bizInfo?.name?.charAt(0) || '?';
  bizDiv.appendChild(badge);

  const bizName = document.createElement('span');
  bizName.className = 'conversation-row__business-name';
  bizName.textContent = bizInfo?.name || conversation.businessId;
  bizDiv.appendChild(bizName);

  li.appendChild(bizDiv);

  // Último mensaje y hora
  const msgDiv = document.createElement('div');
  msgDiv.className = 'conversation-row__last-message';
  msgDiv.textContent = conversation.lastMessagePreview || 'Sin mensajes';
  li.appendChild(msgDiv);

  const timeDiv = document.createElement('div');
  timeDiv.className = 'conversation-row__time';
  timeDiv.textContent = formatRelativeTime(conversation.lastCustomerMessageAt);
  li.appendChild(timeDiv);

  // Badge estado de atención
  const statusBadge = document.createElement('span');
  statusBadge.className = `conversation-row__status conversation-row__status--${conversation.handler}`;
  statusBadge.textContent = getHandlerLabel(conversation.handler);
  li.appendChild(statusBadge);

  // Chip ventana 24h
  const windowChip = document.createElement('span');
  windowChip.className = 'conversation-row__window';
  const { label, status } = getWindowChip(conversation.lastCustomerMessageAt, new Date());
  // Mapear status del dominio (green/amber/red/closed) a variant de UI (open/warning/urgent/closed)
  const variantMap = { green: 'open', amber: 'warning', red: 'urgent', closed: 'closed' };
  const variant = variantMap[status] || 'open';
  windowChip.classList.add(`conversation-row__window--${variant}`);
  windowChip.textContent = label;
  li.appendChild(windowChip);

  return li;
}

/**
 * Obtiene etiqueta legible para el handler.
 * @param {string} handler
 * @returns {string}
 */
function getHandlerLabel(handler) {
  const labels = {
    bot: 'Bot',
    waiting_human: 'Esperando',
    human: 'Humano',
  };
  return labels[handler] || handler;
}

/**
 * Formatea tiempo relativo (ej. "2h", "30m", "Ayer").
 * @param {string} isoString
 * @returns {string}
 */
export function formatRelativeTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
}