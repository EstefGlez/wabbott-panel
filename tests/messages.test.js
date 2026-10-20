import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatMessageTime,
  groupMessagesByDate,
  validateMessageText,
  isSystemMessage,
  getMessageBubbleClass,
} from '../src/domain/messages.js';

describe('messages domain', () => {
  describe('formatMessageTime', () => {
    it('formats ISO string to HH:mm', () => {
      const result = formatMessageTime('2026-10-19T14:30:00.000Z');
      // Depende de zona horaria, pero HH:mm debe ser consistente
      assert.match(result, /^\d{2}:\d{2}$/);
    });

    it('pads single digit hours and minutes', () => {
      const result = formatMessageTime('2026-10-19T09:05:00.000Z');
      assert.match(result, /^\d{2}:\d{2}$/);
    });

    it('handles midnight', () => {
      const result = formatMessageTime('2026-10-19T00:00:00.000Z');
      assert.match(result, /^\d{2}:\d{2}$/);
    });
  });

  describe('groupMessagesByDate', () => {
    const now = new Date('2026-10-19T12:00:00.000Z');
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString().split('T')[0];

    it('groups messages from today under "Hoy"', () => {
      const messages = [
        { id: 'm1', conversationId: 'c1', author: 'customer', type: 'text', body: 'Hola', createdAt: `${today}T10:00:00.000Z` },
        { id: 'm2', conversationId: 'c1', author: 'bot', type: 'text', body: 'Hola', createdAt: `${today}T11:00:00.000Z` },
      ];
      const groups = groupMessagesByDate(messages, now);
      assert.ok(groups.has('Hoy'));
      assert.equal(groups.get('Hoy').length, 2);
    });

    it('groups messages from yesterday under "Ayer"', () => {
      const messages = [
        { id: 'm1', conversationId: 'c1', author: 'customer', type: 'text', body: 'Hola', createdAt: `${yesterday}T10:00:00.000Z` },
      ];
      const groups = groupMessagesByDate(messages, now);
      assert.ok(groups.has('Ayer'));
      assert.equal(groups.get('Ayer').length, 1);
    });

    it('groups older messages under DD/MM/YYYY', () => {
      const messages = [
        { id: 'm1', conversationId: 'c1', author: 'customer', type: 'text', body: 'Hola', createdAt: `${twoDaysAgo}T10:00:00.000Z` },
      ];
      const groups = groupMessagesByDate(messages, now);
      // Formato DD/MM/YYYY
      const expectedKey = twoDaysAgo.split('-').reverse().join('/');
      assert.ok(groups.has(expectedKey));
      assert.equal(groups.get(expectedKey).length, 1);
    });

    it('handles mixed dates', () => {
      const messages = [
        { id: 'm1', conversationId: 'c1', author: 'customer', type: 'text', body: 'Hoy 1', createdAt: `${today}T10:00:00.000Z` },
        { id: 'm2', conversationId: 'c1', author: 'bot', type: 'text', body: 'Ayer 1', createdAt: `${yesterday}T10:00:00.000Z` },
        { id: 'm3', conversationId: 'c1', author: 'human', type: 'text', body: 'Antier 1', createdAt: `${twoDaysAgo}T10:00:00.000Z` },
      ];
      const groups = groupMessagesByDate(messages, now);
      assert.equal(groups.size, 3);
      assert.ok(groups.has('Hoy'));
      assert.ok(groups.has('Ayer'));
      const expectedKey = twoDaysAgo.split('-').reverse().join('/');
      assert.ok(groups.has(expectedKey));
    });

    it('preserves order within each group', () => {
      const messages = [
        { id: 'm1', conversationId: 'c1', author: 'customer', type: 'text', body: 'Primero', createdAt: `${today}T10:00:00.000Z` },
        { id: 'm2', conversationId: 'c1', author: 'bot', type: 'text', body: 'Segundo', createdAt: `${today}T11:00:00.000Z` },
      ];
      const groups = groupMessagesByDate(messages, now);
      const todayGroup = groups.get('Hoy');
      assert.equal(todayGroup[0].id, 'm1');
      assert.equal(todayGroup[1].id, 'm2');
    });
  });

  describe('validateMessageText', () => {
    it('accepts valid text', () => {
      const result = validateMessageText('Hola, ¿cómo estás?');
      assert.equal(result.valid, true);
      assert.equal(result.error, undefined);
    });

    it('rejects empty string', () => {
      const result = validateMessageText('');
      assert.equal(result.valid, false);
      assert.equal(result.error, 'El mensaje no puede estar vacío');
    });

    it('rejects whitespace only', () => {
      const result = validateMessageText('   ');
      assert.equal(result.valid, false);
      assert.equal(result.error, 'El mensaje no puede estar vacío');
    });

    it('rejects undefined', () => {
      const result = validateMessageText(undefined);
      assert.equal(result.valid, false);
      assert.equal(result.error, 'Mensaje requerido');
    });

    it('rejects null', () => {
      const result = validateMessageText(null);
      assert.equal(result.valid, false);
      assert.equal(result.error, 'Mensaje requerido');
    });

    it('rejects text over 4096 chars', () => {
      const longText = 'a'.repeat(4097);
      const result = validateMessageText(longText);
      assert.equal(result.valid, false);
      assert.equal(result.error, 'El mensaje excede el límite de 4096 caracteres');
    });

    it('accepts text exactly 4096 chars', () => {
      const exactText = 'a'.repeat(4096);
      const result = validateMessageText(exactText);
      assert.equal(result.valid, true);
    });

    it('accepts text with newlines', () => {
      const result = validateMessageText('Línea 1\nLínea 2');
      assert.equal(result.valid, true);
    });
  });

  describe('isSystemMessage', () => {
    it('returns true for system_event type', () => {
      const msg = { id: 'm1', conversationId: 'c1', author: 'system', type: 'system_event', body: 'Evento', createdAt: new Date().toISOString() };
      assert.equal(isSystemMessage(msg), true);
    });

    it('returns false for text type', () => {
      const msg = { id: 'm1', conversationId: 'c1', author: 'customer', type: 'text', body: 'Hola', createdAt: new Date().toISOString() };
      assert.equal(isSystemMessage(msg), false);
    });

    it('returns false for image type', () => {
      const msg = { id: 'm1', conversationId: 'c1', author: 'customer', type: 'image', body: '[Imagen]', createdAt: new Date().toISOString() };
      assert.equal(isSystemMessage(msg), false);
    });

    it('returns false for audio type', () => {
      const msg = { id: 'm1', conversationId: 'c1', author: 'customer', type: 'audio', body: '[Audio]', createdAt: new Date().toISOString() };
      assert.equal(isSystemMessage(msg), false);
    });

    it('returns false for button type', () => {
      const msg = { id: 'm1', conversationId: 'c1', author: 'bot', type: 'button', body: 'Botón', createdAt: new Date().toISOString() };
      assert.equal(isSystemMessage(msg), false);
    });
  });

  describe('getMessageBubbleClass', () => {
    it('returns customer class for customer author', () => {
      const msg = { author: 'customer', type: 'text', body: '', createdAt: new Date().toISOString(), conversationId: 'c1', id: 'm1' };
      assert.equal(getMessageBubbleClass(msg), 'message-bubble--customer');
    });

    it('returns bot class for bot author', () => {
      const msg = { author: 'bot', type: 'text', body: '', createdAt: new Date().toISOString(), conversationId: 'c1', id: 'm1' };
      assert.equal(getMessageBubbleClass(msg), 'message-bubble--bot');
    });

    it('returns human class for human author', () => {
      const msg = { author: 'human', type: 'text', body: '', createdAt: new Date().toISOString(), conversationId: 'c1', id: 'm1' };
      assert.equal(getMessageBubbleClass(msg), 'message-bubble--human');
    });

    it('returns system class for system author', () => {
      const msg = { author: 'system', type: 'system_event', body: '', createdAt: new Date().toISOString(), conversationId: 'c1', id: 'm1' };
      assert.equal(getMessageBubbleClass(msg), 'message-bubble--system');
    });

    it('returns unknown class for unknown author', () => {
      const msg = { author: 'unknown', type: 'text', body: '', createdAt: new Date().toISOString(), conversationId: 'c1', id: 'm1' };
      assert.equal(getMessageBubbleClass(msg), 'message-bubble--unknown');
    });
  });
});