import { formatCharCount, calculateContextBudget, getSourceKindIcon, getStatusBadgeClass, truncatePreview } from '../domain/source.js';

/**
 * Renderiza la lista de fuentes de conocimiento de un negocio.
 * @param {Object} state - Estado actual { businessSources, currentBusiness, currentBusinessId }
 * @returns {HTMLElement} Sección de fuentes
 */
export function renderSourceList(state) {
  const { businessSources, currentBusiness, currentBusinessId } = state;
  const business = currentBusiness || state.businessColors?.[currentBusinessId];

  const section = document.createElement('section');
  section.id = 'fuentes';
  section.className = 'source-list screen screen--fuentes';

  // Header con título y botón agregar
  const header = document.createElement('header');
  header.className = 'source-list__header';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'source-list__title-group';

  const backBtn = document.createElement('button');
  backBtn.className = 'source-list__back-btn';
  backBtn.setAttribute('type', 'button');
  backBtn.setAttribute('aria-label', 'Volver al detalle del negocio');
  backBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
    <span class="source-list__back-text">Volver</span>
  `;
  backBtn.addEventListener('click', () => {
    window.location.hash = `#/negocios/${currentBusinessId}`;
  });

  const h1 = document.createElement('h1');
  h1.className = 'source-list__title';
  h1.textContent = 'Fuentes de conocimiento';

  const subtitle = document.createElement('p');
  subtitle.className = 'source-list__subtitle';
  subtitle.textContent = business?.name || 'Negocio';

  titleGroup.appendChild(backBtn);
  titleGroup.appendChild(h1);
  titleGroup.appendChild(subtitle);

  const addBtn = document.createElement('button');
  addBtn.className = 'source-list__add-btn';
  addBtn.setAttribute('type', 'button');
  addBtn.setAttribute('data-action', 'add-source');
  addBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
    <span>Agregar fuente</span>
  `;
  addBtn.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('source:create', {
      detail: { businessId: currentBusinessId },
    }));
  });

  header.appendChild(titleGroup);
  header.appendChild(addBtn);

  // Indicador de presupuesto de contexto
  const budget = calculateContextBudget(businessSources || []);
  const budgetEl = renderContextBudget(budget);

  // Tabla/lista de fuentes
  const listContainer = document.createElement('div');
  listContainer.className = 'source-list__container';

  if (!businessSources || businessSources.length === 0) {
    listContainer.appendChild(renderEmptyState());
  } else {
    listContainer.appendChild(renderSourceTable(businessSources));
  }

  section.appendChild(header);
  section.appendChild(budgetEl);
  section.appendChild(listContainer);

  // Delegación de eventos para acciones de la tabla
  section.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-action="edit-source"]');
    if (editBtn) {
      const sourceId = editBtn.dataset.sourceId;
      window.dispatchEvent(new CustomEvent('source:edit', {
        detail: { sourceId, businessId: currentBusinessId },
      }));
      return;
    }

    const deleteBtn = e.target.closest('[data-action="delete-source"]');
    if (deleteBtn) {
      const sourceId = deleteBtn.dataset.sourceId;
      window.dispatchEvent(new CustomEvent('source:delete', {
        detail: { sourceId, businessId: currentBusinessId },
      }));
      return;
    }
  });

  // Delegación para toggle (change event en el checkbox)
  section.addEventListener('change', (e) => {
    const toggleInput = e.target.closest('[data-action="toggle-source"]');
    if (toggleInput) {
      const sourceId = toggleInput.dataset.sourceId;
      const enabled = toggleInput.checked;
      window.dispatchEvent(new CustomEvent('source:toggle', {
        detail: { sourceId, businessId: currentBusinessId, enabled },
      }));
    }
  });

  return section;
}

/**
 * Renderiza el indicador de presupuesto de contexto.
 * @param {Object} budget - { totalChars, percentage, status, message }
 * @returns {HTMLElement}
 */
function renderContextBudget(budget) {
  const container = document.createElement('div');
  container.className = 'source-budget';
  container.setAttribute('role', 'progressbar');
  container.setAttribute('aria-valuenow', budget.percentage);
  container.setAttribute('aria-valuemin', '0');
  container.setAttribute('aria-valuemax', '100');
  container.setAttribute('aria-label', `Presupuesto de contexto: ${budget.percentage}% usado`);

  const info = document.createElement('div');
  info.className = 'source-budget__info';

  const label = document.createElement('span');
  label.className = 'source-budget__label';
  label.textContent = 'Presupuesto de contexto';

  const value = document.createElement('span');
  value.className = 'source-budget__value';
  value.textContent = `${formatCharCount(budget.totalChars)} / ${formatCharCount(30000)}`;

  info.appendChild(label);
  info.appendChild(value);

  const barContainer = document.createElement('div');
  barContainer.className = 'source-budget__bar-container';

  const bar = document.createElement('div');
  bar.className = `source-budget__bar source-budget__bar--${budget.status}`;
  bar.style.width = `${Math.min(budget.percentage, 100)}%`;

  barContainer.appendChild(bar);

  let statusText = '';
  if (budget.status === 'safe') {
    statusText = `Uso seguro (${budget.percentage}%)`;
  } else if (budget.status === 'warning') {
    statusText = `Próximo al límite (${budget.percentage}%)`;
  } else if (budget.status === 'danger') {
    statusText = `¡Límite superado! (${budget.percentage}%)`;
  }

  const status = document.createElement('span');
  status.className = `source-budget__status source-budget__status--${budget.status}`;
  status.textContent = statusText;

  container.appendChild(info);
  container.appendChild(barContainer);
  container.appendChild(status);

  return container;
}

/**
 * Renderiza la tabla de fuentes (desktop) / lista apilada (móvil).
 * @param {Array} sources - Array de fuentes
 * @returns {HTMLElement}
 */
function renderSourceTable(sources) {
  const table = document.createElement('div');
  table.className = 'source-table';
  table.setAttribute('role', 'table');
  table.setAttribute('aria-label', 'Lista de fuentes de conocimiento');

  // Header de tabla (solo visible en desktop)
  const header = document.createElement('div');
  header.className = 'source-table__header';
  header.setAttribute('role', 'row');
  header.innerHTML = `
    <div class="source-table__cell source-table__cell--kind" role="columnheader">Tipo</div>
    <div class="source-table__cell source-table__cell--title" role="columnheader">Título</div>
    <div class="source-table__cell source-table__cell--status" role="columnheader">Estado</div>
    <div class="source-table__cell source-table__cell--chars" role="columnheader">Tamaño</div>
    <div class="source-table__cell source-table__cell--enabled" role="columnheader">Activo</div>
    <div class="source-table__cell source-table__cell--actions" role="columnheader">Acciones</div>
  `;

  const body = document.createElement('div');
  body.className = 'source-table__body';
  body.setAttribute('role', 'rowgroup');

  for (const source of sources) {
    body.appendChild(renderSourceRow(source));
  }

  table.appendChild(header);
  table.appendChild(body);

  return table;
}

/**
 * Renderiza una fila de fuente (funciona como row de tabla en desktop, card en móvil).
 * @param {Object} source - Fuente de conocimiento
 * @returns {HTMLElement}
 */
function renderSourceRow(source) {
  const row = document.createElement('div');
  row.className = 'source-row';
  row.setAttribute('role', 'row');
  row.setAttribute('data-source-id', source.id);

  // Celda: Tipo/Icono
  const kindCell = document.createElement('div');
  kindCell.className = 'source-table__cell source-table__cell--kind';
  kindCell.setAttribute('role', 'cell');
  kindCell.innerHTML = `<span class="source-kind" aria-label="${getSourceKindIcon(source.kind)}">${getSourceKindIcon(source.kind)}</span>`;

  // Celda: Título y origen
  const titleCell = document.createElement('div');
  titleCell.className = 'source-table__cell source-table__cell--title';
  titleCell.setAttribute('role', 'cell');
  titleCell.innerHTML = `
    <div class="source-title">${escapeHtml(source.title)}</div>
    <div class="source-origin">${escapeHtml(source.origin)}</div>
    ${source.previewText ? `<div class="source-preview">${escapeHtml(truncatePreview(source.previewText, 150))}</div>` : ''}
  `;

  // Celda: Estado
  const statusCell = document.createElement('div');
  statusCell.className = 'source-table__cell source-table__cell--status';
  statusCell.setAttribute('role', 'cell');
  const statusClass = getStatusBadgeClass(source.status);
  const statusLabels = {
    ready: 'Lista',
    processing: 'Procesando',
    error: 'Error',
  };
  statusCell.innerHTML = `
    <span class="status-badge ${statusClass}" aria-label="Estado: ${statusLabels[source.status] || source.status}">
      ${statusLabels[source.status] || source.status}
    </span>
  `;

  // Celda: Tamaño
  const charsCell = document.createElement('div');
  charsCell.className = 'source-table__cell source-table__cell--chars';
  charsCell.setAttribute('role', 'cell');
  charsCell.textContent = formatCharCount(source.charCount);

  // Celda: Switch habilitado
  const enabledCell = document.createElement('div');
  enabledCell.className = 'source-table__cell source-table__cell--enabled';
  enabledCell.setAttribute('role', 'cell');
  enabledCell.innerHTML = `
    <label class="toggle" aria-label="${source.enabled ? 'Desactivar' : 'Activar'} fuente">
      <input type="checkbox" class="toggle__input" data-action="toggle-source" data-source-id="${source.id}" ${source.enabled ? 'checked' : ''}>
      <span class="toggle__slider"></span>
    </label>
  `;

  // Celda: Acciones
  const actionsCell = document.createElement('div');
  actionsCell.className = 'source-table__cell source-table__cell--actions';
  actionsCell.setAttribute('role', 'cell');
  actionsCell.innerHTML = `
    <div class="source-actions">
      <button type="button" class="source-action source-action--edit" data-action="edit-source" data-source-id="${source.id}" aria-label="Editar fuente">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
      <button type="button" class="source-action source-action--delete" data-action="delete-source" data-source-id="${source.id}" aria-label="Eliminar fuente">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `;

  row.appendChild(kindCell);
  row.appendChild(titleCell);
  row.appendChild(statusCell);
  row.appendChild(charsCell);
  row.appendChild(enabledCell);
  row.appendChild(actionsCell);

  return row;
}

/**
 * Renderiza estado vacío.
 * @returns {HTMLElement}
 */
function renderEmptyState() {
  const empty = document.createElement('div');
  empty.className = 'source-list__empty';
  empty.innerHTML = `
    <div class="source-list__empty-icon">📚</div>
    <h2 class="source-list__empty-title">Sin fuentes de conocimiento</h2>
    <p class="source-list__empty-text">Agrega tu primera fuente para que el asistente pueda responder con información de tu negocio.</p>
  `;
  return empty;
}

/**
 * Escapa HTML para prevenir XSS.
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}