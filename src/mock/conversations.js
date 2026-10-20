import { businesses, phoneNumbers } from './businesses.js';
import { getWindowExpiration } from '../domain/window.js';

/**
 * @param {Date} now
 * @returns {Object[]}
 */
export function buildConversations(now) {
  const convSpecs = [
    // id, businessId, phoneNumberId, customerName, customerPhone, handler, minutesAgo, unreadCount, handoffReason
    ['conv-01', 'biz-gh', 'num-gh-1', 'Cliente Demo 1', '525555550901', 'bot', 60, 0, null],
    ['conv-02', 'biz-gh', 'num-gh-1', 'Cliente Demo 2', '525555550902', 'bot', 1200, 0, null],
    ['conv-03', 'biz-gh', 'num-gh-2', 'Cliente Demo 3', '525555550903', 'bot', 1800, 0, null],
    ['conv-04', 'biz-demo2', 'num-demo2-1', 'Cliente Demo 4', '525555550904', 'waiting_human', 120, 2, 'devolucion'],
    ['conv-05', 'biz-gh', 'num-gh-1', 'Cliente Demo 5', '525555550905', 'waiting_human', 1410, 0, 'envio'],
    ['conv-06', 'biz-demo3', 'num-demo3-1', 'Cliente Demo 6', '525555550906', 'waiting_human', 1140, 0, 'queja'],
    ['conv-07', 'biz-gh', 'num-gh-1', 'Cliente Demo 7', '525555550907', 'human', 180, 0, 'venta'],
    ['conv-08', 'biz-demo2', 'num-demo2-1', 'Cliente Demo 8', '525555550908', 'human', 1320, 0, 'envio'],
    ['conv-09', 'biz-demo3', 'num-demo3-2', 'Cliente Demo 9', '525555550909', 'human', 1395, 1, 'devolucion'],
    ['conv-10', 'biz-gh', 'num-gh-2', 'Cliente Demo 10', '525555550910', 'human', 1560, 0, 'venta'],
    ['conv-11', 'biz-demo2', 'num-demo2-1', 'Cliente Demo 11', '525555550911', 'bot', 90, 0, null],
    ['conv-12', 'biz-demo3', 'num-demo3-1', 'Cliente Demo 12', '525555550912', 'waiting_human', 2400, 0, 'medico'],
  ];

  return convSpecs.map(([id, businessId, phoneNumberId, customerName, customerPhone, handler, minutesAgo, unreadCount, handoffReason]) => {
    const lastCustomerMessageAt = new Date(now.getTime() - minutesAgo * 60 * 1000);
    return {
      id,
      businessId,
      phoneNumberId,
      customerName,
      customerPhone,
      handler,
      lastCustomerMessageAt,
      windowExpiresAt: getWindowExpiration(lastCustomerMessageAt).toISOString(),
      unreadCount,
      tags: [],
      notes: '',
      handoffReason,
    };
  });
}

/**
 * @param {Date} now
 * @returns {Object[]}
 */
