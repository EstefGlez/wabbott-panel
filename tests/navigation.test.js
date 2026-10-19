import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DESTINATIONS, parseHash, isActive } from '../src/domain/navigation.js';

describe('navigation', () => {
  describe('DESTINATIONS', () => {
    it('has length 3 and correct order', () => {
      assert.deepEqual(DESTINATIONS, ['conversaciones', 'negocios', 'ajustes']);
      assert.equal(DESTINATIONS.length, 3);
    });
  });

  describe('parseHash', () => {
    it('parses #/conversaciones', () => {
      assert.equal(parseHash('#/conversaciones'), 'conversaciones');
    });

    it('parses #/negocios', () => {
      assert.equal(parseHash('#/negocios'), 'negocios');
    });

    it('parses #/ajustes', () => {
      assert.equal(parseHash('#/ajustes'), 'ajustes');
    });

    it('defaults to conversaciones for #/', () => {
      assert.equal(parseHash('#/'), 'conversaciones');
    });

    it('defaults to conversaciones for unknown route', () => {
      assert.equal(parseHash('#/desconocido'), 'conversaciones');
    });

    it('defaults to conversaciones for empty string', () => {
      assert.equal(parseHash(''), 'conversaciones');
    });

    it('defaults to conversaciones for null', () => {
      assert.equal(parseHash(null), 'conversaciones');
    });

    it('defaults to conversaciones for undefined', () => {
      assert.equal(parseHash(undefined), 'conversaciones');
    });

    it('parses #negocios (no leading slash)', () => {
      assert.equal(parseHash('#negocios'), 'negocios');
    });

    it('rejects trailing slash as unknown', () => {
      assert.equal(parseHash('#/negocios/'), 'conversaciones');
    });

    it('rejects uppercase as unknown', () => {
      assert.equal(parseHash('#/NEGOCIOS'), 'conversaciones');
    });
  });

  describe('isActive', () => {
    it('returns true when hash matches target', () => {
      assert.equal(isActive('#/negocios', 'negocios'), true);
    });

    it('returns false when hash does not match target', () => {
      assert.equal(isActive('#/conversaciones', 'negocios'), false);
    });

    it('returns true for default when hash is unknown', () => {
      assert.equal(isActive('#/inventado', 'conversaciones'), true);
    });
  });
});