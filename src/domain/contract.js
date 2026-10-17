/** @typedef {Object} Business
 * @property {string} id
 * @property {string} name
 * @property {string} color
 */

/** @typedef {Object} PhoneNumber
 * @property {string} id
 * @property {string} businessId
 * @property {string} displayName
 * @property {string} e164
 * @property {string} status
 */

/** @typedef {Object} Conversation
 * @property {string} id
 * @property {string} businessId
 * @property {string} phoneNumberId
 * @property {string} [customerName]
 * @property {string} customerPhone
 * @property {'bot'|'waiting_human'|'human'} handler
 * @property {string} [handoffReason]
 * @property {Date|string|null} lastCustomerMessageAt
 * @property {number} unreadCount
 * @property {string[]} tags
 * @property {string} notes
 * @property {string} [summary]
 */

/** @typedef {Object} Message
 * @property {string} id
 * @property {string} conversationId
 * @property {'customer'|'bot'|'human'|'system'} author
 * @property {'text'|'image'|'audio'|'button'|'system_event'} type
 * @property {string} body
 * @property {Date|string} createdAt
 * @property {string} [deliveryStatus]
 */

/** @typedef {Object} KnowledgeSource
 * @property {string} id
 * @property {string} businessId
 * @property {'url'|'pdf'|'md'|'txt'|'text'} kind
 * @property {string} title
 * @property {string} origin
 * @property {'ready'|'processing'|'error'} status
 * @property {number} charCount
 * @property {boolean} enabled
 * @property {Date|string} updatedAt
 * @property {string} [previewText]
 */

/** @typedef {Object} NotificationSettings
 * @property {string} email
 * @property {string[]} events
 * @property {Object} [quietHours]
 */

export const HANDLERS = ['bot', 'waiting_human', 'human'];
export const MESSAGE_AUTHORS = ['customer', 'bot', 'human', 'system'];
export const MESSAGE_TYPES = ['text', 'image', 'audio', 'button', 'system_event'];
export const SOURCE_KINDS = ['url', 'pdf', 'md', 'txt', 'text'];
export const SOURCE_STATUSES = ['ready', 'processing', 'error'];
export const HANDOFF_REASONS = ['venta', 'envio', 'queja', 'devolucion', 'medico', 'otro'];
export const CONTEXT_LIMIT = 30000;
export const WINDOW_HOURS = 24;