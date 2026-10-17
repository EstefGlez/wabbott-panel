import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { businesses, phoneNumbers } from '../src/mock/businesses.js';
import { sources } from '../src/mock/sources.js';
import { SOURCE_KINDS, SOURCE_STATUSES } from '../src/domain/contract.js';
import { calculateTotalChars } from '../src/domain/contextBudget.js';

describe('mockSources - Negocios, números y fuentes simulados', () => {
  describe('businesses', () => {
    it('hay 3 negocios', () => {
      assert.equal(businesses.length, 3);
    });

    it('nombres son distintos', () => {
      const names = businesses.map(b => b.name);
      assert.equal(new Set(names).size, 3);
    });

    it('colores son distintos', () => {
      const colors = businesses.map(b => b.color);
      assert.equal(new Set(colors).size, 3);
    });

    it('tienen los IDs esperados', () => {
      const ids = businesses.map(b => b.id).sort();
      assert.deepEqual(ids, ['biz-demo2', 'biz-demo3', 'biz-gh']);
    });

    it('GH Multimarcas tiene color #1d4ed8', () => {
      const gh = businesses.find(b => b.id === 'biz-gh');
      assert.equal(gh.name, 'GH Multimarcas');
      assert.equal(gh.color, '#1d4ed8');
    });

    it('Negocio Demo 2 tiene color #15803d', () => {
      const d2 = businesses.find(b => b.id === 'biz-demo2');
      assert.equal(d2.name, 'Negocio Demo 2');
      assert.equal(d2.color, '#15803d');
    });

    it('Negocio Demo 3 tiene color #c2410c', () => {
      const d3 = businesses.find(b => b.id === 'biz-demo3');
      assert.equal(d3.name, 'Negocio Demo 3');
      assert.equal(d3.color, '#c2410c');
    });
  });

  describe('phoneNumbers', () => {
    it('cada negocio tiene al menos un número', () => {
      for (const biz of businesses) {
        const nums = phoneNumbers.filter(n => n.businessId === biz.id);
        assert.ok(nums.length >= 1, `Negocio ${biz.id} sin números`);
      }
    });

    it('todo número apunta a un negocio que existe', () => {
      const bizIds = new Set(businesses.map(b => b.id));
      for (const num of phoneNumbers) {
        assert.ok(bizIds.has(num.businessId), `Número ${num.id} apunta a negocio inexistente`);
      }
    });

    it('no hay teléfonos reales: todos empiezan con +52555555', () => {
      for (const num of phoneNumbers) {
        assert.ok(num.e164.startsWith('+52555555'), `Teléfono real detectado: ${num.e164}`);
      }
    });

    it('IDs esperados', () => {
      const ids = phoneNumbers.map(n => n.id).sort();
      assert.deepEqual(ids, ['num-demo2-1', 'num-demo3-1', 'num-demo3-2', 'num-gh-1', 'num-gh-2']);
    });

    it('status es connected', () => {
      for (const num of phoneNumbers) {
        assert.equal(num.status, 'connected');
      }
    });
  });

  describe('sources', () => {
    it('cada negocio tiene al menos un url, un pdf y un md', () => {
      for (const biz of businesses) {
        const bizSources = sources.filter(s => s.businessId === biz.id);
        const kinds = new Set(bizSources.map(s => s.kind));
        assert.ok(kinds.has('url'), `${biz.id} sin url`);
        assert.ok(kinds.has('pdf'), `${biz.id} sin pdf`);
        assert.ok(kinds.has('md'), `${biz.id} sin md`);
      }
    });

    it('todo kind está en SOURCE_KINDS', () => {
      for (const src of sources) {
        assert.ok(SOURCE_KINDS.includes(src.kind), `Kind inválido: ${src.kind}`);
      }
    });

    it('todo status está en SOURCE_STATUSES', () => {
      for (const src of sources) {
        assert.ok(SOURCE_STATUSES.includes(src.status), `Status inválido: ${src.status}`);
      }
    });

    it('aparecen ready, processing y error en el conjunto', () => {
      const statuses = new Set(sources.map(s => s.status));
      assert.ok(statuses.has('ready'));
      assert.ok(statuses.has('processing'));
      assert.ok(statuses.has('error'));
    });

    it('fuentes activas de biz-gh suman entre 24001 y 30000', () => {
      const ghSources = sources.filter(s => s.businessId === 'biz-gh');
      const total = calculateTotalChars(ghSources);
      assert.ok(total > 24000 && total <= 30000, `Total GH: ${total}`);
    });

    it('ids no se repiten', () => {
      const ids = sources.map(s => s.id);
      assert.equal(new Set(ids).size, ids.length);
    });

    it('cada fuente tiene updatedAt y previewText', () => {
      for (const src of sources) {
        assert.ok(src.updatedAt, `Falta updatedAt en ${src.id}`);
        assert.ok(src.previewText, `Falta previewText en ${src.id}`);
      }
    });
  });
});