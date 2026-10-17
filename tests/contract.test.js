import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  HANDLERS,
  MESSAGE_AUTHORS,
  MESSAGE_TYPES,
  SOURCE_KINDS,
  SOURCE_STATUSES,
  HANDOFF_REASONS,
  CONTEXT_LIMIT,
  WINDOW_HOURS,
} from '../src/domain/contract.js';

describe('contract.js - constantes', () => {
  it('HANDLERS tiene exactamente los 3 valores esperados', () => {
    assert.deepEqual(HANDLERS, ['bot', 'waiting_human', 'human']);
    assert.equal(new Set(HANDLERS).size, HANDLERS.length, 'sin duplicados');
  });

  it('MESSAGE_AUTHORS tiene exactamente los 4 valores esperados', () => {
    assert.deepEqual(MESSAGE_AUTHORS, ['customer', 'bot', 'human', 'system']);
    assert.equal(new Set(MESSAGE_AUTHORS).size, MESSAGE_AUTHORS.length, 'sin duplicados');
  });

  it('MESSAGE_TYPES tiene exactamente los 5 valores esperados', () => {
    assert.deepEqual(MESSAGE_TYPES, ['text', 'image', 'audio', 'button', 'system_event']);
    assert.equal(new Set(MESSAGE_TYPES).size, MESSAGE_TYPES.length, 'sin duplicados');
  });

  it('SOURCE_KINDS tiene exactamente los 5 valores esperados', () => {
    assert.deepEqual(SOURCE_KINDS, ['url', 'pdf', 'md', 'txt', 'text']);
    assert.equal(new Set(SOURCE_KINDS).size, SOURCE_KINDS.length, 'sin duplicados');
  });

  it('SOURCE_STATUSES tiene exactamente los 3 valores esperados', () => {
    assert.deepEqual(SOURCE_STATUSES, ['ready', 'processing', 'error']);
    assert.equal(new Set(SOURCE_STATUSES).size, SOURCE_STATUSES.length, 'sin duplicados');
  });

  it('HANDOFF_REASONS tiene exactamente los 6 valores esperados', () => {
    assert.deepEqual(HANDOFF_REASONS, ['venta', 'envio', 'queja', 'devolucion', 'medico', 'otro']);
    assert.equal(new Set(HANDOFF_REASONS).size, HANDOFF_REASONS.length, 'sin duplicados');
  });

  it('CONTEXT_LIMIT es 30000', () => {
    assert.equal(CONTEXT_LIMIT, 30000);
  });

  it('WINDOW_HOURS es 24', () => {
    assert.equal(WINDOW_HOURS, 24);
  });
});