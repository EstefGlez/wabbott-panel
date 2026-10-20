import { digitsOnly, isValidWhatsAppNumber, formatPhone } from '../domain/phone.js';

/**
 * Abre un modal para crear o editar un número de WhatsApp.
 * @param {Object} options
 * @param {string} options.businessId - ID del negocio al que pertenece el número
 * @param {Object} [options.number] - Número a editar (undefined para crear)
 * @param {Function} options.onSubmit - Callback al enviar: (data) => Promise<void>
 * @returns {HTMLDialogElement}
 */
export function openNumberModal({ businessId, number, onSubmit }) {
  const isEditing = !!number;

  // Crear el diálogo
  const dialog = document.createElement('dialog');
  dialog.className = 'dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'number-modal-title');

  const title = isEditing ? 'Editar número' : 'Agregar número';

  dialog.innerHTML = `
    <header class="dialog__header">
      <h2 id="number-modal-title" class="dialog__title">${title}</h2>
      <button type="button" class="dialog__close" aria-label="Cerrar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </header>
    <form class="modal-form" method="dialog">
      <div class="dialog__content">
        <!-- Campo: Nombre para mostrar -->
        <div class="modal-form__field">
          <label for="number-display-name" class="modal-form__label">Nombre para mostrar</label>
          <input
            type="text"
            id="number-display-name"
            name="displayName"
            class="modal-form__input"
            placeholder="Ej. Línea principal, Soporte, Ventas"
            value="${number?.displayName || ''}"
            maxlength="50"
            required
            autocomplete="off"
            autofocus
          >
          <p class="modal-form__error" id="number-display-name-error" aria-live="polite"></p>
        </div>

        <!-- Campo: Número E.164 -->
        <div class="modal-form__field">
          <label for="number-e164" class="modal-form__label">Número de teléfono (formato E.164)</label>
          <input
            type="tel"
            id="number-e164"
            name="e164"
            class="modal-form__input"
            placeholder="+52 55 5555 0101"
            value="${number?.e164 || ''}"
            maxlength="20"
            required
            autocomplete="tel"
            inputmode="tel"
          >
          <p class="modal-form__hint">Formato: +[código país] [número]. Ej: +52 55 5555 0101</p>
          <p class="modal-form__error" id="number-e164-error" aria-live="polite"></p>
        </div>
      </div>

      <footer class="dialog__footer">
        <button type="button" class="dialog__btn dialog__btn--secondary" data-action="cancel">
          Cancelar
        </button>
        <button type="submit" class="dialog__btn dialog__btn--primary" data-action="submit">
          ${isEditing ? 'Guardar cambios' : 'Agregar número'}
        </button>
      </footer>
    </form>
  `;

  // Referencias a elementos
  const form = dialog.querySelector('form');
  const displayNameInput = dialog.querySelector('#number-display-name');
  const displayNameError = dialog.querySelector('#number-display-name-error');
  const e164Input = dialog.querySelector('#number-e164');
  const e164Error = dialog.querySelector('#number-e164-error');
  const cancelBtn = dialog.querySelector('[data-action="cancel"]');
  const submitBtn = dialog.querySelector('[data-action="submit"]');
  const closeBtn = dialog.querySelector('.dialog__close');

  // Formateo en vivo del número E.164
  e164Input.addEventListener('input', () => {
    // Permitir solo dígitos, espacios, +, -, (, )
    const cursorPos = e164Input.selectionStart;
    const oldValue = e164Input.value;
    let value = e164Input.value.replace(/[^\d+\-() ]/g, '');

    // Asegurar que empiece con +
    if (value && !value.startsWith('+')) {
      value = '+' + value;
    }

    e164Input.value = value;

    // Ajustar cursor (simple: mantener al final)
    if (value.length >= oldValue.length) {
      e164Input.setSelectionRange(value.length, value.length);
    }
  });

  // Validación en tiempo real
  let validationTimer = null;
  function validateDisplayName() {
    const value = displayNameInput.value.trim();
    if (!value) {
      displayNameInput.classList.add('modal-form__input--error');
      displayNameError.textContent = 'Nombre para mostrar requerido';
      displayNameError.style.display = 'block';
      return false;
    }
    if (value.length > 50) {
      displayNameInput.classList.add('modal-form__input--error');
      displayNameError.textContent = 'El nombre no puede exceder 50 caracteres';
      displayNameError.style.display = 'block';
      return false;
    }
    displayNameInput.classList.remove('modal-form__input--error');
    displayNameError.textContent = '';
    displayNameError.style.display = 'none';
    return true;
  }

  function validateE164() {
    const value = e164Input.value.trim();
    if (!value) {
      e164Input.classList.add('modal-form__input--error');
      e164Error.textContent = 'Teléfono requerido';
      e164Error.style.display = 'block';
      return false;
    }

    const digits = digitsOnly(value);
    if (!isValidWhatsAppNumber(value)) {
      e164Input.classList.add('modal-form__input--error');
      e164Error.textContent = 'Teléfono no válido (debe tener 10-15 dígitos)';
      e164Error.style.display = 'block';
      return false;
    }

    e164Input.classList.remove('modal-form__input--error');
    e164Error.textContent = '';
    e164Error.style.display = 'none';
    return true;
  }

  function checkFormValidity() {
    const nameValid = validateDisplayName();
    const phoneValid = validateE164();
    submitBtn.disabled = !(nameValid && phoneValid);
  }

  // Validar al escribir con debounce
  [displayNameInput, e164Input].forEach(input => {
    input.addEventListener('input', () => {
      clearTimeout(validationTimer);
      validationTimer = setTimeout(checkFormValidity, 200);
    });
  });

  // Validación inicial
  checkFormValidity();

  // Manejar envío
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameValid = validateDisplayName();
    const phoneValid = validateE164();

    if (!nameValid || !phoneValid) {
      return;
    }

    const digits = digitsOnly(e164Input.value.trim());
    const data = {
      displayName: displayNameInput.value.trim(),
      e164: `+${digits}`,
    };

    submitBtn.disabled = true;
    submitBtn.textContent = isEditing ? 'Guardando...' : 'Agregando...';

    try {
      await onSubmit(data);
      closeModal();
    } catch (error) {
      e164Input.classList.add('modal-form__input--error');
      e164Error.textContent = error.message || 'Error al guardar';
      e164Error.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = isEditing ? 'Guardar cambios' : 'Agregar número';
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
  displayNameInput.focus();

  return dialog;
}