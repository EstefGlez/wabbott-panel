/**
 * @typedef {{id:string, conversationId:string, author:'customer'|'bot'|'human'|'system', type:'text'|'image'|'audio'|'button'|'system_event', body:string, createdAt:string, deliveryStatus?:'sent'|'delivered'|'read'}} Message
 */

/**
 * Formatea hora de mensaje para hilo (HH:mm).
 * @param {string} isoString
 * @returns {string}
 */
export function formatMessageTime(isoString) {
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Agrupa mensajes por fecha para separadores de día.
 * @param {Message[]} messages
 * @param {Date} [now=new Date()] - Fecha actual para comparaciones (inyectable para tests)
 * @returns {Map<string, Message[]>}
 */
export function groupMessagesByDate(messages, now = new Date()) {
  const groups = new Map();

  const today = new Date(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const message of messages) {
    const date = new Date(message.createdAt);

    let key;
    if (date.toDateString() === today.toDateString()) {
      key = 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = 'Ayer';
    } else {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      key = `${day}/${month}/${year}`;
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(message);
  }

  return groups;
}

/**
 * Valida texto de mensaje para envío (no vacío, no solo espacios, máx 4096 chars).
 * @param {string} text
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateMessageText(text) {
  if (text === undefined || text === null) {
    return { valid: false, error: 'Mensaje requerido' };
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'El mensaje no puede estar vacío' };
  }
  if (trimmed.length > 4096) {
    return { valid: false, error: 'El mensaje excede el límite de 4096 caracteres' };
  }
  return { valid: true };
}

/**
 * Determina si un mensaje es de sistema (system_event).
 * @param {Message} message
 * @returns {boolean}
 */
export function isSystemMessage(message) {
  return message.type === 'system_event';
}

/**
 * Obtiene clase CSS para burbuja según autor.
 * @param {Message} message
 * @returns {string}
 */
export function getMessageBubbleClass(message) {
  switch (message.author) {
    case 'customer':
      return 'message-bubble--customer';
    case 'bot':
      return 'message-bubble--bot';
    case 'human':
      return 'message-bubble--human';
    case 'system':
      return 'message-bubble--system';
    default:
      return 'message-bubble--unknown';
  }
}