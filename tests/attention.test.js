import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAvailableActions,
  canSend,
  applyTake,
  applyReturnToBot,
  cancelReturnToBot,
} from '../src/domain/attention.js';

describe('attention.js - Estado de atención', () => {
  const now = new Date('2026-01-01T10:00:00Z');

  const baseConversation = {
    id: 'conv-1',
    businessId: 'biz-1',
    phoneNumberId: 'num-1',
    customerName: 'Cliente Demo',
    customerPhone: '525555550101',
    handler: 'bot',
    handoffReason: null,
    lastCustomerMessageAt: now.toISOString(),
    unreadCount: 0,
    tags: [],
    notes: '',
    summary: null,
  };

  describe('getAvailableActions', () => {
    it('bot devuelve ["take"]', () => {
      assert.deepEqual(getAvailableActions('bot'), ['take']);
    });

    it('waiting_human devuelve ["take"]', () => {
      assert.deepEqual(getAvailableActions('waiting_human'), ['take']);
    });

    it('human devuelve ["return_to_bot"]', () => {
      assert.deepEqual(getAvailableActions('human'), ['return_to_bot']);
    });

    it('estado inválido lanza Error', () => {
      assert.throws(() => getAvailableActions('invalid'), /^Error/);
    });
  });

  describe('canSend', () => {
    it('human con green permite', () => {
      const result = canSend('human', 'green');
      assert.equal(result.allowed, true);
      assert.equal(result.reason, null);
    });

    it('human con amber permite', () => {
      const result = canSend('human', 'amber');
      assert.equal(result.allowed, true);
      assert.equal(result.reason, null);
    });

    it('human con red permite', () => {
      const result = canSend('human', 'red');
      assert.equal(result.allowed, true);
      assert.equal(result.reason, null);
    });

    it('human con closed no permite y da motivo de ventana', () => {
      const result = canSend('human', 'closed');
      assert.equal(result.allowed, false);
      assert.equal(result.reason, 'La ventana de WhatsApp cerró. Escribe desde tu WhatsApp con el botón wa.me.');
    });

    it('bot no permite y da motivo de tomar conversación', () => {
      const result = canSend('bot', 'green');
      assert.equal(result.allowed, false);
      assert.equal(result.reason, 'Toma la conversación para poder responder.');
    });

    it('waiting_human no permite y da motivo de tomar conversación', () => {
      const result = canSend('waiting_human', 'green');
      assert.equal(result.allowed, false);
      assert.equal(result.reason, 'Toma la conversación para poder responder.');
    });

    it('bot con closed: motivo es tomar conversación (prioridad)', () => {
      const result = canSend('bot', 'closed');
      assert.equal(result.allowed, false);
      assert.equal(result.reason, 'Toma la conversación para poder responder.');
    });

    it('waiting_human con closed: motivo es tomar conversación (prioridad)', () => {
      const result = canSend('waiting_human', 'closed');
      assert.equal(result.allowed, false);
      assert.equal(result.reason, 'Toma la conversación para poder responder.');
    });
  });

  describe('applyTake', () => {
    it('de bot pasa a human y agrega evento', () => {
      const conv = { ...baseConversation, handler: 'bot' };
      const { conversation, event } = applyTake(conv, now);

      assert.equal(conversation.handler, 'human');
      assert.ok(event);
      assert.equal(event.author, 'system');
      assert.equal(event.type, 'system_event');
      assert.equal(event.body, 'Un asesor tomó la conversación');
      assert.equal(event.conversationId, conv.id);
      assert.deepEqual(event.createdAt, now);
    });

    it('de waiting_human pasa a human y agrega evento', () => {
      const conv = { ...baseConversation, handler: 'waiting_human' };
      const { conversation, event } = applyTake(conv, now);

      assert.equal(conversation.handler, 'human');
      assert.ok(event);
      assert.equal(event.body, 'Un asesor tomó la conversación');
    });

    it('la conversación original no cambia', () => {
      const conv = { ...baseConversation, handler: 'bot' };
      applyTake(conv, now);
      assert.equal(conv.handler, 'bot');
    });

    it('desde human lanza Error', () => {
      const conv = { ...baseConversation, handler: 'human' };
      assert.throws(() => applyTake(conv, now), /^Error/);
    });
  });

  describe('applyReturnToBot', () => {
    it('de human pasa a bot y agrega evento', () => {
      const conv = { ...baseConversation, handler: 'human' };
      const { conversation, event } = applyReturnToBot(conv, now);

      assert.equal(conversation.handler, 'bot');
      assert.ok(event);
      assert.equal(event.author, 'system');
      assert.equal(event.type, 'system_event');
      assert.equal(event.body, 'La conversación volvió al bot');
      assert.equal(event.conversationId, conv.id);
      assert.deepEqual(event.createdAt, now);
    });

    it('la conversación original no cambia', () => {
      const conv = { ...baseConversation, handler: 'human' };
      applyReturnToBot(conv, now);
      assert.equal(conv.handler, 'human');
    });

    it('desde bot lanza Error', () => {
      const conv = { ...baseConversation, handler: 'bot' };
      assert.throws(() => applyReturnToBot(conv, now), /^Error/);
    });

    it('desde waiting_human lanza Error', () => {
      const conv = { ...baseConversation, handler: 'waiting_human' };
      assert.throws(() => applyReturnToBot(conv, now), /^Error/);
    });
  });

  describe('cancelReturnToBot', () => {
    it('devuelve la misma conversación y event null', () => {
      const conv = { ...baseConversation, handler: 'human' };
      const { conversation, event } = cancelReturnToBot(conv);

      assert.equal(conversation, conv);
      assert.equal(event, null);
    });
  });
});