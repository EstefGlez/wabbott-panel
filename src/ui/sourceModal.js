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

  dialog.innerHTML = `
    <header class="dialog__header">
      <h2 id="source-modal-title" class="dialog__title">${title}</h2>
      <button type="button" class="dialog__close" aria-label="Cerrar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </header>
    <form class="modal-form" method="dialog">
      <div class="dialog__content">
        <!-- Tabs de navegación -->
        <nav class="source-tabs" role="tablist" aria-label="Tipo de fuente">
          <button type="button" role="tab" aria-selected="true" data-tab="url" class="source-tab source-tab--active" aria-controls="panel-url">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            <span>Enlace</span>
          </button>
          <button type="button" role="tab" aria-selected="false" data-tab="file" class="source-tab" aria-controls="panel-file">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>Archivo</span>
          </button>
          <button type="button" role="tab" aria-selected="false" data-tab="text" class="source-tab" aria-controls="panel-text">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>Texto pegado</span>
          </button>
        </nav>

        <!-- Panel: Enlace -->
        <div role="tabpanel" id="panel-url" class="source-panel source-panel--active" data-tab="url">
          <div class="modal-form__field">
            <label for="source-title-url" class="modal-form__label">Título</label>
            <input
              type="text"
              id="source-title-url"
              name="title"
              class="modal-form__input"
              placeholder="Ej. Documentación oficial"
              value="${source?.title || ''}"
              maxlength="200"
              required
              autocomplete="off"
              ${isEditing ? '' : 'autofocus'}
            >
            <p class="modal-form__error" id="source-title-url-error" aria-live="polite"></p>
          </div>

          <div class="modal-form__field">
            <label for="source-origin-url" class="modal-form__label">URL</label>
            <input
              type="url"
              id="source-origin-url"
              name="origin"
              class="modal-form__input"
              placeholder="https://ejemplo.com/documento"
              value="${source?.origin || ''}"
              maxlength="500"
              required
              autocomplete="url"
            >
            <p class="modal-form__hint">Debe ser una URL válida (https://...)</p>
            <p class="modal-form__error" id="source-origin-url-error" aria-live="polite"></p>
          </div>
        </div>

        <!-- Panel: Archivo -->
        <div role="tabpanel" id="panel-file" class="source-panel" data-tab="file" hidden>
          <div class="modal-form__field">
            <label for="source-title-file" class="modal-form__label">Título</label>
            <input
              type="text"
              id="source-title-file"
              name="title"
              class="modal-form__input"
              placeholder="Ej. Manual de usuario"
              value="${source?.title || ''}"
              maxlength="200"
              required
              autocomplete="off"
            >
            <p class="modal-form__error" id="source-title-file-error" aria-live="polite"></p>
          </div>

          <div class="modal-form__field">
            <label class="modal-form__label">Tipo de archivo</label>
            <fieldset class="file-kind-group" aria-label="Seleccionar tipo de archivo">
              ${['pdf', 'md', 'txt', 'text'].map(kind => `
                <label class="file-kind-option">
                  <input
                    type="radio"
                    name="file-kind"
                    value="${kind}"
                    class="file-kind-input"
                    ${fileKind === kind ? 'checked' : ''}
                    aria-label="${getFileKindLabel(kind)}"
                  >
                  <span class="file-kind-label">${getFileKindLabel(kind)}</span>
                </label>
              `).join('')}
            </fieldset>
            <p class="modal-form__error" id="source-file-kind-error" aria-live="polite"></p>
          </div>

          <div class="modal-form__field">
            <label for="source-origin-file" class="modal-form__label">Nombre del archivo</label>
            <input
              type="text"
              id="source-origin-file"
              name="origin"
              class="modal-form__input"
              placeholder="Ej. manual.pdf, notas.md, datos.txt"
              value="${source?.origin || ''}"
              maxlength="200"
              required
              autocomplete="off"
            >
            <p class="modal-form__hint" id="file-hint">Extensiones permitidas: .pdf</p>
            <p class="modal-form__error" id="source-origin-file-error" aria-live="polite"></p>
          </div>
        </div>

        <!-- Panel: Texto pegado -->
        <div role="tabpanel" id="panel-text" class="source-panel" data-tab="text" hidden>
          <div class="modal-form__field">
            <label for="source-title-text" class="modal-form__label">Título</label>
            <input
              type="text"
              id="source-title-text"
              name="title"
              class="modal-form__input"
              placeholder="Ej. Notas internas"
              value="${source?.title || ''}"
              maxlength="200"
              required
              autocomplete="off"
            >
            <p class="modal-form__error" id="source-title-text-error" aria-live="polite"></p>
          </div>

          <div class="modal-form__field">
            <label for="source-content-text" class="modal-form__label">Contenido</label>
            <textarea
              id="source-content-text"
              name="content"
              class="modal-form__textarea"
              placeholder="Pega aquí el contenido de la fuente..."
              rows="8"
              required
              autocomplete="off"
            >${source?.previewText || ''}</textarea>
            <p class="modal-form__hint">
              <span id="char-count">0</span> caracteres (máx. 50000)
            </p>
            <p class="modal-form__error" id="source-content-text-error" aria-live="polite"></p>
          </div>
        </div>

        <!-- Preview (solo para texto pegado) -->
        <div class="source-preview-container" id="source-preview-container" hidden>
          <label class="modal-form__label">Vista previa</label>
          <div class="source-preview-box" id="source-preview-box"></div>
        </div>

        <!-- Error general -->
        <p class="modal-form__error modal-form__error--general" id="source-general-error" aria-live="polite" style="display: none;"></p>
      </div>

      <footer class="dialog__footer">
        <button type="button" class="dialog__btn dialog__btn--secondary" data-action="cancel">
          Cancelar
        </button>
        <button type="submit" class="dialog__btn dialog__btn--primary" data-action="submit" disabled>
          ${isEditing ? 'Guardar cambios' : 'Agregar fuente'}
        </button>
      </footer>
    </form>
  `;

  // Referencias a elementos
  const form = dialog.querySelector('form');
  const tabButtons = dialog.querySelectorAll('.source-tab');
  const panels = dialog.querySelectorAll('.source-panel');
  const previewContainer = dialog.querySelector('#source-preview-container');
  const previewBox = dialog.querySelector('#source-preview-box');
  const charCountEl = dialog.querySelector('#char-count');
  const fileHint = dialog.querySelector('#file-hint');
  const generalError = dialog.querySelector('#source-general-error');
  const cancelBtn = dialog.querySelector('[data-action="cancel"]');
  const submitBtn = dialog.querySelector('[data-action="submit"]');
  const closeBtn = dialog.querySelector('.dialog__close');

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