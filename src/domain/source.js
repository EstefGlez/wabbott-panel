/**
 * @typedef {Object} KnowledgeSource
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

export const CONTEXT_LIMIT = 30000;
export const SOURCE_KINDS = ['url', 'pdf', 'md', 'txt', 'text'];
export const SOURCE_STATUSES = ['ready', 'processing', 'error'];

/**
 * Valida los datos de entrada para una fuente según su tipo.
 * @param {'url'|'pdf'|'md'|'txt'|'text'} kind
 * @param {Object} data - { title: string, origin: string, charCount?: number }
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateSourceInput(kind, data) {
  if (!SOURCE_KINDS.includes(kind)) {
    return { valid: false, error: 'Tipo de fuente no válido' };
  }

  const { title, origin, charCount } = data || {};

  // Validar título
  if (title === undefined || title === null) {
    return { valid: false, error: 'Título requerido' };
  }
  const trimmedTitle = title.trim();
  if (trimmedTitle.length === 0) {
    return { valid: false, error: 'El título no puede estar vacío' };
  }
  if (trimmedTitle.length > 200) {
    return { valid: false, error: 'El título excede el límite de 200 caracteres' };
  }

  // Validar origen según tipo
  if (origin === undefined || origin === null) {
    return { valid: false, error: 'Origen requerido' };
  }
  const trimmedOrigin = origin.trim();
  if (trimmedOrigin.length === 0) {
    return { valid: false, error: 'El origen no puede estar vacío' };
  }

  if (kind === 'url') {
    // Validar formato URL
    try {
      new URL(trimmedOrigin);
    } catch {
      return { valid: false, error: 'URL no válida' };
    }
  } else if (['pdf', 'md', 'txt', 'text'].includes(kind)) {
    // Validar extensión de archivo
    const allowedExtensions = {
      pdf: ['.pdf'],
      md: ['.md', '.markdown'],
      txt: ['.txt'],
      text: ['.txt', '.md', '.markdown', '.text'],
    };
    const ext = allowedExtensions[kind] || [];
    const hasValidExt = ext.some(e => trimmedOrigin.toLowerCase().endsWith(e));
    if (!hasValidExt) {
      return { valid: false, error: `Extensión no permitida para tipo ${kind}. Permitidas: ${ext.join(', ')}` };
    }
  }

  // Validar charCount si se proporciona
  if (charCount !== undefined && charCount !== null) {
    if (!Number.isInteger(charCount) || charCount < 0) {
      return { valid: false, error: 'Tamaño no válido (debe ser entero ≥ 0)' };
    }
  }

  return { valid: true };
}

/**
 * Formatea un número de caracteres en formato legible.
 * @param {number} n
 * @returns {string}
 */
export function formatCharCount(n) {
  if (!Number.isInteger(n) || n < 0) return '0 chars';
  if (n >= 1000000) {
    return `${(n / 1000000).toFixed(1)}M chars`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1)}k chars`;
  }
  return `${n} chars`;
}

/**
 * Calcula el presupuesto de contexto sumando solo fuentes habilitadas.
 * @param {KnowledgeSource[]} sources
 * @param {number} [limit=30000]
 * @returns {{ totalChars: number, percentage: number, status: 'safe'|'warning'|'danger', message?: string }}
 */
export function calculateContextBudget(sources, limit = CONTEXT_LIMIT) {
  const totalChars = sources
    .filter(s => s.enabled === true)
    .reduce((sum, s) => sum + (Number.isInteger(s.charCount) ? s.charCount : 0), 0);

  const percentage = limit > 0 ? Math.round((totalChars / limit) * 100) : 0;

  let status = 'safe';
  let message = undefined;

  if (percentage > 100) {
    status = 'danger';
    message = `Límite de contexto superado (${percentage}%)`;
  } else if (percentage >= 80) {
    status = 'warning';
    message = `Próximo al límite de contexto (${percentage}%)`;
  }

  return { totalChars, percentage, status, message };
}

/**
 * Retorna un icono/etiqueta descriptiva para el tipo de fuente.
 * @param {'url'|'pdf'|'md'|'txt'|'text'} kind
 * @returns {string}
 */
export function getSourceKindIcon(kind) {
  const icons = {
    url: '🔗 URL',
    pdf: '📄 PDF',
    md: '📝 Markdown',
    txt: '📄 Texto',
    text: '📄 Texto',
  };
  return icons[kind] || '❓ Desconocido';
}

/**
 * Retorna la clase CSS variante para el badge de estado.
 * @param {'ready'|'processing'|'error'} status
 * @returns {string}
 */
export function getStatusBadgeClass(status) {
  const classes = {
    ready: 'status-badge--ready',
    processing: 'status-badge--processing',
    error: 'status-badge--error',
  };
  return classes[status] || 'status-badge--unknown';
}

/**
 * Trunca un texto a una longitud máxima añadiendo elipsis.
 * @param {string} text
 * @param {number} [max=500]
 * @returns {string}
 */
export function truncatePreview(text, max = 500) {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).trimEnd() + '…';
}