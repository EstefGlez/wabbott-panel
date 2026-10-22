import { renderConversationList } from './conversationList.js';
import { renderConversationDetail as renderConversationDetailComponent } from './conversationDetail.js';
import { renderBusinessList } from './businessList.js';
import { renderBusinessDetail } from './businessDetail.js';
import { renderSourceList } from './sourceList.js';
import { renderSettings as renderSettingsView, renderEmailSection, renderEventsSection, renderQuietHoursSection } from './settings.js';

/**
 * Renderiza la pantalla de Conversaciones con lista completa.
 * @param {Object} state - Estado actual
 * @returns {HTMLElement} Sección de conversaciones
 */
export function renderConversations(state) {
  const section = document.createElement('section');
  section.id = 'conversaciones';
  section.className = 'screen screen--conversaciones';

  // La lista completa va aquí
  section.appendChild(renderConversationList(state));

  return section;
}

/**
 * Renderiza la pantalla de Negocios (lista).
 * @param {Object} state - Estado actual { businessColors: Object }
 * @returns {HTMLElement} Sección de negocios
 */
export function renderBusinesses(state) {
  const section = document.createElement('section');
  section.id = 'negocios';
  section.className = 'screen screen--negocios';

  section.appendChild(renderBusinessList(state));

  return section;
}

/**
 * Renderiza el detalle de un negocio.
 * @param {Object} state - Estado actual { currentBusiness, businessNumbers, businessColors }
 * @returns {HTMLElement} Sección de detalle de negocio
 */
export function renderBusinessDetailScreen(state) {
  const section = document.createElement('section');
  section.id = 'negocios';
  section.className = 'screen screen--negocios';

  const businessId = state.currentBusinessId;
  if (businessId) {
    section.appendChild(renderBusinessDetail(state, businessId));
  } else {
    section.appendChild(renderBusinessList(state));
  }

  return section;
}

/**
 * Vincula eventos de la sección de correo.
 * @param {HTMLElement} section
 * @param {Object} handlers
 */
function bindEmailEvents(section, handlers) {
  const emailInput = section.querySelector('#settings-email');
  const testBtn = section.querySelector('#settings-test-email');

  if (emailInput) {
    emailInput.addEventListener('change', () => {
      handlers.onEmailChange(emailInput.value.trim());
    });
    emailInput.addEventListener('blur', () => {
      handlers.onEmailChange(emailInput.value.trim());
    });
  }

  if (testBtn) {
    testBtn.addEventListener('click', handlers.onTestEmail);
  }
}

/**
 * Vincula eventos de la sección de eventos (toggles).
 * @param {HTMLElement} section
 * @param {Object} handlers
 */
function bindEventsEvents(section, handlers) {
  const toggles = section.querySelectorAll('.settings-toggle[value]');
  toggles.forEach(toggle => {
    toggle.addEventListener('change', () => {
      const events = Array.from(section.querySelectorAll('.settings-toggle[value]:checked'))
        .map(t => t.value);
      handlers.onEventsChange(events);
    });
  });
}

/**
 * Vincula eventos de la sección de horario de silencio.
 * @param {HTMLElement} section
 * @param {Object} handlers
 */
function bindQuietHoursEvents(section, handlers) {
  const enabledCheckbox = section.querySelector('#settings-quiet-enabled');
  const fromInput = section.querySelector('#settings-quiet-from');
  const toInput = section.querySelector('#settings-quiet-to');
  const timesContainer = section.querySelector('.settings-quiet-times');

  if (enabledCheckbox) {
    enabledCheckbox.addEventListener('change', () => {
      const enabled = enabledCheckbox.checked;
      if (timesContainer) timesContainer.hidden = !enabled;
      if (fromInput) fromInput.disabled = !enabled;
      if (toInput) toInput.disabled = !enabled;

      handlers.onQuietHoursChange({
        enabled,
        from: fromInput?.value ?? '23:00',
        to: toInput?.value ?? '08:00',
      });
    });
  }

  if (fromInput) {
    fromInput.addEventListener('change', () => {
      handlers.onQuietHoursChange({
        enabled: enabledCheckbox?.checked ?? false,
        from: fromInput.value,
        to: toInput?.value ?? '08:00',
      });
    });
  }

  if (toInput) {
    toInput.addEventListener('change', () => {
      handlers.onQuietHoursChange({
        enabled: enabledCheckbox?.checked ?? false,
        from: fromInput?.value ?? '23:00',
        to: toInput.value,
      });
    });
  }
}

/**
 * Renderiza la pantalla de Ajustes conectada al servicio.
 * @param {Object} state - Estado actual { service, currentHash, notificationSettings }
 * @returns {HTMLElement} Sección de ajustes
 */
export function renderSettingsScreen(state) {
  const section = document.createElement('section');
  section.id = 'ajustes';
  section.className = 'screen screen--ajustes';

  const settings = state.notificationSettings ?? {
    email: '',
    events: [],
    quietHours: { enabled: false, from: '23:00', to: '08:00' },
  };

  const handlers = {
    onEmailChange: async (email) => {
      state.notificationSettings = await state.service.saveNotificationSettings({ email });
      // Re-render solo la sección de email
      const emailSection = section.querySelector('[data-section="email"]');
      if (emailSection) {
        emailSection.outerHTML = renderEmailSection(state.notificationSettings, handlers.onEmailChange, handlers.onTestEmail);
        bindEmailEvents(section, handlers);
      }
    },
    onEventsChange: async (events) => {
      state.notificationSettings = await state.service.saveNotificationSettings({ events });
      // Re-render solo la sección de eventos
      const eventsSection = section.querySelector('[data-section="events"]');
      if (eventsSection) {
        eventsSection.outerHTML = renderEventsSection(state.notificationSettings, handlers.onEventsChange);
        bindEventsEvents(section, handlers);
      }
    },
    onQuietHoursChange: async (quietHours) => {
      state.notificationSettings = await state.service.saveNotificationSettings({ quietHours });
      // Re-render solo la sección de quiet hours
      const qhSection = section.querySelector('[data-section="quiet-hours"]');
      if (qhSection) {
        qhSection.outerHTML = renderQuietHoursSection(state.notificationSettings, handlers.onQuietHoursChange);
        bindQuietHoursEvents(section, handlers);
      }
    },
    onTestEmail: async () => {
      const { showToast } = await import('./toast.js');
      showToast(`Correo de prueba enviado a ${state.notificationSettings.email} (simulado)`, 'info');
    },
  };

  section.innerHTML = renderSettingsView(settings, handlers);

  // Vincular eventos iniciales
  bindEmailEvents(section, handlers);
  bindEventsEvents(section, handlers);
  bindQuietHoursEvents(section, handlers);

  return section;
}

/**
 * Renderiza la pantalla de Fuentes.
 * @param {Object} state - Estado actual
 * @returns {HTMLElement} Sección de fuentes
 */
export function renderSources(state) {
  const section = document.createElement('section');
  section.id = 'fuentes';
  section.className = 'screen screen--fuentes';

  section.appendChild(renderSourceList(state));

  return section;
}

/**
 * Renderiza la zona de detalle de conversación.
 * @param {Object} state - Estado actual { currentConversation, messages, businessColors }
 * @returns {HTMLElement} Sección de detalle
 */
export function renderConversationDetail(state) {
  return renderConversationDetailComponent(state);
}