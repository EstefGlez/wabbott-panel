/**
 * @param {string} email
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Correo requerido' };
  }
  const trimmed = email.trim();
  if (!trimmed) {
    return { valid: false, error: 'Correo requerido' };
  }
  if (!trimmed.includes('@')) {
    return { valid: false, error: 'Correo no válido (falta @)' };
  }
  const [local, domain] = trimmed.split('@', 2);
  if (!local || !domain) {
    return { valid: false, error: 'Correo no válido' };
  }
  if (!domain.includes('.')) {
    return { valid: false, error: 'Correo no válido (dominio incompleto)' };
  }
  return { valid: true };
}

/**
 * @param {Date} date
 * @returns {string}
 */
export function formatTimeHHMM(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Fecha inválida');
  }
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * @param {string} str
 * @returns {Date|null}
 */
export function parseTimeHHMM(str) {
  if (!str || typeof str !== 'string') return null;
  const match = str.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * @typedef {Object} NotificationSettings
 * @property {string} email
 * @property {string[]} events
 * @property {{enabled: boolean, from: string, to: string}} [quietHours]
 */

/**
 * @param {NotificationSettings} current
 * @param {Partial<NotificationSettings>} changes
 * @returns {NotificationSettings}
 */
export function mergeSettings(current, changes) {
  const merged = { ...current };

  if (changes.email !== undefined) {
    merged.email = changes.email;
  }

  if (changes.events !== undefined) {
    merged.events = [...changes.events];
  }

  if (changes.quietHours !== undefined) {
    if (changes.quietHours === null || changes.quietHours.enabled === false) {
      merged.quietHours = { enabled: false, from: '23:00', to: '08:00' };
    } else {
      merged.quietHours = {
        enabled: true,
        from: changes.quietHours.from ?? '23:00',
        to: changes.quietHours.to ?? '08:00',
      };
    }
  }

  return merged;
}

/**
 * @param {string} eventKey
 * @returns {string}
 */
export function getEventLabel(eventKey) {
  const labels = {
    waiting_human: 'Nueva conversación esperando asesor',
    unanswered_15min: 'Cliente escribe y nadie responde en 15 min',
    window_closing: 'Ventana por cerrar en conversaciones atendidas',
  };
  return labels[eventKey] ?? eventKey;
}