import { BUSINESS_COLOR_PALETTE, validateBusinessName, validateBusinessColor, getBusinessInitial } from '../domain/business.js';

/**
 * Abre un modal para crear o editar un negocio.
 * @param {Object} options
 * @param {Object} [options.business] - Negocio a editar (undefined para crear)
 * @param {string[]} [options.existingNames=[]] - Nombres existentes para validación de duplicados
 * @param {Function} options.onSubmit - Callback al enviar: (data) => Promise<void>
 * @returns {HTMLDialogElement}
 */
export function openBusinessModal({ business, existingNames = [], onSubmit }) {
  const isEditing = !!business;

  // Crear el diálogo
  const dialog = document.createElement('dialog');
  dialog.className = 'dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'business-modal-title');

  // Título del modal
  const title = isEditing ? 'Editar negocio' : 'Nuevo negocio';

  dialog.innerHTML = `
    <header class="dialog__header">
      <h2 id="business-modal-title" class="dialog__title">${title}</h2>
      <button type="button" class="dialog__close" aria-label="Cerrar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </header>
    <form class="modal-form" method="dialog">
      <div class="dialog__content">
        <!-- Campo: Nombre -->
        <div class="modal-form__field">
          <label for="business-name" class="modal-form__label">Nombre del negocio</label>
          <input
            type="text"
            id="business-name"
            name="name"
            class="modal-form__input"
            placeholder="Ej. Mi Empresa"
            value="${business?.name || ''}"
            maxlength="100"
            required
            autocomplete="off"
            autofocus
          >
          <p class="modal-form__error" id="business-name-error" aria-live="polite"></p>
        </div>

        <!-- Campo: Color (paleta) -->
        <div class="modal-form__field">
          <label class="modal-form__label">Color del badge</label>
          <fieldset class="color-palette" aria-label="Seleccionar color del negocio">
            ${BUSINESS_COLOR_PALETTE.map((color, index) => `
              <div class="color-palette__item">
                <input
                  type="radio"
                  name="color"
                  id="color-${index}"
                  class="color-palette__input"
                  value="${color}"
                  ${business?.color === color || (!isEditing && index === 0) ? 'checked' : ''}
                  aria-label="Color ${getColorName(color)}"
                >
                <label for="color-${index}" class="color-palette__swatch" style="--biz-color: ${color};" aria-hidden="true">
                  <span class="color-palette__initial" style="--biz-color: ${color};">${isEditing ? getBusinessInitial(business.name) : getBusinessInitial('Nuevo')}</span>
                </label>
              </div>
            `).join('')}
          </fieldset>
          <p class="modal-form__error" id="business-color-error" aria-live="polite"></p>
        </div>
      </div>

      <footer class="dialog__footer">
        <button type="button" class="dialog__btn dialog__btn--secondary" data-action="cancel">
          Cancelar
        </button>
        <button type="submit" class="dialog__btn dialog__btn--primary" data-action="submit">
          ${isEditing ? 'Guardar cambios' : 'Crear negocio'}
        </button>
      </footer>
    </form>
  `;

  // Referencias a elementos
  const form = dialog.querySelector('form');
  const nameInput = dialog.querySelector('#business-name');
  const nameError = dialog.querySelector('#business-name-error');
  const colorError = dialog.querySelector('#business-color-error');
  const cancelBtn = dialog.querySelector('[data-action="cancel"]');
  const submitBtn = dialog.querySelector('[data-action="submit"]');
  const closeBtn = dialog.querySelector('.dialog__close');

  // Validación en tiempo real del nombre
  let nameValidationTimer = null;
  nameInput.addEventListener('input', () => {
    clearTimeout(nameValidationTimer);
    nameValidationTimer = setTimeout(() => {
      validateNameField();
    }, 200);
  });

  function validateNameField() {
    const name = nameInput.value.trim();
    const validation = validateBusinessName(name, existingNames.filter(n => n !== business?.name));

    if (!validation.valid) {
      nameInput.classList.add('modal-form__input--error');
      nameError.textContent = validation.error;
      nameError.style.display = 'block';
      submitBtn.disabled = true;
      return false;
    } else {
      nameInput.classList.remove('modal-form__input--error');
      nameError.textContent = '';
      nameError.style.display = 'none';
      checkFormValidity();
      return true;
    }
  }

  function validateColorField() {
    const selectedColor = dialog.querySelector('input[name="color"]:checked');
    if (!selectedColor) {
      colorError.textContent = 'Selecciona un color';
      colorError.style.display = 'block';
      return false;
    } else {
      colorError.textContent = '';
      colorError.style.display = 'none';
      return true;
    }
  }

  function checkFormValidity() {
    const nameValid = validateNameField();
    const colorValid = validateColorField();
    submitBtn.disabled = !(nameValid && colorValid);
  }

  // Validación inicial
  checkFormValidity();

  // Manejar envío
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameValid = validateNameField();
    const colorValid = validateColorField();

    if (!nameValid || !colorValid) {
      return;
    }

    const selectedColor = dialog.querySelector('input[name="color"]:checked').value;
    const data = {
      name: nameInput.value.trim(),
      color: selectedColor,
    };

    submitBtn.disabled = true;
    submitBtn.textContent = isEditing ? 'Guardando...' : 'Creando...';

    try {
      await onSubmit(data);
      closeModal();
    } catch (error) {
      // Mostrar error del servidor
      nameInput.classList.add('modal-form__input--error');
      nameError.textContent = error.message || 'Error al guardar';
      nameError.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = isEditing ? 'Guardar cambios' : 'Crear negocio';
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
    // Pequeño delay para permitir animación de cierre
    setTimeout(() => {
      dialog.remove();
    }, 150);
  }

  // Abrir el modal
  document.body.appendChild(dialog);
  dialog.showModal();

  // Focus trap y focus inicial
  nameInput.focus();

  return dialog;
}

/**
 * Obtiene un nombre descriptivo para un color de la paleta.
 * @param {string} color
 * @returns {string}
 */
function getColorName(color) {
  const names = {
    '#1d4ed8': 'Azul',
    '#15803d': 'Verde',
    '#c2410c': 'Naranja',
    '#9d174d': 'Rosa',
    '#6d28d9': 'Violeta',
    '#0d9488': 'Verde azulado',
    '#b45309': 'Ámbar',
    '#be123c': 'Rojo rosado',
  };
  return names[color] || color;
}