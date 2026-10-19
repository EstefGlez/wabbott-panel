/** @returns {readonly string[]} */
export const DESTINATIONS = Object.freeze(['conversaciones', 'negocios', 'ajustes']);

/**
 * Convierte un hash de la URL (p.ej. '#/negocios') en un destino válido.
 * @param {string} hash — window.location.hash (incluye #)
 * @returns {string} Uno de DESTINATIONS
 */
export function parseHash(hash) {
  if (!hash) {
    return 'conversaciones';
  }
  const path = hash.replace(/^#\/?/, '');
  if (DESTINATIONS.includes(path)) {
    return path;
  }
  return 'conversaciones';
}

/**
 * Indica si el destino coincide con el hash actual.
 * @param {string} currentHash — window.location.hash
 * @param {string} target — Uno de DESTINATIONS
 * @returns {boolean}
 */
export function isActive(currentHash, target) {
  return parseHash(currentHash) === target;
}