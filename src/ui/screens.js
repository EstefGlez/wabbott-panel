import { renderConversationList } from './conversationList.js';
import { renderConversationDetail as renderConversationDetailComponent } from './conversationDetail.js';
import { renderBusinessList } from './businessList.js';
import { renderBusinessDetail } from './businessDetail.js';
import { renderSourceList } from './sourceList.js';

/**
 * Renderiza la pantalla de Conversaciones con lista completa.
 * @param {Object} state - Estado actual
 * @returns {HTMLElement} Sección de conversaciones
 */
export function renderConversations(state) {
  const section = document.createElement('section');
  section.id = 'conversaciones';
  section.className = 'screen screen--conversaciones';

  // La lista completa va aquí
  section.appendChild(renderConversationList(state));

  return section;
}

/**
 * Renderiza la pantalla de Negocios (lista).
 * @param {Object} state - Estado actual { businessColors: Object }
 * @returns {HTMLElement} Sección de negocios
 */
export function renderBusinesses(state) {
  const section = document.createElement('section');
  section.id = 'negocios';
  section.className = 'screen screen--negocios';

  section.appendChild(renderBusinessList(state));

  return section;
}

/**
 * Renderiza el detalle de un negocio.
 * @param {Object} state - Estado actual { currentBusiness, businessNumbers, businessColors }
 * @returns {HTMLElement} Sección de detalle de negocio
 */
export function renderBusinessDetailScreen(state) {
  const section = document.createElement('section');
  section.id = 'negocios';
  section.className = 'screen screen--negocios';

  const businessId = state.currentBusinessId;
  if (businessId) {
    section.appendChild(renderBusinessDetail(state, businessId));
  } else {
    section.appendChild(renderBusinessList(state));
  }

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
 * Renderiza la pantalla de Fuentes.
 * @param {Object} state - Estado actual
 * @returns {HTMLElement} Sección de fuentes
 */
export function renderSources(state) {
  const section = document.createElement('section');
  section.id = 'fuentes';
  section.className = 'screen screen--fuentes';

  section.appendChild(renderSourceList(state));

  return section;
}

/**
 * Renderiza la zona de detalle de conversación.
 * @param {Object} state - Estado actual { currentConversation, messages, businessColors }
 * @returns {HTMLElement} Sección de detalle
 */
export function renderConversationDetail(state) {
  return renderConversationDetailComponent(state);
}