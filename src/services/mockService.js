import { businesses, phoneNumbers } from '../mock/businesses.js';
import { sources } from '../mock/sources.js';
import { buildConversations, buildMessages } from '../mock/conversations.js';
import { digitsOnly } from '../domain/phone.js';

/**
 * @param {{ now?: () => Date }} options
 * @returns {Object}
 */
export function createMockService({ now = () => new Date() } = {}) {
  const currentNow = now();

  // Estado interno del servicio (copias para aislamiento)
  const state = {
    businesses: structuredClone(businesses),
    phoneNumbers: structuredClone(phoneNumbers),
    sources: structuredClone(sources),
    conversations: buildConversations(currentNow),
    messages: buildMessages(currentNow),
    notificationSettings: {
      email: 'admin@ejemplo.com',
      events: ['waiting_human', 'unanswered_15min', 'window_closing'],
      quietHours: { enabled: true, from: '23:00', to: '08:00' },
    },
  };

  // Helper para devolver copias
  const clone = (data) => structuredClone(data);

  async function listBusinesses() {
    return clone(state.businesses);
  }

  async function listNumbers(businessId) {
    return clone(state.phoneNumbers.filter(n => n.businessId === businessId));
  }

  async function listConversations({ businessId, handler, search } = {}) {
    let convs = state.conversations;

    if (businessId) {
      convs = convs.filter(c => c.businessId === businessId);
    }
    if (handler) {
      convs = convs.filter(c => c.handler === handler);
    }
    if (search !== undefined && search !== '') {
      const searchLower = search.toLowerCase();
      const searchDigits = digitsOnly(search);
      convs = convs.filter(c => {
        // Coincide por nombre
        if (c.customerName.toLowerCase().includes(searchLower)) return true;
        // Coincide por dígitos del teléfono si la búsqueda tiene dígitos
        if (searchDigits && c.customerPhone.includes(searchDigits)) return true;
        return false;
      });
    }

    // Orden: waiting_human primero, luego por lastCustomerMessageAt descendente
    convs.sort((a, b) => {
      const aWaiting = a.handler === 'waiting_human';
      const bWaiting = b.handler === 'waiting_human';
      if (aWaiting !== bWaiting) return bWaiting - aWaiting; // waiting_human primero
      return b.lastCustomerMessageAt.getTime() - a.lastCustomerMessageAt.getTime(); // más reciente primero
    });

    return clone(convs);
  }

  async function getConversation(id) {
    const conv = state.conversations.find(c => c.id === id);
    return conv ? clone(conv) : null;
  }

  async function listMessages(conversationId) {
    const msgs = state.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return clone(msgs);
  }

  async function listSources(businessId) {
    return clone(state.sources.filter(s => s.businessId === businessId));
  }

  async function getNotificationSettings() {
    return clone(state.notificationSettings);
  }

  // Métodos de escritura (no implementados en esta tarea)
  async function takeConversation() {
    throw new Error('No implementado');
  }

  async function returnToBot() {
    throw new Error('No implementado');
  }

  async function sendMessage() {
    throw new Error('No implementado');
  }

  async function updateConversation() {
    throw new Error('No implementado');
  }

  async function addSource() {
    throw new Error('No implementado');
  }

  async function toggleSource() {
    throw new Error('No implementado');
  }

  async function deleteSource() {
    throw new Error('No implementado');
  }

  async function saveNotificationSettings() {
    throw new Error('No implementado');
  }

  return {
    listBusinesses,
    listNumbers,
    listConversations,
    getConversation,
    listMessages,
    listSources,
    getNotificationSettings,
    takeConversation,
    returnToBot,
    sendMessage,
    updateConversation,
    addSource,
    toggleSource,
    deleteSource,
    saveNotificationSettings,
  };
}