import { WINDOW_HOURS } from './contract.js';

const MS_PER_HOUR = 60 * 60 * 1000;
const WINDOW_MS = WINDOW_HOURS * MS_PER_HOUR;

/**
 * @param {Date|string|null} lastCustomerMessageAt
 * @returns {Date|null}
 */
export function getWindowExpiration(lastCustomerMessageAt) {
  if (lastCustomerMessageAt === null) return null;
  const lastMsg = lastCustomerMessageAt instanceof Date
    ? lastCustomerMessageAt
    : new Date(lastCustomerMessageAt);
  return new Date(lastMsg.getTime() + WINDOW_MS);
}

/**
 * @param {Date|string|null} lastCustomerMessageAt
 * @param {Date} now
 * @returns {number}
 */
export function getWindowRemainingMs(lastCustomerMessageAt, now) {
  if (lastCustomerMessageAt === null) return 0;
  const lastMsg = lastCustomerMessageAt instanceof Date
    ? lastCustomerMessageAt
    : new Date(lastCustomerMessageAt);
  const expiration = lastMsg.getTime() + WINDOW_MS;
  return expiration - now.getTime();
}

/**
 * @param {Date|string|null} lastCustomerMessageAt
 * @param {Date} now
 * @returns {'green'|'amber'|'red'|'closed'}
 */
export function getWindowStatus(lastCustomerMessageAt, now) {
  const remainingMs = getWindowRemainingMs(lastCustomerMessageAt, now);

  if (remainingMs <= 0) return 'closed';
  if (remainingMs > 6 * MS_PER_HOUR) return 'green';
  if (remainingMs >= 1 * MS_PER_HOUR) return 'amber';
  return 'red';
}

/**
 * @param {Date|string|null} lastCustomerMessageAt
 * @param {Date} now
 * @returns {{ status: 'green'|'amber'|'red'|'closed', label: string }}
 */
export function getWindowChip(lastCustomerMessageAt, now) {
  const status = getWindowStatus(lastCustomerMessageAt, now);

  if (status === 'closed') {
    return { status, label: 'Cerrada' };
  }

  const remainingMs = getWindowRemainingMs(lastCustomerMessageAt, now);
  const totalMinutes = Math.floor(remainingMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let label;
  if (hours > 0) {
    label = `Quedan ${hours} h ${minutes} min`;
  } else {
    label = `Quedan ${minutes} min`;
  }

  return { status, label };
}