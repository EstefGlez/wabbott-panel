import { HANDLERS } from './contract.js';

/**
 * @param {'bot'|'waiting_human'|'human'} handler
 * @returns {string[]}
 */
export function getAvailableActions(handler) {
  if (!HANDLERS.includes(handler)) {
    throw new Error(`Estado de atención inválido: ${handler}`);
  }
  if (handler === 'human') return ['return_to_bot'];
  return ['take'];
}

/**
 * @param {'bot'|'waiting_human'|'human'} handler
 * @param {'green'|'amber'|'red'|'closed'} windowStatus
 * @returns {{ allowed: boolean, reason: string|null }}
 */
export function canSend(handler, windowStatus) {
  if (handler !== 'human') {
    return {
      allowed: false,
      reason: 'Toma la conversación para poder responder.',
    };
  }
  if (windowStatus === 'closed') {
    return {
      allowed: false,
      reason: 'La ventana de WhatsApp cerró. Escribe desde tu WhatsApp con el botón wa.me.',
    };
  }
  return { allowed: true, reason: null };
}

/**
 * @param {Object} conversation
 * @param {Date} now
 * @returns {{ conversation: Object, event: Object }}
 */
export function applyTake(conversation, now) {
  if (conversation.handler !== 'bot' && conversation.handler !== 'waiting_human') {
    throw new Error('Solo se puede tomar una conversación en estado bot o waiting_human');
  }

  const newConversation = { ...conversation, handler: 'human' };
  const event = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    conversationId: conversation.id,
    author: 'system',
    type: 'system_event',
    body: 'Un asesor tomó la conversación',
    createdAt: now,
  };

  return { conversation: newConversation, event };
}

/**
 * @param {Object} conversation
 * @param {Date} now
 * @returns {{ conversation: Object, event: Object }}
 */
export function applyReturnToBot(conversation, now) {
  if (conversation.handler !== 'human') {
    throw new Error('Solo se puede devolver al bot una conversación atendida por humano');
  }

  const newConversation = { ...conversation, handler: 'bot' };
  const event = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    conversationId: conversation.id,
    author: 'system',
    type: 'system_event',
    body: 'La conversación volvió al bot',
    createdAt: now,
  };

  return { conversation: newConversation, event };
}

/**
 * @param {Object} conversation
 * @returns {{ conversation: Object, event: null }}
 */
export function cancelReturnToBot(conversation) {
  return { conversation, event: null };
}