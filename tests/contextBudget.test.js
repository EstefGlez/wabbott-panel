import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isActiveSource,
  calculateTotalChars,
  getBudgetLevel,
  getBudgetMessage,
} from '../src/domain/contextBudget.js';
import { CONTEXT_LIMIT } from '../src/domain/contract.js';

describe('contextBudget.js - Presupuesto de contexto', () => {
  const WARNING_THRESHOLD = Math.floor(CONTEXT_LIMIT * 0.8);

  describe('isActiveSource', () => {
    it('true si enabled=true y status=ready', () => {
      assert.equal(isActiveSource({ enabled: true, status: 'ready' }), true);
    });

    it('false si enabled=false aunque status=ready', () => {
      assert.equal(isActiveSource({ enabled: false, status: 'ready' }), false);
    });

    it('false si status=processing aunque enabled=true', () => {
      assert.equal(isActiveSource({ enabled: true, status: 'processing' }), false);
    });

    it('false si status=error aunque enabled=true', () => {
      assert.equal(isActiveSource({ enabled: true, status: 'error' }), false);
    });
  });

  describe('calculateTotalChars', () => {
    it('suma charCount solo de fuentes activas', () => {
      const sources = [
        { enabled: true, status: 'ready', charCount: 10000 },
        { enabled: true, status: 'ready', charCount: 5000 },
        { enabled: false, status: 'ready', charCount: 8000 },
        { enabled: true, status: 'processing', charCount: 3000 },
      ];
      assert.equal(calculateTotalChars(sources), 15000);
    });

    it('lista vacía da 0', () => {
      assert.equal(calculateTotalChars([]), 0);
    });

    it('fuente apagada no suma', () => {
      const sources = [{ enabled: false, status: 'ready', charCount: 10000 }];
      assert.equal(calculateTotalChars(sources), 0);
    });

    it('fuente en processing no suma', () => {
      const sources = [{ enabled: true, status: 'processing', charCount: 10000 }];
      assert.equal(calculateTotalChars(sources), 0);
    });

    it('fuente en error no suma', () => {
      const sources = [{ enabled: true, status: 'error', charCount: 10000 }];
      assert.equal(calculateTotalChars(sources), 0);
    });
  });

  describe('getBudgetLevel', () => {
    it('24000 es normal', () => {
      assert.equal(getBudgetLevel(24000), 'normal');
    });

    it('24001 es warning', () => {
      assert.equal(getBudgetLevel(24001), 'warning');
    });

    it('30000 es warning', () => {
      assert.equal(getBudgetLevel(30000), 'warning');
    });

    it('30001 es danger', () => {
      assert.equal(getBudgetLevel(30001), 'danger');
    });
  });

  describe('getBudgetMessage', () => {
    it('danger devuelve mensaje exacto', () => {
      assert.equal(
        getBudgetMessage('danger'),
        'Demasiado texto: el bot puede responder más lento o ignorar partes.'
      );
    });

    it('warning devuelve null', () => {
      assert.equal(getBudgetMessage('warning'), null);
    });

    it('normal devuelve null', () => {
      assert.equal(getBudgetMessage('normal'), null);
    });
  });
});