export function buildMessages(now) {
  const conversations = buildConversations(now);
  const messages = [];

  // Helper para agregar mensaje
  const addMsg = (conversationId, n, author, type, body, minutesOffset, deliveryStatus) => {
    const conv = conversations.find(c => c.id === conversationId);
    const createdAt = new Date(conv.lastCustomerMessageAt.getTime() + minutesOffset * 60 * 1000);
    const msg = {
      id: `msg-${conversationId}-${n}`,
      conversationId,
      author,
      type,
      body,
      createdAt,
    };
    if (deliveryStatus !== undefined) msg.deliveryStatus = deliveryStatus;
    messages.push(msg);
    return createdAt;
  };

  // conv-01: bot, 60 min ago, 2 system events (take + return)
  addMsg('conv-01', 1, 'customer', 'text', 'Hola, quiero información', -60, undefined);
  addMsg('conv-01', 2, 'bot', 'text', 'Claro, ¿en qué le ayudo?', -59, 'delivered');
  addMsg('conv-01', 3, 'customer', 'text', '¿Tienen stock?', 0, undefined); // último mensaje del cliente coincide con lastCustomerMessageAt
  addMsg('conv-01', 4, 'system', 'system_event', 'Un asesor tomó la conversación', -3, undefined);
  addMsg('conv-01', 5, 'system', 'system_event', 'La conversación volvió al bot', -1, undefined);

  // conv-02: bot, 1200 min ago
  addMsg('conv-02', 1, 'customer', 'text', 'Buenos días', -1200, undefined);
  addMsg('conv-02', 2, 'bot', 'text', 'Hola, ¿en qué le ayudo?', -1199, 'delivered');
  addMsg('conv-02', 3, 'customer', 'text', 'Quiero cotizar', 0, undefined);

  // conv-03: bot, 1800 min ago (closed)
  addMsg('conv-03', 1, 'customer', 'text', 'Hola', -1800, undefined);
  addMsg('conv-03', 2, 'bot', 'text', 'Hola, ¿cómo le va?', -1799, 'delivered');
  addMsg('conv-03', 3, 'customer', 'text', 'Gracias', 0, undefined);

  // conv-04: waiting_human, 120 min ago, unread 2, devolucion
  addMsg('conv-04', 1, 'customer', 'text', 'Tengo un problema con mi pedido', -120, undefined);
  addMsg('conv-04', 2, 'bot', 'text', 'Lo siento, lo paso con un asesor', -119, 'delivered');
  addMsg('conv-04', 3, 'customer', 'text', 'Gracias', 0, undefined);

  // conv-05: waiting_human, 1410 min ago, envio
  addMsg('conv-05', 1, 'customer', 'text', '¿Dónde está mi envío?', -1410, undefined);
  addMsg('conv-05', 2, 'bot', 'text', 'Un momento, lo reviso', -1409, 'delivered');
  addMsg('conv-05', 3, 'customer', 'text', 'Entendido', 0, undefined);

  // conv-06: waiting_human, 1140 min ago, queja
  addMsg('conv-06', 1, 'customer', 'text', 'El producto llegó dañado', -1140, undefined);
  addMsg('conv-06', 2, 'bot', 'text', 'Disculpe, lo paso con soporte', -1139, 'delivered');
  addMsg('conv-06', 3, 'customer', 'text', 'Espero solución', 0, undefined);

  // conv-07: human, 180 min ago, venta, system event take
  addMsg('conv-07', 1, 'customer', 'text', 'Quiero comprar esto', -180, undefined);
  addMsg('conv-07', 2, 'bot', 'text', 'Perfecto, lo paso con ventas', -179, 'delivered');
  addMsg('conv-07', 3, 'system', 'system_event', 'Un asesor tomó la conversación', -5, undefined);
  addMsg('conv-07', 4, 'human', 'text', '¡Hola! Le ayudo con su compra', -3, 'delivered');
  addMsg('conv-07', 5, 'customer', 'text', 'Gracias, ¿qué métodos de pago?', 0, undefined);

  // conv-08: human, 1320 min ago, envio
  addMsg('conv-08', 1, 'customer', 'text', 'Mi pedido no ha llegado', -1320, undefined);
  addMsg('conv-08', 2, 'human', 'text', 'Reviso el tracking', -1319, 'delivered');
  addMsg('conv-08', 3, 'customer', 'text', 'Gracias', 0, undefined);

  // conv-09: human, 1395 min ago, devolucion, unread 1
  addMsg('conv-09', 1, 'customer', 'text', 'Quiero devolver un producto', -1395, undefined);
  addMsg('conv-09', 2, 'human', 'text', 'Claro, le explico el proceso', -1394, 'delivered');
  addMsg('conv-09', 3, 'customer', 'text', 'Entendido', 0, undefined);

  // conv-10: human, 1560 min ago, venta
  addMsg('conv-10', 1, 'customer', 'text', 'Me interesa ese producto', -1560, undefined);
  addMsg('conv-10', 2, 'human', 'text', 'Le cuento los detalles', -1559, 'delivered');
  addMsg('conv-10', 3, 'customer', 'text', 'Gracias', 0, undefined);

  // conv-11: bot, 90 min ago, incluye image y audio
  addMsg('conv-11', 1, 'customer', 'text', 'Hola, vi su catálogo', -90, undefined);
  addMsg('conv-11', 2, 'bot', 'text', '¡Gracias! ¿Le interesa algo?', -89, 'delivered');
  addMsg('conv-11', 3, 'customer', 'image', '[Imagen]', -5, undefined);
  addMsg('conv-11', 4, 'customer', 'audio', '[Audio]', -3, undefined);
  addMsg('conv-11', 5, 'customer', 'text', '¿Recibió mis archivos?', 0, undefined);
  addMsg('conv-11', 6, 'bot', 'text', 'Recibido, gracias', -1, 'delivered');

  // conv-12: waiting_human, 2400 min ago (closed), medico
  addMsg('conv-12', 1, 'customer', 'text', 'Tengo una urgencia médica', -2400, undefined);
  addMsg('conv-12', 2, 'bot', 'text', 'Lo paso con un asesor', -2399, 'delivered');
  addMsg('conv-12', 3, 'customer', 'text', 'Gracias', 0, undefined);

  // Ordenar por conversationId y luego createdAt
  messages.sort((a, b) => {
    if (a.conversationId !== b.conversationId) {
      return a.conversationId.localeCompare(b.conversationId);
    }
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  return messages;
}