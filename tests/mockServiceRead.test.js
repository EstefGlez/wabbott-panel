import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SERVICE_METHODS } from '../src/services/service.js';
import { createMockService } from '../src/services/mockService.js';
import { buildConversations, buildMessages } from '../src/mock/conversations.js';
import { businesses, phoneNumbers } from '../src/mock/businesses.js';
import { sources } from '../src/mock/sources.js';
import { digitsOnly } from '../src/domain/phone.js';

const NOW = new Date('2026-10-16T12:00:00Z');

describe('mockService.js - Servicio simulado de lectura', () => {
  let service;

  beforeEach(() => {
    service = createMockService({ now: () => NOW });
  });

  describe('SERVICE_METHODS', () => {
    it('tiene exactamente 15 métodos en el orden correcto', () => {
      const expected = [
        'listBusinesses', 'listNumbers', 'listConversations', 'getConversation',
        'listMessages', 'listSources', 'getNotificationSettings',
        'takeConversation', 'returnToBot', 'sendMessage', 'updateConversation',
        'addSource', 'toggleSource', 'deleteSource', 'saveNotificationSettings'
      ];
      assert.deepEqual(SERVICE_METHODS, expected);
    });

    it('el servicio expone todos los 15 métodos como funciones', () => {
      for (const method of SERVICE_METHODS) {
        assert.equal(typeof service[method], 'function', `Falta método: ${method}`);
      }
    });
  });

  describe('listBusinesses', () => {
    it('devuelve los 3 negocios', async () => {
      const result = await service.listBusinesses();
      assert.equal(result.length, 3);
    });

    it('devuelve copia: modificar no afecta al original', async () => {
      const result = await service.listBusinesses();
      result[0].name = 'Modificado';
      const again = await service.listBusinesses();
      assert.equal(again[0].name, 'GH Multimarcas');
    });
  });

  describe('listNumbers', () => {
    it('biz-gh tiene 2 números', async () => {
      const nums = await service.listNumbers('biz-gh');
      assert.equal(nums.length, 2);
    });

    it('biz-demo2 tiene 1 número', async () => {
      const nums = await service.listNumbers('biz-demo2');
      assert.equal(nums.length, 1);
    });

    it('biz-demo3 tiene 2 números', async () => {
      const nums = await service.listNumbers('biz-demo3');
      assert.equal(nums.length, 2);
    });

    it('id inexistente da []', async () => {
      const nums = await service.listNumbers('no-existe');
      assert.equal(nums.length, 0);
    });
  });

  describe('listConversations', () => {
    it('sin filtros da 12 conversaciones', async () => {
      const convs = await service.listConversations({});
      assert.equal(convs.length, 12);
    });

    it('por negocio: biz-gh 6, biz-demo2 3, biz-demo3 3', async () => {
      const gh = await service.listConversations({ businessId: 'biz-gh' });
      const d2 = await service.listConversations({ businessId: 'biz-demo2' });
      const d3 = await service.listConversations({ businessId: 'biz-demo3' });
      assert.equal(gh.length, 6);
      assert.equal(d2.length, 3);
      assert.equal(d3.length, 3);
    });

    it('por handler: waiting_human 4, human 4, bot 4', async () => {
      const w = await service.listConversations({ handler: 'waiting_human' });
      const h = await service.listConversations({ handler: 'human' });
      const b = await service.listConversations({ handler: 'bot' });
      assert.equal(w.length, 4);
      assert.equal(h.length, 4);
      assert.equal(b.length, 4);
    });

    it('orden exacto: waiting_human primero, luego por lastCustomerMessageAt descendente', async () => {
      const convs = await service.listConversations({});
      const ids = convs.map(c => c.id);
      const expected = [
        'conv-04', 'conv-06', 'conv-05', 'conv-12',
        'conv-01', 'conv-11', 'conv-07', 'conv-02',
        'conv-08', 'conv-09', 'conv-10', 'conv-03'
      ];
      assert.deepEqual(ids, expected);
    });

    it('search "demo" (insensible a mayúsculas) da 12', async () => {
      const convs = await service.listConversations({ search: 'demo' });
      assert.equal(convs.length, 12);
    });

    it('search "zzz" da 0', async () => {
      const convs = await service.listConversations({ search: 'zzz' });
      assert.equal(convs.length, 0);
    });

    it('search con dígitos de un teléfono da solo esa conversación', async () => {
      const conv = await service.listConversations({ search: '525555550904' });
      assert.equal(conv.length, 1);
      assert.equal(conv[0].id, 'conv-04');
    });

    it('devuelve copia: modificar handler no cambia el siguiente getConversation', async () => {
      const convs = await service.listConversations({ businessId: 'biz-gh' });
      const botConv = convs.find(c => c.handler === 'bot');
      botConv.handler = 'human';
      const again = await service.getConversation(botConv.id);
      assert.equal(again.handler, 'bot');
    });
  });

  describe('getConversation', () => {
    it('conv-04 tiene handler waiting_human', async () => {
      const conv = await service.getConversation('conv-04');
      assert.equal(conv.handler, 'waiting_human');
    });

    it('id inexistente da null', async () => {
      const conv = await service.getConversation('no-existe');
      assert.equal(conv, null);
    });

    it('devuelve copia: modificar handler no persiste', async () => {
      const conv = await service.getConversation('conv-01');
      conv.handler = 'human';
      const again = await service.getConversation('conv-01');
      assert.equal(again.handler, 'bot');
    });
  });

  describe('listMessages', () => {
    it('conv-01 está ordenado por createdAt ascendente', async () => {
      const msgs = await service.listMessages('conv-01');
      for (let i = 1; i < msgs.length; i++) {
        assert.ok(msgs[i - 1].createdAt <= msgs[i].createdAt, `Mensaje ${i - 1} > ${i}`);
      }
    });

    it('conv-01 contiene 2 eventos de sistema', async () => {
      const msgs = await service.listMessages('conv-01');
      const sysEvents = msgs.filter(m => m.type === 'system_event');
      assert.equal(sysEvents.length, 2);
      assert.ok(sysEvents.some(e => e.body === 'Un asesor tomó la conversación'));
      assert.ok(sysEvents.some(e => e.body === 'La conversación volvió al bot'));
    });

    it('id inexistente da []', async () => {
      const msgs = await service.listMessages('no-existe');
      assert.deepEqual(msgs, []);
    });
  });

  describe('listSources', () => {
    it('biz-gh tiene 4 fuentes', async () => {
      const src = await service.listSources('biz-gh');
      assert.equal(src.length, 4);
    });

    it('biz-demo2 tiene 3 fuentes', async () => {
      const src = await service.listSources('biz-demo2');
      assert.equal(src.length, 3);
    });

    it('biz-demo3 tiene 3 fuentes', async () => {
      const src = await service.listSources('biz-demo3');
      assert.equal(src.length, 3);
    });
  });

  describe('getNotificationSettings', () => {
    it('devuelve exactamente el objeto esperado', async () => {
      const settings = await service.getNotificationSettings();
      assert.deepEqual(settings, {
        email: 'admin@ejemplo.com',
        events: ['waiting_human', 'unanswered_15min', 'window_closing'],
        quietHours: { enabled: true, from: '23:00', to: '08:00' }
      });
    });
  });

  describe('dos servicios no comparten datos', () => {
    it('son objetos distintos', () => {
      const s1 = createMockService({ now: () => NOW });
      const s2 = createMockService({ now: () => NOW });
      assert.notStrictEqual(s1, s2);
    });
  });
});