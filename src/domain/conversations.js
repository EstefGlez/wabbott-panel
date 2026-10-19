/**
 * @typedef {{id:string, businessId:string, phoneNumberId:string, customerName:string|undefined, customerPhone:string, handler:'bot'|'waiting_human'|'human', handoffReason:string|undefined, stage:string, assignedTo:string|undefined, lastCustomerMessageAt:string, windowExpiresAt:string, waitingSince:string|undefined, lastUnansweredAt:string|undefined, unreadCount:number, tags:string[], notes:string, summary:string|undefined}} Conversation
 */

/**
 * Filtra conversaciones según filtros activos.
 * @param {Conversation[]} conversations
 * @param {Object} filters — { businessId: string|null, status: string, search: string }
 * @returns {Conversation[]}
 */
export function filterConversations(conversations, filters) {
  const { businessId, status, search } = filters;

  return conversations.filter(c => {
    if (businessId !== null && c.businessId !== businessId) {
      return false;
    }
    if (status !== 'all' && c.handler !== status) {
      return false;
    }
    // search se aplica en searchConversations, no aquí
    return true;
  });
}

/**
 * Ordena conversaciones: waiting_human primero, luego por lastCustomerMessageAt descendente.
 * @param {Conversation[]} conversations
 * @returns {Conversation[]}
 */
export function sortConversations(conversations) {
  const handlerPriority = {
    waiting_human: 0,
    human: 1,
    bot: 2,
  };

  return [...conversations].sort((a, b) => {
    const priorityDiff = handlerPriority[a.handler] - handlerPriority[b.handler];
    if (priorityDiff !== 0) {
      return priorityDiff;
    }
    // Mismo handler: más reciente primero (descendente)
    return new Date(b.lastCustomerMessageAt) - new Date(a.lastCustomerMessageAt);
  });
}

/**
 * Busca conversaciones por nombre, teléfono o último mensaje (case-insensitive).
 * Nota: la búsqueda por último mensaje requiere que la conversación tenga acceso a mensajes.
 * Aquí se busca por customerName y customerPhone.
 * @param {Conversation[]} conversations
 * @param {string} query
 * @returns {Conversation[]}
 */
export function searchConversations(conversations, query) {
  if (!query || !query.trim()) {
    return [...conversations];
  }

  const q = query.trim().toLowerCase();
  const qDigits = q.replace(/\D/g, '');
  const hasDigits = qDigits.length > 0;

  return conversations.filter(c => {
    // Buscar por nombre de cliente
    if (c.customerName && c.customerName.toLowerCase().includes(q)) {
      return true;
    }
    // Buscar por teléfono (solo dígitos) - solo si la query tiene dígitos
    if (hasDigits) {
      const phoneDigits = c.customerPhone.replace(/\D/g, '');
      if (phoneDigits.includes(qDigits)) {
        return true;
      }
    }
    return false;
  });
}