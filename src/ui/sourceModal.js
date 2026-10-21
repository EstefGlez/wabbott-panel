import { validateSourceInput, truncatePreview } from '../domain/source.js';
import { SOURCE_KINDS } from '../domain/contract.js';

/**
 * Tipos de pestañas para el modal de fuentes
 * @typedef {'url'|'file'|'text'} SourceTab
 */

/**
 * Mapea el tipo de pestaña al kind de fuente
 * @param {SourceTab} tab
 * @returns {'url'|'pdf'|'md'|'txt'|'text'}
 */
function tabToKind(tab) {
  switch (tab) {
    case 'url': return 'url';
    case 'file': return 'pdf'; // default para archivos, se puede cambiar
    case 'text': return 'text';
    default: return 'text';
  }
}

/**
 * Mapea el kind de fuente al tipo de pestaña
 * @param {'url'|'pdf'|'md'|'txt'|'text'} kind
 * @returns {SourceTab}
 */
function kindToTab(kind) {
  if (kind === 'url') return 'url';
  if (['pdf', 'md', 'txt'].includes(kind)) return 'file';
  return 'text';
}

/**
 * Obtiene las extensiones permitidas para un tipo de archivo
 * @param {'pdf'|'md'|'txt'|'text'} kind
 * @returns {string[]}
 */
function getAllowedExtensions(kind) {
  const extensions = {
    pdf: ['.pdf'],
    md: ['.md', '.markdown'],
    txt: ['.txt'],
    text: ['.txt', '.md', '.markdown', '.text'],
  };
  return extensions[kind] || [];
}

/**
 * Obtiene el label para un tipo de archivo
 * @param {'pdf'|'md'|'txt'|'text'} kind
 * @returns {string}
 */
function getFileKindLabel(kind) {
  const labels = {
    pdf: 'PDF',
    md: 'Markdown',
    txt: 'Texto plano',
    text: 'Texto',
  };
  return labels[kind] || kind;
}

/**
 * Abre un modal para crear o editar una fuente de conocimiento.
 * @param {Object} options
 * @param {string} options.businessId - ID del negocio
 * @param {Object} [options.source] - Fuente a editar (undefined para crear)
 * @param {Function} options.onSubmit - Callback al enviar: (data) => Promise<void>
 * @returns {HTMLDialogElement}
 */
