import { CONTEXT_LIMIT } from './contract.js';

const WARNING_THRESHOLD = Math.floor(CONTEXT_LIMIT * 0.8);

/**
 * @param {Object} source
 * @param {boolean} source.enabled
 * @param {'ready'|'processing'|'error'} source.status
 * @returns {boolean}
 */
export function isActiveSource(source) {
  return source.enabled === true && source.status === 'ready';
}

/**
 * @param {Object[]} sources
 * @returns {number}
 */
export function calculateTotalChars(sources) {
  return sources
    .filter(isActiveSource)
    .reduce((sum, s) => sum + (s.charCount || 0), 0);
}

/**
 * @param {number} total
 * @returns {'normal'|'warning'|'danger'}
 */
export function getBudgetLevel(total) {
  if (total > CONTEXT_LIMIT) return 'danger';
  if (total > WARNING_THRESHOLD) return 'warning';
  return 'normal';
}

/**
 * @param {'normal'|'warning'|'danger'} level
 * @returns {string|null}
 */
export function getBudgetMessage(level) {
  if (level === 'danger') {
    return 'Demasiado texto: el bot puede responder más lento o ignorar partes.';
  }
  return null;
}