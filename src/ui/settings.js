import { getEventLabel } from '../domain/settings.js';

/**
 * Renderiza la pantalla completa de Ajustes (S6).
 * @param {Object} settings - NotificationSettings
 * @param {Object} handlers - Callbacks { onEmailChange, onEventsChange, onQuietHoursChange, onTestEmail }
 * @returns {string} HTML string
 */
export function renderSettings(settings, handlers = {}) {
  return `
    <section class="settings" aria-labelledby="settings-title">
      <h1 id="settings-title" class="settings-title">Ajustes</h1>
      ${renderEmailSection(settings, handlers.onEmailChange, handlers.onTestEmail)}
      ${renderEventsSection(settings, handlers.onEventsChange)}
      ${renderQuietHoursSection(settings, handlers.onQuietHoursChange)}
      ${renderPreviewSection()}
    </section>
  `;
}

/**
 * Sección: Correo de destino + botón prueba.
 * @param {Object} settings
 * @param {Function} onChange
 * @param {Function} onTestEmail
 * @returns {string}
 */
export function renderEmailSection(settings, onChange, onTestEmail) {
  return `
    <div class="settings-section" data-section="email">
      <h2 class="settings-section-title">Correo de destino</h2>
      <div class="settings-field">
        <label for="settings-email" class="settings-label">Correo</label>
        <input
          type="email"
          id="settings-email"
          class="settings-input"
          value="${escapeHtml(settings.email)}"
          autocomplete="email"
          aria-describedby="settings-email-hint"
        >
        <span id="settings-email-hint" class="settings-hint">Recibirás aquí los avisos configurados</span>
      </div>
      <button
        type="button"
        id="settings-test-email"
        class="btn btn-secondary settings-test-btn"
        aria-label="Enviar correo de prueba a ${escapeHtml(settings.email)}"
      >
        Enviar correo de prueba
      </button>
    </div>
  `;
}

/**
 * Sección: Eventos a avisar (3 toggles).
 * @param {Object} settings
 * @param {Function} onChange
 * @returns {string}
 */
export function renderEventsSection(settings, onChange) {
  const events = [
    { key: 'waiting_human', label: 'Nueva conversación esperando asesor', desc: 'Cuando una conversación entra en estado "Esperando asesor"' },
    { key: 'unanswered_15min', label: 'Cliente escribe y nadie responde en 15 min', desc: 'Aviso tras 15 minutos sin respuesta humana' },
    { key: 'window_closing', label: 'Ventana por cerrar en conversaciones atendidas', desc: 'Cuando la ventana de 24h está por cerrarse en conversaciones con humano' },
  ];

  const togglesHtml = events.map(ev => {
    const checked = settings.events.includes(ev.key) ? 'checked' : '';
    return `
      <label class="settings-toggle-label">
        <div class="settings-toggle-info">
          <strong>${escapeHtml(ev.label)}</strong>
          <small>${escapeHtml(ev.desc)}</small>
        </div>
        <div class="settings-toggle-wrapper">
          <input
            type="checkbox"
            class="settings-toggle"
            role="switch"
            id="settings-event-${ev.key}"
            value="${ev.key}"
            ${checked}
            aria-label="${escapeHtml(ev.label)}"
          >
          <span class="settings-toggle-slider" aria-hidden="true"></span>
        </div>
      </label>
    `;
  }).join('');

  return `
    <div class="settings-section" data-section="events">
      <h2 class="settings-section-title">Eventos a avisar</h2>
      <div class="settings-toggles">
        ${togglesHtml}
      </div>
    </div>
  `;
}

/**
 * Sección: Horario de silencio (checkbox + 2 inputs time).
 * @param {Object} settings
 * @param {Function} onChange
 * @returns {string}
 */
export function renderQuietHoursSection(settings, onChange) {
  const qh = settings.quietHours ?? { enabled: false, from: '23:00', to: '08:00' };
  const enabled = qh.enabled ? 'checked' : '';
  const disabled = qh.enabled ? '' : 'disabled';

  return `
    <div class="settings-section" data-section="quiet-hours">
      <h2 class="settings-section-title">Horario de silencio</h2>
      <label class="settings-toggle-label settings-toggle-label--full">
        <div class="settings-toggle-info">
          <strong>Activar horario de silencio</strong>
          <small>No se enviarán avisos durante este horario</small>
        </div>
        <div class="settings-toggle-wrapper">
          <input
            type="checkbox"
            class="settings-toggle"
            role="switch"
            id="settings-quiet-enabled"
            ${enabled}
            aria-label="Activar horario de silencio"
          >
          <span class="settings-toggle-slider" aria-hidden="true"></span>
        </div>
      </label>
      <div class="settings-quiet-times" ${qh.enabled ? '' : 'hidden'}>
        <div class="settings-field">
          <label for="settings-quiet-from" class="settings-label">Desde</label>
          <input
            type="time"
            id="settings-quiet-from"
            class="settings-input settings-input--time"
            value="${escapeHtml(qh.from)}"
            ${disabled}
            aria-label="Hora de inicio del silencio"
          >
        </div>
        <div class="settings-field">
          <label for="settings-quiet-to" class="settings-label">Hasta</label>
          <input
            type="time"
            id="settings-quiet-to"
            class="settings-input settings-input--time"
            value="${escapeHtml(qh.to)}"
            ${disabled}
            aria-label="Hora de fin del silencio"
          >
        </div>
      </div>
    </div>
  `;
}

/**
 * Sección: Vista previa del correo (estática).
 * @returns {string}
 */
export function renderPreviewSection() {
  return `
    <div class="settings-section settings-section--preview" data-section="preview">
      <h2 class="settings-section-title">Vista previa del correo</h2>
      <div class="settings-preview-card">
        <div class="settings-preview-header">
          <span class="settings-preview-label">Asunto:</span>
          <span class="settings-preview-value">Nueva conversación esperando asesor — GH Multimarcas</span>
        </div>
        <div class="settings-preview-body">
          <p>Hay una nueva conversación esperando asesor en <strong>GH Multimarcas</strong> (Ventas).</p>
          <p>Tiempo de espera: 4 min</p>
        </div>
        <div class="settings-preview-footer">
          <button type="button" class="btn btn-primary settings-preview-btn" disabled aria-disabled="true">Abrir panel</button>
        </div>
      </div>
      <p class="settings-preview-note">Los avisos por correo no incluyen nombre, teléfono, dirección ni mensajes del cliente por privacidad.</p>
    </div>
  `;
}

/**
 * Escapa HTML para prevenir XSS (solo textContent en UI, pero seguro para atributos).
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}