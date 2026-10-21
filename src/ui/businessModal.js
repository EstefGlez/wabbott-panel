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

  // Build dialog content programmatically
  // Header
  const header = document.createElement('header');
  header.className = 'dialog__header';

  const h2 = document.createElement('h2');
  h2.id = 'business-modal-title';
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

  // Name field
  const nameField = document.createElement('div');
  nameField.className = 'modal-form__field';

  const nameLabel = document.createElement('label');
  nameLabel.className = 'modal-form__label';
  nameLabel.setAttribute('for', 'business-name');
  nameLabel.textContent = 'Nombre del negocio';
  nameField.appendChild(nameLabel);

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.id = 'business-name';
  nameInput.name = 'name';
  nameInput.className = 'modal-form__input';
  nameInput.placeholder = 'Ej. Mi Empresa';
  nameInput.value = business?.name || '';
  nameInput.maxLength = 100;
  nameInput.required = true;
  nameInput.autocomplete = 'off';
  nameInput.autofocus = true;
  nameField.appendChild(nameInput);

  const nameError = document.createElement('p');
  nameError.className = 'modal-form__error';
  nameError.id = 'business-name-error';
  nameError.setAttribute('aria-live', 'polite');
  nameField.appendChild(nameError);

  contentDiv.appendChild(nameField);

  // Color palette field
  const colorField = document.createElement('div');
  colorField.className = 'modal-form__field';

  const colorLabel = document.createElement('label');
  colorLabel.className = 'modal-form__label';
  colorLabel.textContent = 'Color del badge';
  colorField.appendChild(colorLabel);

  const colorFieldset = document.createElement('fieldset');
  colorFieldset.className = 'color-palette';
  colorFieldset.setAttribute('aria-label', 'Seleccionar color del negocio');

  for (const [index, color] of BUSINESS_COLOR_PALETTE.entries()) {
    const item = document.createElement('div');
    item.className = 'color-palette__item';

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'color';
    input.id = `color-${index}`;
    input.className = 'color-palette__input';
    input.value = color;
    if (business?.color === color || (!isEditing && index === 0)) {
      input.checked = true;
    }
    input.setAttribute('aria-label', `Color ${getColorName(color)}`);
    item.appendChild(input);

    const label = document.createElement('label');
    label.setAttribute('for', `color-${index}`);
    label.className = 'color-palette__swatch';
    label.style.setProperty('--biz-color', color);
    label.setAttribute('aria-hidden', 'true');

    const initial = document.createElement('span');
    initial.className = 'color-palette__initial';
    initial.style.setProperty('--biz-color', color);
    initial.textContent = isEditing ? getBusinessInitial(business.name) : getBusinessInitial('Nuevo');
    label.appendChild(initial);

    item.appendChild(label);
    colorFieldset.appendChild(item);
  }

  colorField.appendChild(colorFieldset);

  const colorError = document.createElement('p');
  colorError.className = 'modal-form__error';
  colorError.id = 'business-color-error';
  colorError.setAttribute('aria-live', 'polite');
  colorField.appendChild(colorError);

  contentDiv.appendChild(colorField);

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
  submitBtn.textContent = isEditing ? 'Guardar cambios' : 'Crear negocio';
  footer.appendChild(submitBtn);

  form.appendChild(footer);
  dialog.appendChild(form);

  // Referencias a elementos (ya creados arriba, usamos las variables directamente)
  // const form = dialog.querySelector('form'); // ya tenemos 'form'
  // const nameInput ya definido arriba
  // const nameError ya definido arriba
  // const colorError ya definido arriba
  // const cancelBtn ya definido arriba
  // const submitBtn ya definido arriba
  // const closeBtn ya definido arriba

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