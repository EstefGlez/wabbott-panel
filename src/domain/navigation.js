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

  // Exact match for main destinations
  if (DESTINATIONS.includes(path)) {
    return path;
  }

  // Check for business detail route: #/negocios/:id (where :id is non-empty and no extra segments)
  const detailMatch = path.match(/^negocios\/([^/]+)$/);
  if (detailMatch) {
    return 'negocios';
  }

  // Check for sources route: #/negocios/:id/fuentes
  const sourcesMatch = path.match(/^negocios\/([^/]+)\/fuentes$/);
  if (sourcesMatch) {
    return 'negocios';
  }

  return 'conversaciones';
}

/**
 * Extrae el businessId del hash si es una ruta de negocio.
 * @param {string} hash — window.location.hash (incluye #)
 * @returns {string|null} businessId o null si no aplica
 */
export function getBusinessIdFromHash(hash) {
  if (!hash) return null;
  const path = hash.replace(/^#\/?/, '');

  // #/negocios/:id
  const detailMatch = path.match(/^negocios\/([^/]+)$/);
  if (detailMatch) return detailMatch[1];

  // #/negocios/:id/fuentes
  const sourcesMatch = path.match(/^negocios\/([^/]+)\/fuentes$/);
  if (sourcesMatch) return sourcesMatch[1];

  return null;
}

/**
 * Indica si el hash corresponde a la vista de fuentes.
 * @param {string} hash — window.location.hash
 * @returns {boolean}
 */
export function isSourcesView(hash) {
  if (!hash) return false;
  const path = hash.replace(/^#\/?/, '');
  return path.match(/^negocios\/[^/]+\/fuentes$/) !== null;
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