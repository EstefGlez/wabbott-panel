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

  // Build dialog content programmatically
  // Header
  const header = document.createElement('header');
  header.className = 'dialog__header';

  const h2 = document.createElement('h2');
  h2.id = 'number-modal-title';
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

  // Display name field
  const displayNameField = document.createElement('div');
  displayNameField.className = 'modal-form__field';

  const displayNameLabel = document.createElement('label');
  displayNameLabel.className = 'modal-form__label';
  displayNameLabel.setAttribute('for', 'number-display-name');
  displayNameLabel.textContent = 'Nombre para mostrar';
  displayNameField.appendChild(displayNameLabel);

  const displayNameInput = document.createElement('input');
  displayNameInput.type = 'text';
  displayNameInput.id = 'number-display-name';
  displayNameInput.name = 'displayName';
  displayNameInput.className = 'modal-form__input';
  displayNameInput.placeholder = 'Ej. Línea principal, Soporte, Ventas';
  displayNameInput.value = number?.displayName || '';
  displayNameInput.maxLength = 50;
  displayNameInput.required = true;
  displayNameInput.autocomplete = 'off';
  displayNameInput.autofocus = true;
  displayNameField.appendChild(displayNameInput);

  const displayNameError = document.createElement('p');
  displayNameError.className = 'modal-form__error';
  displayNameError.id = 'number-display-name-error';
  displayNameError.setAttribute('aria-live', 'polite');
  displayNameField.appendChild(displayNameError);

  contentDiv.appendChild(displayNameField);

  // E.164 field
  const e164Field = document.createElement('div');
  e164Field.className = 'modal-form__field';

  const e164Label = document.createElement('label');
  e164Label.className = 'modal-form__label';
  e164Label.setAttribute('for', 'number-e164');
  e164Label.textContent = 'Número de teléfono (formato E.164)';
  e164Field.appendChild(e164Label);

  const e164Input = document.createElement('input');
  e164Input.type = 'tel';
  e164Input.id = 'number-e164';
  e164Input.name = 'e164';
  e164Input.className = 'modal-form__input';
  e164Input.placeholder = '+52 55 5555 0101';
  e164Input.value = number?.e164 || '';
  e164Input.maxLength = 20;
  e164Input.required = true;
  e164Input.autocomplete = 'tel';
  e164Input.inputMode = 'tel';
  e164Field.appendChild(e164Input);

  const e164Hint = document.createElement('p');
  e164Hint.className = 'modal-form__hint';
  e164Hint.textContent = 'Formato: +[código país] [número]. Ej: +52 55 5555 0101';
  e164Field.appendChild(e164Hint);

  const e164Error = document.createElement('p');
  e164Error.className = 'modal-form__error';
  e164Error.id = 'number-e164-error';
  e164Error.setAttribute('aria-live', 'polite');
  e164Field.appendChild(e164Error);

  contentDiv.appendChild(e164Field);

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
  submitBtn.textContent = isEditing ? 'Guardar cambios' : 'Agregar número';
  footer.appendChild(submitBtn);

  form.appendChild(footer);
  dialog.appendChild(form);

  // Referencias a elementos (ya creados arriba, usamos las variables directamente)
  // const form = dialog.querySelector('form'); // ya tenemos 'form'
  // const displayNameInput ya definido arriba
  // const displayNameError ya definido arriba
  // const e164Input ya definido arriba
  // const e164Error ya definido arriba
  // const cancelBtn ya definido arriba
  // const submitBtn ya definido arriba
  // const closeBtn ya definido arriba

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