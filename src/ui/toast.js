/**
 * Muestra un toast (notificación temporal) en la pantalla.
 * @param {string} message - Mensaje a mostrar
 * @param {'info'|'success'|'error'} type - Tipo de toast
 * @param {number} [duration=3000] - Duración en ms antes de auto-dismiss
 */
export function showToast(message, type = 'info', duration = 3000) {
  const container = getOrCreateContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;

  container.appendChild(toast);

  // Forzar reflow para activar animación de entrada
  toast.offsetHeight;

  toast.classList.add('toast-visible');

  const remove = () => {
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  };

  const timeoutId = setTimeout(remove, duration);

  // Permitir dismiss manual con click
  toast.addEventListener('click', () => {
    clearTimeout(timeoutId);
    remove();
  }, { once: true });
}

/**
 * @returns {HTMLElement}
 */
function getOrCreateContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }
  return container;
}