export function openSourceModal({ businessId, source, onSubmit }) {
  const isEditing = !!source;
  const initialKind = source?.kind || 'url';
  const initialTab = kindToTab(initialKind);
  let activeTab = initialTab;
  let fileKind = initialKind === 'pdf' || initialKind === 'md' || initialKind === 'txt' ? initialKind : 'pdf';

  // Crear el diálogo
  const dialog = document.createElement('dialog');
  dialog.className = 'dialog dialog--source';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'source-modal-title');

  const title = isEditing ? 'Editar fuente' : 'Agregar fuente';

  // Build the dialog content programmatically to avoid innerHTML
  // Header
  const header = document.createElement('header');
  header.className = 'dialog__header';

  const h2 = document.createElement('h2');
  h2.id = 'source-modal-title';
  h2.className = 'dialog__title';
  h2.textContent = title;
  header.appendChild(h2);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'dialog__close';
  closeBtn.setAttribute('aria-label', 'Cerrar');

  const closeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  closeSvg.setAttribute('width', '20');
  closeSvg.setAttribute('height', '20');
  closeSvg.setAttribute('viewBox', '0 0 24 24');
  closeSvg.setAttribute('fill', 'none');
  closeSvg.setAttribute('stroke', 'currentColor');
  closeSvg.setAttribute('stroke-width', '2');
  closeSvg.setAttribute('stroke-linecap', 'round');
  closeSvg.setAttribute('stroke-linejoin', 'round');
  closeSvg.setAttribute('aria-hidden', 'true');

  const closeLine1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  closeLine1.setAttribute('x1', '18');
  closeLine1.setAttribute('y1', '6');
  closeLine1.setAttribute('x2', '6');
  closeLine1.setAttribute('y2', '18');
  closeSvg.appendChild(closeLine1);

  const closeLine2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  closeLine2.setAttribute('x1', '6');
  closeLine2.setAttribute('y1', '6');
  closeLine2.setAttribute('x2', '18');
  closeLine2.setAttribute('y2', '18');
  closeSvg.appendChild(closeLine2);

  closeBtn.appendChild(closeSvg);
  header.appendChild(closeBtn);
  dialog.appendChild(header);

  // Form
  const form = document.createElement('form');
  form.className = 'modal-form';
  form.setAttribute('method', 'dialog');

  const contentDiv = document.createElement('div');
  contentDiv.className = 'dialog__content';

  // Tabs navigation
  const tabsNav = document.createElement('nav');
  tabsNav.className = 'source-tabs';
  tabsNav.setAttribute('role', 'tablist');
  tabsNav.setAttribute('aria-label', 'Tipo de fuente');

  const tabs = [
    { tab: 'url', label: 'Enlace', active: true, iconPath: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6', iconPolyline: '15 3 21 3 21 9', iconLine: { x1: '10', y1: '14', x2: '21', y2: '3' } },
    { tab: 'file', label: 'Archivo', active: false, iconPath: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', iconPolyline: '14 2 14 8 20 8', iconLines: [{ x1: '16', y1: '13', x2: '8', y2: '13' }, { x1: '16', y1: '17', x2: '8', y2: '17' }], iconPolyline2: '10 9 9 9 8 9' },
    { tab: 'text', label: 'Texto pegado', active: false, iconPath: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', iconPolyline: '14 2 14 8 20 8', iconLines: [{ x1: '16', y1: '13', x2: '8', y2: '13' }, { x1: '16', y1: '17', x2: '8', y2: '17' }], iconPolyline2: '10 9 9 9 8 9' },
  ];

  for (const tab of tabs) {
    const tabBtn = document.createElement('button');
    tabBtn.type = 'button';
    tabBtn.setAttribute('role', 'tab');
    tabBtn.setAttribute('aria-selected', tab.active);
    tabBtn.setAttribute('data-tab', tab.tab);
    tabBtn.className = `source-tab${tab.active ? ' source-tab--active' : ''}`;
    tabBtn.setAttribute('aria-controls', `panel-${tab.tab}`);

    const tabSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    tabSvg.setAttribute('width', '18');
    tabSvg.setAttribute('height', '18');
    tabSvg.setAttribute('viewBox', '0 0 24 24');
    tabSvg.setAttribute('fill', 'none');
    tabSvg.setAttribute('stroke', 'currentColor');
    tabSvg.setAttribute('stroke-width', '2');
    tabSvg.setAttribute('stroke-linecap', 'round');
    tabSvg.setAttribute('stroke-linejoin', 'round');
    tabSvg.setAttribute('aria-hidden', 'true');

    const tabPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    tabPath.setAttribute('d', tab.iconPath);
    tabSvg.appendChild(tabPath);

    if (tab.iconPolyline) {
      const tabPolyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      tabPolyline.setAttribute('points', tab.iconPolyline);
      tabSvg.appendChild(tabPolyline);
    }

    if (tab.iconLine) {
      const tabLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tabLine.setAttribute('x1', tab.iconLine.x1);
      tabLine.setAttribute('y1', tab.iconLine.y1);
      tabLine.setAttribute('x2', tab.iconLine.x2);
      tabLine.setAttribute('y2', tab.iconLine.y2);
      tabSvg.appendChild(tabLine);
    }

    if (tab.iconLines) {
      for (const line of tab.iconLines) {
        const tabLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tabLine.setAttribute('x1', line.x1);
        tabLine.setAttribute('y1', line.y1);
        tabLine.setAttribute('x2', line.x2);
        tabLine.setAttribute('y2', line.y2);
        tabSvg.appendChild(tabLine);
      }
    }

    if (tab.iconPolyline2) {
      const tabPolyline2 = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      tabPolyline2.setAttribute('points', tab.iconPolyline2);
      tabSvg.appendChild(tabPolyline2);
    }

    tabBtn.appendChild(tabSvg);
    tabBtn.appendChild(document.createTextNode(` ${tab.label}`));
    tabsNav.appendChild(tabBtn);
  }

  contentDiv.appendChild(tabsNav);

  // Panel: Enlace
  const panelUrl = document.createElement('div');
  panelUrl.setAttribute('role', 'tabpanel');
  panelUrl.id = 'panel-url';
  panelUrl.className = 'source-panel source-panel--active';
  panelUrl.setAttribute('data-tab', 'url');

  // Title field for URL
  const urlTitleField = document.createElement('div');
  urlTitleField.className = 'modal-form__field';

  const urlTitleLabel = document.createElement('label');
  urlTitleLabel.className = 'modal-form__label';
  urlTitleLabel.setAttribute('for', 'source-title-url');
  urlTitleLabel.textContent = 'Título';
  urlTitleField.appendChild(urlTitleLabel);

  const urlTitleInput = document.createElement('input');
  urlTitleInput.type = 'text';
  urlTitleInput.id = 'source-title-url';
  urlTitleInput.name = 'title';
  urlTitleInput.className = 'modal-form__input';
  urlTitleInput.placeholder = 'Ej. Documentación oficial';
  urlTitleInput.value = source?.title || '';
  urlTitleInput.maxLength = 200;
  urlTitleInput.required = true;
  urlTitleInput.autocomplete = 'off';
  if (!isEditing) urlTitleInput.autofocus = true;
  urlTitleField.appendChild(urlTitleInput);

  const urlTitleError = document.createElement('p');
  urlTitleError.className = 'modal-form__error';
  urlTitleError.id = 'source-title-url-error';
  urlTitleError.setAttribute('aria-live', 'polite');
  urlTitleField.appendChild(urlTitleError);

  panelUrl.appendChild(urlTitleField);

  // Origin field for URL
  const urlOriginField = document.createElement('div');
  urlOriginField.className = 'modal-form__field';

  const urlOriginLabel = document.createElement('label');
  urlOriginLabel.className = 'modal-form__label';
  urlOriginLabel.setAttribute('for', 'source-origin-url');
  urlOriginLabel.textContent = 'URL';
  urlOriginField.appendChild(urlOriginLabel);

  const urlOriginInput = document.createElement('input');
  urlOriginInput.type = 'url';
  urlOriginInput.id = 'source-origin-url';
  urlOriginInput.name = 'origin';
  urlOriginInput.className = 'modal-form__input';
  urlOriginInput.placeholder = 'https://ejemplo.com/documento';
  urlOriginInput.value = source?.origin || '';
  urlOriginInput.maxLength = 500;
  urlOriginInput.required = true;
  urlOriginInput.autocomplete = 'url';
  urlOriginField.appendChild(urlOriginInput);

  const urlHint = document.createElement('p');
  urlHint.className = 'modal-form__hint';
  urlHint.textContent = 'Debe ser una URL válida (https://...)';
  urlOriginField.appendChild(urlHint);

  const urlOriginError = document.createElement('p');
  urlOriginError.className = 'modal-form__error';
  urlOriginError.id = 'source-origin-url-error';
  urlOriginError.setAttribute('aria-live', 'polite');
  urlOriginField.appendChild(urlOriginError);

  panelUrl.appendChild(urlOriginField);

  contentDiv.appendChild(panelUrl);

  // Panel: Archivo
  const panelFile = document.createElement('div');
  panelFile.setAttribute('role', 'tabpanel');
  panelFile.id = 'panel-file';
  panelFile.className = 'source-panel';
  panelFile.setAttribute('data-tab', 'file');
  panelFile.hidden = true;

  // Title field for File
  const fileTitleField = document.createElement('div');
  fileTitleField.className = 'modal-form__field';

  const fileTitleLabel = document.createElement('label');
  fileTitleLabel.className = 'modal-form__label';
  fileTitleLabel.setAttribute('for', 'source-title-file');
  fileTitleLabel.textContent = 'Título';
  fileTitleField.appendChild(fileTitleLabel);

  const fileTitleInput = document.createElement('input');
  fileTitleInput.type = 'text';
  fileTitleInput.id = 'source-title-file';
  fileTitleInput.name = 'title';
  fileTitleInput.className = 'modal-form__input';
  fileTitleInput.placeholder = 'Ej. Manual de usuario';
  fileTitleInput.value = source?.title || '';
  fileTitleInput.maxLength = 200;
  fileTitleInput.required = true;
  fileTitleInput.autocomplete = 'off';
  fileTitleField.appendChild(fileTitleInput);

  const fileTitleError = document.createElement('p');
  fileTitleError.className = 'modal-form__error';
  fileTitleError.id = 'source-title-file-error';
  fileTitleError.setAttribute('aria-live', 'polite');
  fileTitleField.appendChild(fileTitleError);

  panelFile.appendChild(fileTitleField);

  // File kind field
  const fileKindField = document.createElement('div');
  fileKindField.className = 'modal-form__field';

  const fileKindLabel = document.createElement('label');
  fileKindLabel.className = 'modal-form__label';
  fileKindLabel.textContent = 'Tipo de archivo';
  fileKindField.appendChild(fileKindLabel);

  const fileKindFieldset = document.createElement('fieldset');
  fileKindFieldset.className = 'file-kind-group';
  fileKindFieldset.setAttribute('aria-label', 'Seleccionar tipo de archivo');

  const fileKinds = ['pdf', 'md', 'txt', 'text'];
  for (const kind of fileKinds) {
    const label = document.createElement('label');
    label.className = 'file-kind-option';

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'file-kind';
    input.value = kind;
    input.className = 'file-kind-input';
    if (fileKind === kind) input.checked = true;
    input.setAttribute('aria-label', getFileKindLabel(kind));
    label.appendChild(input);

    const span = document.createElement('span');
    span.className = 'file-kind-label';
    span.textContent = getFileKindLabel(kind);
    label.appendChild(span);

    fileKindFieldset.appendChild(label);
  }

  fileKindField.appendChild(fileKindFieldset);

  const fileKindError = document.createElement('p');
  fileKindError.className = 'modal-form__error';
  fileKindError.id = 'source-file-kind-error';
  fileKindError.setAttribute('aria-live', 'polite');
  fileKindField.appendChild(fileKindError);

  panelFile.appendChild(fileKindField);

  // Origin field for File
  const fileOriginField = document.createElement('div');
  fileOriginField.className = 'modal-form__field';

  const fileOriginLabel = document.createElement('label');
  fileOriginLabel.className = 'modal-form__label';
  fileOriginLabel.setAttribute('for', 'source-origin-file');
  fileOriginLabel.textContent = 'Nombre del archivo';
  fileOriginField.appendChild(fileOriginLabel);

  const fileOriginInput = document.createElement('input');
  fileOriginInput.type = 'text';
  fileOriginInput.id = 'source-origin-file';
  fileOriginInput.name = 'origin';
  fileOriginInput.className = 'modal-form__input';
  fileOriginInput.placeholder = 'Ej. manual.pdf, notas.md, datos.txt';
  fileOriginInput.value = source?.origin || '';
  fileOriginInput.maxLength = 200;
  fileOriginInput.required = true;
  fileOriginInput.autocomplete = 'off';
  fileOriginField.appendChild(fileOriginInput);

  const fileHint = document.createElement('p');
  fileHint.className = 'modal-form__hint';
  fileHint.id = 'file-hint';
  fileHint.textContent = 'Extensiones permitidas: .pdf';
  fileOriginField.appendChild(fileHint);

  const fileOriginError = document.createElement('p');
  fileOriginError.className = 'modal-form__error';
  fileOriginError.id = 'source-origin-file-error';
  fileOriginError.setAttribute('aria-live', 'polite');
  fileOriginField.appendChild(fileOriginError);

  panelFile.appendChild(fileOriginField);

  contentDiv.appendChild(panelFile);

  // Panel: Texto pegado
  const panelText = document.createElement('div');
  panelText.setAttribute('role', 'tabpanel');
  panelText.id = 'panel-text';
  panelText.className = 'source-panel';
  panelText.setAttribute('data-tab', 'text');
  panelText.hidden = true;

  // Title field for Text
  const textTitleField = document.createElement('div');
  textTitleField.className = 'modal-form__field';

  const textTitleLabel = document.createElement('label');
  textTitleLabel.className = 'modal-form__label';
  textTitleLabel.setAttribute('for', 'source-title-text');
  textTitleLabel.textContent = 'Título';
  textTitleField.appendChild(textTitleLabel);

  const textTitleInput = document.createElement('input');
  textTitleInput.type = 'text';
  textTitleInput.id = 'source-title-text';
  textTitleInput.name = 'title';
  textTitleInput.className = 'modal-form__input';
  textTitleInput.placeholder = 'Ej. Notas internas';
  textTitleInput.value = source?.title || '';
  textTitleInput.maxLength = 200;
  textTitleInput.required = true;
  textTitleInput.autocomplete = 'off';
  textTitleField.appendChild(textTitleInput);

  const textTitleError = document.createElement('p');
  textTitleError.className = 'modal-form__error';
  textTitleError.id = 'source-title-text-error';
  textTitleError.setAttribute('aria-live', 'polite');
  textTitleField.appendChild(textTitleError);

  panelText.appendChild(textTitleField);

  // Content field for Text
  const textContentField = document.createElement('div');
  textContentField.className = 'modal-form__field';

  const textContentLabel = document.createElement('label');
  textContentLabel.className = 'modal-form__label';
  textContentLabel.setAttribute('for', 'source-content-text');
  textContentLabel.textContent = 'Contenido';
  textContentField.appendChild(textContentLabel);

  const textContentArea = document.createElement('textarea');
  textContentArea.id = 'source-content-text';
  textContentArea.name = 'content';
  textContentArea.className = 'modal-form__textarea';
  textContentArea.placeholder = 'Pega aquí el contenido de la fuente...';
  textContentArea.rows = 8;
  textContentArea.required = true;
  textContentArea.autocomplete = 'off';
  textContentArea.value = source?.previewText || '';
  textContentField.appendChild(textContentArea);

  const charCountHint = document.createElement('p');
  charCountHint.className = 'modal-form__hint';

  const charCountSpan = document.createElement('span');
  charCountSpan.id = 'char-count';
  charCountSpan.textContent = '0';
  charCountHint.appendChild(charCountSpan);

  charCountHint.appendChild(document.createTextNode(' caracteres (máx. 50000)'));
  textContentField.appendChild(charCountHint);

  const textContentError = document.createElement('p');
  textContentError.className = 'modal-form__error';
  textContentError.id = 'source-content-text-error';
  textContentError.setAttribute('aria-live', 'polite');
  textContentField.appendChild(textContentError);

  panelText.appendChild(textContentField);

  contentDiv.appendChild(panelText);

  // Preview container
  const previewContainer = document.createElement('div');
  previewContainer.className = 'source-preview-container';
  previewContainer.id = 'source-preview-container';
  previewContainer.hidden = true;

  const previewLabel = document.createElement('label');
  previewLabel.className = 'modal-form__label';
  previewLabel.textContent = 'Vista previa';
  previewContainer.appendChild(previewLabel);

  const previewBox = document.createElement('div');
  previewBox.className = 'source-preview-box';
  previewBox.id = 'source-preview-box';
  previewContainer.appendChild(previewBox);

  contentDiv.appendChild(previewContainer);

  // General error
  const generalError = document.createElement('p');
  generalError.className = 'modal-form__error modal-form__error--general';
  generalError.id = 'source-general-error';
  generalError.setAttribute('aria-live', 'polite');
  generalError.style.display = 'none';
  contentDiv.appendChild(generalError);

  form.appendChild(contentDiv);

  // Footer
  const footer = document.createElement('footer');
  footer.className = 'dialog__footer';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'dialog__btn dialog__btn--secondary';
  cancelBtn.setAttribute('data-action', 'cancel');
  cancelBtn.textContent = 'Cancelar';
  footer.appendChild(cancelBtn);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'dialog__btn dialog__btn--primary';
  submitBtn.setAttribute('data-action', 'submit');
  submitBtn.disabled = true;
  submitBtn.textContent = isEditing ? 'Guardar cambios' : 'Agregar fuente';
  footer.appendChild(submitBtn);

  form.appendChild(footer);
  dialog.appendChild(form);

  // Referencias a elementos (ya creados arriba, usamos las variables directamente)
  // const form = dialog.querySelector('form'); // ya tenemos 'form'
  const tabButtons = dialog.querySelectorAll('.source-tab');
  const panels = dialog.querySelectorAll('.source-panel');
  // const previewContainer ya definida arriba
  // const previewBox ya definida arriba
  // const charCountEl ya definida arriba como charCountSpan
  const fileHint = dialog.querySelector('#file-hint');
  // const generalError ya definida arriba
  // const cancelBtn ya definida arriba
  // const submitBtn ya definida arriba
  // const closeBtn ya definida arriba

  // Usar las variables ya creadas
  const charCountEl = charCountSpan;

  // Inputs por pestaña
  const inputs = {
    url: {
      title: dialog.querySelector('#source-title-url'),
      titleError: dialog.querySelector('#source-title-url-error'),
      origin: dialog.querySelector('#source-origin-url'),
      originError: dialog.querySelector('#source-origin-url-error'),
    },
    file: {
      title: dialog.querySelector('#source-title-file'),
      titleError: dialog.querySelector('#source-title-file-error'),
      kindInputs: dialog.querySelectorAll('input[name="file-kind"]'),
      kindError: dialog.querySelector('#source-file-kind-error'),
      origin: dialog.querySelector('#source-origin-file'),
      originError: dialog.querySelector('#source-origin-file-error'),
    },
    text: {
      title: dialog.querySelector('#source-title-text'),
      titleError: dialog.querySelector('#source-title-text-error'),
      content: dialog.querySelector('#source-content-text'),
      contentError: dialog.querySelector('#source-content-text-error'),
    },
  };

  // Validación en tiempo real
  let validationTimer = null;

  function validateUrlTab() {
    let valid = true;
    const title = inputs.url.title.value.trim();
    const origin = inputs.url.origin.value.trim();

    if (!title) {
      showError(inputs.url.title, inputs.url.titleError, 'Título requerido');
      valid = false;
    } else if (title.length > 200) {
      showError(inputs.url.title, inputs.url.titleError, 'El título excede 200 caracteres');
      valid = false;
    } else {
      clearError(inputs.url.title, inputs.url.titleError);
    }

    if (!origin) {
      showError(inputs.url.origin, inputs.url.originError, 'URL requerida');
      valid = false;
    } else {
      try {
        new URL(origin);
        clearError(inputs.url.origin, inputs.url.originError);
      } catch {
        showError(inputs.url.origin, inputs.url.originError, 'URL no válida');
        valid = false;
      }
    }

    return valid;
  }

  function validateFileTab() {
    let valid = true;
    const title = inputs.file.title.value.trim();
    const origin = inputs.file.origin.value.trim();
    const kindInput = dialog.querySelector('input[name="file-kind"]:checked');
    const kind = kindInput?.value || fileKind;

    if (!title) {
      showError(inputs.file.title, inputs.file.titleError, 'Título requerido');
      valid = false;
    } else if (title.length > 200) {
      showError(inputs.file.title, inputs.file.titleError, 'El título excede 200 caracteres');
      valid = false;
    } else {
      clearError(inputs.file.title, inputs.file.titleError);
    }

    if (!origin) {
      showError(inputs.file.origin, inputs.file.originError, 'Nombre de archivo requerido');
      valid = false;
    } else {
      const allowedExt = getAllowedExtensions(kind);
      const hasValidExt = allowedExt.some(ext => origin.toLowerCase().endsWith(ext));
      if (!hasValidExt) {
        showError(inputs.file.origin, inputs.file.originError, `Extensión no permitida para ${getFileKindLabel(kind)}. Permitidas: ${allowedExt.join(', ')}`);
        valid = false;
      } else {
        clearError(inputs.file.origin, inputs.file.originError);
      }
    }

    return valid;
  }

  function validateTextTab() {
    let valid = true;
    const title = inputs.text.title.value.trim();
    const content = inputs.text.content.value.trim();

    if (!title) {
      showError(inputs.text.title, inputs.text.titleError, 'Título requerido');
      valid = false;
    } else if (title.length > 200) {
      showError(inputs.text.title, inputs.text.titleError, 'El título excede 200 caracteres');
      valid = false;
    } else {
      clearError(inputs.text.title, inputs.text.titleError);
    }

    if (!content) {
      showError(inputs.text.content, inputs.text.contentError, 'Contenido requerido');
      valid = false;
    } else if (content.length > 50000) {
      showError(inputs.text.content, inputs.text.contentError, 'El contenido excede 50000 caracteres');
      valid = false;
    } else {
      clearError(inputs.text.content, inputs.text.contentError);
      // Actualizar preview
      previewBox.textContent = truncatePreview(content, 500);
    }

    return valid;
  }

  function validateActiveTab() {
    switch (activeTab) {
      case 'url': return validateUrlTab();
      case 'file': return validateFileTab();
      case 'text': return validateTextTab();
      default: return false;
    }
  }

  function checkFormValidity() {
    const tabValid = validateActiveTab();
    submitBtn.disabled = !tabValid;
  }

  function showError(input, errorEl, message) {
    input.classList.add('modal-form__input--error');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }

  function clearError(input, errorEl) {
    input.classList.remove('modal-form__input--error');
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }

  function showGeneralError(message) {
    generalError.textContent = message;
    generalError.style.display = 'block';
  }

  function clearGeneralError() {
    generalError.textContent = '';
    generalError.style.display = 'none';
  }

  // Cambio de pestaña
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab === activeTab) return;

      // Actualizar botones
      tabButtons.forEach(b => {
        b.classList.toggle('source-tab--active', b.dataset.tab === tab);
        b.setAttribute('aria-selected', b.dataset.tab === tab);
      });

      // Actualizar paneles
      panels.forEach(p => {
        const isActive = p.dataset.tab === tab;
        p.classList.toggle('source-panel--active', isActive);
        p.hidden = !isActive;
        if (isActive) p.setAttribute('aria-hidden', 'false');
        else p.setAttribute('aria-hidden', 'true');
      });

      activeTab = tab;
      clearGeneralError();
      checkFormValidity();

      // Mostrar/ocultar preview container
      previewContainer.hidden = activeTab !== 'text';

      // Actualizar hint de archivo
      if (activeTab === 'file') {
        updateFileHint();
      }

      // Focus en el primer input del panel activo
      const activePanel = dialog.querySelector(`.source-panel[data-tab="${tab}"]`);
      const firstInput = activePanel?.querySelector('input, textarea');
      firstInput?.focus();
    });
  });

  // Cambio de tipo de archivo
  inputs.file.kindInputs.forEach(input => {
    input.addEventListener('change', () => {
      fileKind = input.value;
      updateFileHint();
      validateFileTab();
      checkFormValidity();
    });
  });

  function updateFileHint() {
    const allowedExt = getAllowedExtensions(fileKind);
    fileHint.textContent = `Extensiones permitidas: ${allowedExt.join(', ')}`;
  }

  // Contador de caracteres y preview para texto
  inputs.text.content.addEventListener('input', () => {
    const length = inputs.text.content.value.length;
    charCountEl.textContent = length.toLocaleString();
    if (length > 50000) {
      charCountEl.style.color = '#dc2626';
    } else {
      charCountEl.style.color = '';
    }
    clearGeneralError();
    // Debounced validation
    clearTimeout(validationTimer);
    validationTimer = setTimeout(checkFormValidity, 200);
  });

  // Validación en tiempo real para otros campos
  const validateInputs = [
    inputs.url.title, inputs.url.origin,
    inputs.file.title, inputs.file.origin,
    inputs.text.title,
  ];

  validateInputs.forEach(input => {
    input.addEventListener('input', () => {
      clearTimeout(validationTimer);
      validationTimer = setTimeout(checkFormValidity, 200);
    });
  });

  // Validación inicial
  checkFormValidity();
  if (activeTab === 'text') {
    charCountEl.textContent = inputs.text.content.value.length.toLocaleString();
    previewBox.textContent = truncatePreview(inputs.text.content.value, 500);
  }
  updateFileHint();

  // Manejar envío
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const tabValid = validateActiveTab();
    if (!tabValid) return;

    const kind = activeTab === 'url' ? 'url' : activeTab === 'file' ? fileKind : 'text';
    const title = inputs[activeTab].title.value.trim();
    let origin;
    let charCount = 0;

    if (activeTab === 'url') {
      origin = inputs.url.origin.value.trim();
    } else if (activeTab === 'file') {
      origin = inputs.file.origin.value.trim();
    } else {
      origin = 'texto pegado';
      charCount = inputs.text.content.value.trim().length;
    }

    const data = { kind, title, origin, charCount };

    // Validación final con domain
    const validation = validateSourceInput(kind, data);
    if (!validation.valid) {
      showGeneralError(validation.error);
      return;
    }

    clearGeneralError();
    submitBtn.disabled = true;
    submitBtn.textContent = isEditing ? 'Guardando...' : 'Procesando...';

    try {
      await onSubmit(data);
      closeModal();
    } catch (error) {
      showGeneralError(error.message || 'Error al guardar');
      submitBtn.disabled = false;
      submitBtn.textContent = isEditing ? 'Guardar cambios' : 'Agregar fuente';
    }
  });

  // Cancelar
  cancelBtn.addEventListener('click', () => {
    closeModal();
  });

  closeBtn.addEventListener('click', () => {
    closeModal();
  });

  // Cerrar con ESC
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeModal();
  });

  // Cerrar al hacer click en backdrop
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      closeModal();
    }
  });

  function closeModal() {
    dialog.close();
    setTimeout(() => {
      dialog.remove();
    }, 150);
  }

  // Abrir el modal
  document.body.appendChild(dialog);
  dialog.showModal();

  // Focus inicial
  const firstInput = dialog.querySelector('.source-panel--active input, .source-panel--active textarea');
  firstInput?.focus();

  return dialog;
}