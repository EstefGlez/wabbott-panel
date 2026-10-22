/**
 * Renderiza el formulario de login (S1).
 * @param {Object} state
 * @param {boolean} state.showError
 * @returns {string} HTML string
 */
export function renderLogin(state = {}) {
  const { showError = false } = state;
  return `
    <section class="login" aria-labelledby="login-title">
      <h1 id="login-title" class="login-title">Iniciar sesión</h1>
      <form id="login-form" class="login-form" novalidate>
        <div class="login-field">
          <label for="login-email" class="login-label">Correo</label>
          <input
            type="email"
            id="login-email"
            name="email"
            class="login-input"
            required
            autocomplete="email"
            aria-describedby="login-email-hint"
          >
          <span id="login-email-hint" class="login-hint">Tu correo de acceso</span>
        </div>
        <div class="login-field">
          <label for="login-password" class="login-label">Contraseña</label>
          <input
            type="password"
            id="login-password"
            name="password"
            class="login-input"
            required
            autocomplete="current-password"
            aria-describedby="login-password-hint"
          >
          <span id="login-password-hint" class="login-hint">Tu contraseña</span>
        </div>
        <p id="login-error" class="login-error" ${showError ? '' : 'hidden'}>Credenciales inválidas. Intenta de nuevo.</p>
        <button type="submit" class="btn btn-primary login-submit">Entrar</button>
      </form>
      <p class="login-forgot"><a href="#" id="login-forgot-link">¿Olvidaste tu contraseña?</a></p>
    </section>
  `;
}

/**
 * Vincula los eventos del formulario de login.
 * @param {Function} onLogin - Callback cuando el login es exitoso (recibe email, password)
 */
export function bindLoginEvents(onLogin) {
  const form = document.getElementById('login-form');
  if (!form) return;

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const email = formData.get('email')?.trim() ?? '';
    const password = formData.get('password')?.trim() ?? '';

    const errorEl = document.getElementById('login-error');
    if (!email || !password) {
      if (errorEl) errorEl.hidden = false;
      return;
    }

    if (errorEl) errorEl.hidden = true;
    onLogin(email, password);
  };

  form.addEventListener('submit', handleSubmit);
}

/**
 * Limpia los event listeners del login (para navegación).
 */
export function unbindLoginEvents() {
  const form = document.getElementById('login-form');
  if (!form) return;
  // Los listeners se limpian al reemplazar el innerHTML del contenedor
}