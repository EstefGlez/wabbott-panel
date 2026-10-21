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

  const backSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  backSvg.setAttribute('width', '20');
  backSvg.setAttribute('height', '20');
  backSvg.setAttribute('viewBox', '0 0 24 24');
  backSvg.setAttribute('fill', 'none');
  backSvg.setAttribute('stroke', 'currentColor');
  backSvg.setAttribute('stroke-width', '2');
  backSvg.setAttribute('stroke-linecap', 'round');
  backSvg.setAttribute('stroke-linejoin', 'round');
  backSvg.setAttribute('aria-hidden', 'true');

  const backLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  backLine.setAttribute('x1', '19');
  backLine.setAttribute('y1', '12');
  backLine.setAttribute('x2', '5');
  backLine.setAttribute('y2', '12');
  backSvg.appendChild(backLine);

  const backPolyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  backPolyline.setAttribute('points', '12 19 5 12 12 5');
  backSvg.appendChild(backPolyline);

  backBtn.appendChild(backSvg);
  const backText = document.createElement('span');
  backText.className = 'source-list__back-text';
  backText.textContent = 'Volver';
  backBtn.appendChild(backText);
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

  const addSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  addSvg.setAttribute('width', '20');
  addSvg.setAttribute('height', '20');
  addSvg.setAttribute('viewBox', '0 0 24 24');
  addSvg.setAttribute('fill', 'none');
  addSvg.setAttribute('stroke', 'currentColor');
  addSvg.setAttribute('stroke-width', '2');
  addSvg.setAttribute('stroke-linecap', 'round');
  addSvg.setAttribute('stroke-linejoin', 'round');
  addSvg.setAttribute('aria-hidden', 'true');

  const addLine1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  addLine1.setAttribute('x1', '12');
  addLine1.setAttribute('y1', '5');
  addLine1.setAttribute('x2', '12');
  addLine1.setAttribute('y2', '19');
  addSvg.appendChild(addLine1);

  const addLine2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  addLine2.setAttribute('x1', '5');
  addLine2.setAttribute('y1', '12');
  addLine2.setAttribute('x2', '19');
  addLine2.setAttribute('y2', '12');
  addSvg.appendChild(addLine2);

  addBtn.appendChild(addSvg);
  const addText = document.createElement('span');
  addText.textContent = 'Agregar fuente';
  addBtn.appendChild(addText);
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

    const headerCells = [
      { class: 'source-table__cell source-table__cell--kind', text: 'Tipo' },
      { class: 'source-table__cell source-table__cell--title', text: 'Título' },
      { class: 'source-table__cell source-table__cell--status', text: 'Estado' },
      { class: 'source-table__cell source-table__cell--chars', text: 'Tamaño' },
      { class: 'source-table__cell source-table__cell--enabled', text: 'Activo' },
      { class: 'source-table__cell source-table__cell--actions', text: 'Acciones' },
    ];

    for (const cell of headerCells) {
      const div = document.createElement('div');
      div.className = cell.class;
      div.setAttribute('role', 'columnheader');
      div.textContent = cell.text;
      header.appendChild(div);
    }

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

  const kindSpan = document.createElement('span');
  kindSpan.className = 'source-kind';
  const icon = getSourceKindIcon(source.kind);
  kindSpan.setAttribute('aria-label', icon);
  kindSpan.textContent = icon;
  kindCell.appendChild(kindSpan);

  // Celda: Título y origen
  const titleCell = document.createElement('div');
  titleCell.className = 'source-table__cell source-table__cell--title';
  titleCell.setAttribute('role', 'cell');

  const titleDiv = document.createElement('div');
  titleDiv.className = 'source-title';
  titleDiv.textContent = source.title;
  titleCell.appendChild(titleDiv);

  const originDiv = document.createElement('div');
  originDiv.className = 'source-origin';
  originDiv.textContent = source.origin;
  titleCell.appendChild(originDiv);

  if (source.previewText) {
    const previewDiv = document.createElement('div');
    previewDiv.className = 'source-preview';
    previewDiv.textContent = truncatePreview(source.previewText, 150);
    titleCell.appendChild(previewDiv);
  }

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

  const statusBadge = document.createElement('span');
  statusBadge.className = `status-badge ${statusClass}`;
  const statusLabel = statusLabels[source.status] || source.status;
  statusBadge.setAttribute('aria-label', `Estado: ${statusLabel}`);
  statusBadge.textContent = statusLabel;
  statusCell.appendChild(statusBadge);

  // Celda: Tamaño
  const charsCell = document.createElement('div');
  charsCell.className = 'source-table__cell source-table__cell--chars';
  charsCell.setAttribute('role', 'cell');
  charsCell.textContent = formatCharCount(source.charCount);

  // Celda: Switch habilitado
  const enabledCell = document.createElement('div');
  enabledCell.className = 'source-table__cell source-table__cell--enabled';
  enabledCell.setAttribute('role', 'cell');

  const toggleLabel = document.createElement('label');
  toggleLabel.className = 'toggle';
  toggleLabel.setAttribute('aria-label', `${source.enabled ? 'Desactivar' : 'Activar'} fuente`);

  const toggleInput = document.createElement('input');
  toggleInput.type = 'checkbox';
  toggleInput.className = 'toggle__input';
  toggleInput.setAttribute('data-action', 'toggle-source');
  toggleInput.setAttribute('data-source-id', source.id);
  if (source.enabled) {
    toggleInput.checked = true;
  }
  toggleLabel.appendChild(toggleInput);

  const toggleSlider = document.createElement('span');
  toggleSlider.className = 'toggle__slider';
  toggleLabel.appendChild(toggleSlider);

  enabledCell.appendChild(toggleLabel);

  // Celda: Acciones
  const actionsCell = document.createElement('div');
  actionsCell.className = 'source-table__cell source-table__cell--actions';
  actionsCell.setAttribute('role', 'cell');

  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'source-actions';

  // Edit button
  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'source-action source-action--edit';
  editBtn.setAttribute('data-action', 'edit-source');
  editBtn.setAttribute('data-source-id', source.id);
  editBtn.setAttribute('aria-label', 'Editar fuente');

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
  actionsDiv.appendChild(editBtn);

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'source-action source-action--delete';
  deleteBtn.setAttribute('data-action', 'delete-source');
  deleteBtn.setAttribute('data-source-id', source.id);
  deleteBtn.setAttribute('aria-label', 'Eliminar fuente');

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
  actionsDiv.appendChild(deleteBtn);

  actionsCell.appendChild(actionsDiv);

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

  const iconDiv = document.createElement('div');
  iconDiv.className = 'source-list__empty-icon';
  iconDiv.textContent = '📚';
  empty.appendChild(iconDiv);

  const title = document.createElement('h2');
  title.className = 'source-list__empty-title';
  title.textContent = 'Sin fuentes de conocimiento';
  empty.appendChild(title);

  const text = document.createElement('p');
  text.className = 'source-list__empty-text';
  text.textContent = 'Agrega tu primera fuente para que el asistente pueda responder con información de tu negocio.';
  empty.appendChild(text);

  return empty;
}

