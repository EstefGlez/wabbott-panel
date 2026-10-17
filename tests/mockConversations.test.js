import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildConversations, buildMessages } from '../src/mock/conversations.js';
import { HANDLERS, HANDOFF_REASONS } from '../src/domain/contract.js';
import { getWindowStatus } from '../src/domain/window.js';
import { businesses, phoneNumbers } from '../src/mock/businesses.js';

const bizIds = new Set(businesses.map(b => b.id));
const phoneE164 = new Set(phoneNumbers.map(n => n.e164.slice(1))); // sin el +

function runTests(now, label) {
  describe(`${label} (now = ${now.toISOString()})`, () => {
    const conversations = buildConversations(now);
    const messages = buildMessages(now);

    it('hay exactamente 12 conversaciones con ids únicos', () => {
      assert.equal(conversations.length, 12);
      const ids = conversations.map(c => c.id);
      assert.equal(new Set(ids).size, 12);
    });

    it('cada conversación tiene id conv-01 a conv-12', () => {
      const ids = conversations.map(c => c.id).sort();
      const expected = Array.from({ length: 12 }, (_, i) => `conv-${String(i + 1).padStart(2, '0')}`);
      assert.deepEqual(ids, expected);
    });

    it('el nivel de ventana coincide con la spec', () => {
      const expectedStatus = [
        'green',  // 01: 60 min = 23h left
        'amber',  // 02: 1200 min = 4h left
        'closed', // 03: 1800 min = -6h left
        'green',  // 04: 120 min = 22h left
        'red',    // 05: 1410 min = 5h 50m? wait: 1410 min ago = 23h 30m ago? Let me recalc: 24h = 1440 min. 1440-1410 = 30 min left -> red
        'amber',  // 06: 1140 min = 5h left
        'green',  // 07: 180 min = 21h left
        'amber',  // 08: 1320 min = 2h left
        'red',    // 09: 1395 min = 45 min left
        'closed', // 10: 1560 min = -2h left
        'green',  // 11: 90 min = 22.5h left
        'closed', // 12: 2400 min = -10h left
      ];

      for (let i = 0; i < conversations.length; i++) {
        const conv = conversations[i];
        const status = getWindowStatus(conv.lastCustomerMessageAt, now);
        assert.equal(status, expectedStatus[i], `conv-${String(i + 1).padStart(2, '0')}: esperado ${expectedStatus[i]}, obtuvo ${status}`);
      }
    });

    it('aparecen los tres handlers', () => {
      const handlers = new Set(conversations.map(c => c.handler));
      assert.ok(handlers.has('bot'));
      assert.ok(handlers.has('waiting_human'));
      assert.ok(handlers.has('human'));
    });

    it('aparecen los cuatro niveles de ventana', () => {
      const statuses = new Set(conversations.map(c => getWindowStatus(c.lastCustomerMessageAt, now)));
      assert.ok(statuses.has('green'));
      assert.ok(statuses.has('amber'));
      assert.ok(statuses.has('red'));
      assert.ok(statuses.has('closed'));
    });

    it('al menos una conversación con unreadCount > 0', () => {
      const hasUnread = conversations.some(c => c.unreadCount > 0);
      assert.ok(hasUnread);
    });

    it('hay conversaciones de los 3 negocios', () => {
      const convBizIds = new Set(conversations.map(c => c.businessId));
      assert.deepEqual(convBizIds, bizIds);
    });

    it('todo customerPhone empieza con 525555550 y no coincide con e164 de negocio', () => {
      for (const conv of conversations) {
        assert.ok(conv.customerPhone.startsWith('525555550'), `Teléfono no empieza bien: ${conv.customerPhone}`);
        assert.ok(!phoneE164.has(conv.customerPhone), `Teléfono coincide con negocio: ${conv.customerPhone}`);
      }
    });

    it('handoffReason en HANDOFF_REASONS; conversaciones en bot no tienen motivo', () => {
      for (const conv of conversations) {
        if (conv.handler === 'bot') {
          assert.equal(conv.handoffReason, null);
        } else {
          assert.ok(HANDOFF_REASONS.includes(conv.handoffReason), `Motivo inválido: ${conv.handoffReason}`);
        }
      }
    });
  });

  describe(`Mensajes con ${label}`, () => {
    const messages = buildMessages(now);
    const conversations = buildConversations(now);

    it('los ids de mensajes son únicos', () => {
      const ids = messages.map(m => m.id);
      assert.equal(new Set(ids).size, ids.length);
    });

    it('todo conversationId de mensaje existe', () => {
      const convIds = new Set(conversations.map(c => c.id));
      for (const msg of messages) {
        assert.ok(convIds.has(msg.conversationId), `conversationId inexistente: ${msg.conversationId}`);
      }
    });

    it('hay mensajes de tipo image y audio', () => {
      const types = new Set(messages.map(m => m.type));
      assert.ok(types.has('image'));
      assert.ok(types.has('audio'));
    });

    it('hay tres eventos de sistema con cuerpo exacto', () => {
      const sysEvents = messages.filter(m => m.type === 'system_event');
      const bodies = sysEvents.map(e => e.body);
      assert.ok(bodies.includes('Un asesor tomó la conversación'));
      assert.ok(bodies.includes('La conversación volvió al bot'));
      assert.equal(sysEvents.length, 3);
    });

    it('no hay mensajes de tipo button', () => {
      for (const msg of messages) {
        assert.notEqual(msg.type, 'button');
      }
    });

    it('cada conversación tiene entre 2 y 6 mensajes', () => {
      for (const conv of conversations) {
        const convMsgs = messages.filter(m => m.conversationId === conv.id);
        assert.ok(convMsgs.length >= 2 && convMsgs.length <= 6, `conv ${conv.id}: ${convMsgs.length} mensajes`);
      }
    });

    it('el último mensaje del cliente de cada conversación coincide con lastCustomerMessageAt', () => {
      for (const conv of conversations) {
        const convMsgs = messages.filter(m => m.conversationId === conv.id);
        const customerMsgs = convMsgs.filter(m => m.author === 'customer');
        if (customerMsgs.length > 0) {
          const lastCustomerMsg = customerMsgs.reduce((a, b) => a.createdAt > b.createdAt ? a : b);
          const diff = Math.abs(lastCustomerMsg.createdAt.getTime() - conv.lastCustomerMessageAt.getTime());
          assert.ok(diff < 1000, `Diferencia ${diff}ms en ${conv.id}`);
        }
      }
    });

    it('deliveryStatus solo en bot y human', () => {
      for (const msg of messages) {
        if (msg.author === 'bot' || msg.author === 'human') {
          assert.ok(msg.deliveryStatus === 'delivered', `Falta deliveryStatus en ${msg.id}`);
        } else {
          assert.equal(msg.deliveryStatus, undefined, `deliveryStatus inesperado en ${msg.id}`);
        }
      }
    });
  });
}

const now1 = new Date('2026-10-16T12:00:00Z');
runTests(now1, 'referencia 1');

const now2 = new Date(now1.getTime() + 3 * 24 * 60 * 60 * 1000);
runTests(now2, 'referencia 2 (+3 días)');