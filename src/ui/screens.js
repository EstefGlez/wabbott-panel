/**
 * Renderiza la pantalla de Conversaciones.
 * @param {Object} state - Estado actual { currentHash: string }
 * @returns {HTMLElement} Sección de conversaciones
 */
export function renderConversations(state) {
  const section = document.createElement('section');
  section.id = 'conversaciones';
  section.className = 'screen screen--conversaciones';

  const h1 = document.createElement('h1');
  h1.textContent = 'Conversaciones';
  section.appendChild(h1);

  const p = document.createElement('p');
  p.textContent = 'Próximamente';
  section.appendChild(p);

  return section;
}

/**
 * Renderiza la pantalla de Negocios.
 * @param {Object} state - Estado actual { currentHash: string }
 * @returns {HTMLElement} Sección de negocios
 */
export function renderBusinesses(state) {
  const section = document.createElement('section');
  section.id = 'negocios';
  section.className = 'screen screen--negocios';

  const h1 = document.createElement('h1');
  h1.textContent = 'Negocios';
  section.appendChild(h1);

  const p = document.createElement('p');
  p.textContent = 'Próximamente';
  section.appendChild(p);

  return section;
}

/**
 * Renderiza la pantalla de Ajustes.
 * @param {Object} state - Estado actual { currentHash: string }
 * @returns {HTMLElement} Sección de ajustes
 */
export function renderSettings(state) {
  const section = document.createElement('section');
  section.id = 'ajustes';
  section.className = 'screen screen--ajustes';

  const h1 = document.createElement('h1');
  h1.textContent = 'Ajustes';
  section.appendChild(h1);

  const p = document.createElement('p');
  p.textContent = 'Próximamente';
  section.appendChild(p);

  return section;
}

/**
 * Renderiza la zona de detalle de conversación.
 * @param {Object} state - Estado actual { currentHash: string }
 * @returns {HTMLElement} Sección de detalle
 */
export function renderConversationDetail(state) {
  const aside = document.createElement('aside');
  aside.id = 'conversation-detail';
  aside.className = 'screen screen--detail';

  const h1 = document.createElement('h1');
  h1.textContent = 'Conversación';
  aside.appendChild(h1);

  const p = document.createElement('p');
  p.textContent = 'Próximamente';
  aside.appendChild(p);

  return aside;
}