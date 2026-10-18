import { businesses, phoneNumbers } from '../mock/businesses.js';
import { sources } from '../mock/sources.js';
import { buildConversations, buildMessages } from '../mock/conversations.js';
import { digitsOnly } from '../domain/phone.js';
import { applyTake, applyReturnToBot, canSend } from '../domain/attention.js';
import { getWindowStatus } from '../domain/window.js';
import { SOURCE_KINDS } from '../domain/contract.js';

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

  // Contadores internos para IDs únicos
  let messageCounter = {};
  let sourceCounter = 0;

  // Inicializar contadores de mensajes con los máximos existentes
  for (const msg of state.messages) {
    const match = msg.id.match(/^msg-(.+)-\d+$/);
    if (match) {
      const convId = match[1];
      const n = parseInt(msg.id.split('-').pop(), 10);
      if (!messageCounter[convId] || n > messageCounter[convId]) {
        messageCounter[convId] = n;
      }
    }
  }

  function nextMessageId(conversationId) {
    const n = (messageCounter[conversationId] || 0) + 1;
    messageCounter[conversationId] = n;
    return `msg-${conversationId}-${n}`;
  }

  function nextSourceId() {
    sourceCounter += 1;
    return `src-new-${sourceCounter}`;
  }

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

  // Métodos de escritura
  async function takeConversation(id) {
    const idx = state.conversations.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Conversación no encontrada');

    const { conversation: newConv, event } = applyTake(state.conversations[idx], now());
    state.conversations[idx] = newConv;

    // Agregar evento al hilo de mensajes
    state.messages.push({
      ...event,
      id: nextMessageId(id),
      createdAt: new Date(event.createdAt),
    });

    return clone(newConv);
  }

  async function returnToBot(id) {
    const idx = state.conversations.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Conversación no encontrada');

    const { conversation: newConv, event } = applyReturnToBot(state.conversations[idx], now());
    state.conversations[idx] = newConv;

    state.messages.push({
      ...event,
      id: nextMessageId(id),
      createdAt: new Date(event.createdAt),
    });

    return clone(newConv);
  }

  async function sendMessage(id, text) {
    const conv = state.conversations.find(c => c.id === id);
    if (!conv) throw new Error('Conversación no encontrada');

    const trimmed = text?.trim?.() ?? '';
    if (!trimmed) throw new Error('El mensaje no puede estar vacío');

    const windowStatus = getWindowStatus(conv.lastCustomerMessageAt, now());
    const { allowed, reason } = canSend(conv.handler, windowStatus);
    if (!allowed) throw new Error(reason);

    const message = {
      id: nextMessageId(id),
      conversationId: id,
      author: 'human',
      type: 'text',
      body: trimmed,
      createdAt: now(),
      deliveryStatus: 'sent',
    };

    state.messages.push(message);
    return clone(message);
  }

  async function updateConversation(id, changes) {
    const idx = state.conversations.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Conversación no encontrada');

    const allowedFields = ['customerName', 'tags', 'notes'];
    const newConv = { ...state.conversations[idx] };

    for (const field of allowedFields) {
      if (changes[field] !== undefined) {
        newConv[field] = changes[field];
      }
    }

    state.conversations[idx] = newConv;
    return clone(newConv);
  }

  async function addSource(businessId, { kind, title, origin, charCount }) {
    if (!state.businesses.some(b => b.id === businessId)) {
      throw new Error('Negocio no encontrado');
    }
    if (!SOURCE_KINDS.includes(kind)) {
      throw new Error('Tipo de fuente no válido');
    }
    const trimmedTitle = title?.trim?.() ?? '';
    if (!trimmedTitle) throw new Error('Título requerido');
    if (!Number.isInteger(charCount) || charCount < 0) {
      throw new Error('Tamaño no válido');
    }

    const newSource = {
      id: nextSourceId(),
      businessId,
      kind,
      title: trimmedTitle,
      origin,
      status: 'ready',
      charCount,
      enabled: true,
      updatedAt: now(),
      previewText: '',
    };

    state.sources.push(newSource);
    return clone(newSource);
  }

  async function toggleSource(id, enabled) {
    const idx = state.sources.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Fuente no encontrada');
    if (typeof enabled !== 'boolean') throw new Error('Valor no válido');

    state.sources[idx] = {
      ...state.sources[idx],
      enabled,
      updatedAt: now(),
    };

    return clone(state.sources[idx]);
  }

  async function deleteSource(id) {
    const idx = state.sources.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Fuente no encontrada');
    state.sources.splice(idx, 1);
  }

  async function saveNotificationSettings(changes) {
    const { email, events, quietHours } = changes || {};

    if (email !== undefined) {
      if (typeof email !== 'string' || !email.includes('@')) {
        throw new Error('Correo no válido');
      }
      state.notificationSettings.email = email;
    }

    if (events !== undefined) {
      if (!Array.isArray(events) || !events.every(e => typeof e === 'string')) {
        throw new Error('Eventos no válidos');
      }
      state.notificationSettings.events = events;
    }

    if (quietHours !== undefined) {
      state.notificationSettings.quietHours = quietHours;
    }

    return clone(state.notificationSettings);
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