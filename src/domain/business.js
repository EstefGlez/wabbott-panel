/**
 * @typedef {Object} Business
 * @property {string} id
 * @property {string} name
 * @property {string} color
 */

/**
 * Paleta de colores con alto contraste (≥4.5:1 sobre blanco).
 * Colores hexadecimales para badges de negocio.
 */
export const BUSINESS_COLOR_PALETTE = [
  '#1d4ed8', // blue-700
  '#15803d', // green-700
  '#c2410c', // orange-700
  '#9d174d', // pink-700
  '#6d28d9', // violet-700
  '#0d9488', // teal-700
  '#b45309', // amber-700
  '#be123c', // rose-700
];

/**
 * Valida el nombre de un negocio.
 * @param {string} name
 * @param {string[]} [existingNames=[]] - Nombres ya existentes (para detectar duplicados)
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateBusinessName(name, existingNames = []) {
  if (name === undefined || name === null) {
    return { valid: false, error: 'Nombre requerido' };
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'El nombre no puede estar vacío' };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'El nombre excede el límite de 100 caracteres' };
  }
  if (existingNames.map(n => n.toLowerCase().trim()).includes(trimmed.toLowerCase())) {
    return { valid: false, error: 'Ya existe un negocio con ese nombre' };
  }
  return { valid: true };
}

/**
 * Valida que un color sea un hexadecimal válido y esté en la paleta permitida.
 * @param {string} color
 * @returns {boolean}
 */
export function validateBusinessColor(color) {
  if (typeof color !== 'string') return false;
  const hexRegex = /^#[0-9a-fA-F]{6}$/;
  if (!hexRegex.test(color)) return false;
  return BUSINESS_COLOR_PALETTE.includes(color.toLowerCase());
}

/**
 * Obtiene la inicial del nombre del negocio en mayúscula.
 * @param {string} name
 * @returns {string}
 */
export function getBusinessInitial(name) {
  if (!name || typeof name !== 'string') return '?';
  const trimmed = name.trim();
  if (trimmed.length === 0) return '?';
  return trimmed.charAt(0).toUpperCase();
}