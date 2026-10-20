import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DESTINATIONS, parseHash, isActive, getBusinessIdFromHash, isSourcesView } from '../src/domain/navigation.js';

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

    // New business detail routes
    it('parses #/negocios/:id as negocios', () => {
      assert.equal(parseHash('#/negocios/biz-gh'), 'negocios');
      assert.equal(parseHash('#/negocios/biz-demo2'), 'negocios');
    });

    it('parses #/negocios/:id/fuentes as negocios', () => {
      assert.equal(parseHash('#/negocios/biz-gh/fuentes'), 'negocios');
      assert.equal(parseHash('#/negocios/biz-demo2/fuentes'), 'negocios');
    });

    it('rejects invalid nested routes under negocios', () => {
      assert.equal(parseHash('#/negocios/biz-gh/otro'), 'conversaciones');
      assert.equal(parseHash('#/negocios/biz-gh/fuentes/extra'), 'conversaciones');
    });
  });

  describe('getBusinessIdFromHash', () => {
    it('returns null for non-business routes', () => {
      assert.equal(getBusinessIdFromHash('#/conversaciones'), null);
      assert.equal(getBusinessIdFromHash('#/ajustes'), null);
      assert.equal(getBusinessIdFromHash('#/negocios'), null);
      assert.equal(getBusinessIdFromHash(null), null);
    });

    it('extracts businessId from detail route', () => {
      assert.equal(getBusinessIdFromHash('#/negocios/biz-gh'), 'biz-gh');
      assert.equal(getBusinessIdFromHash('#/negocios/biz-demo2'), 'biz-demo2');
    });

    it('extracts businessId from sources route', () => {
      assert.equal(getBusinessIdFromHash('#/negocios/biz-gh/fuentes'), 'biz-gh');
      assert.equal(getBusinessIdFromHash('#/negocios/biz-demo2/fuentes'), 'biz-demo2');
    });

    it('returns null for invalid nested routes', () => {
      assert.equal(getBusinessIdFromHash('#/negocios/biz-gh/otro'), null);
      assert.equal(getBusinessIdFromHash('#/negocios/biz-gh/fuentes/extra'), null);
    });
  });

  describe('isSourcesView', () => {
    it('returns true for sources route', () => {
      assert.equal(isSourcesView('#/negocios/biz-gh/fuentes'), true);
      assert.equal(isSourcesView('#/negocios/biz-demo2/fuentes'), true);
    });

    it('returns false for other routes', () => {
      assert.equal(isSourcesView('#/negocios'), false);
      assert.equal(isSourcesView('#/negocios/biz-gh'), false);
      assert.equal(isSourcesView('#/conversaciones'), false);
      assert.equal(isSourcesView(null), false);
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

    it('returns true for detail route when target is negocios', () => {
      assert.equal(isActive('#/negocios/biz-gh', 'negocios'), true);
    });

    it('returns true for sources route when target is negocios', () => {
      assert.equal(isActive('#/negocios/biz-gh/fuentes', 'negocios'), true);
    });
  });
});