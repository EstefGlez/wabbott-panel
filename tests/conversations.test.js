import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { filterConversations, sortConversations, searchConversations } from '../src/domain/conversations.js';

/** @type {Conversation[]} */
let sampleConversations;

before(() => {
  const now = new Date('2026-10-19T12:00:00.000Z');
  const day = 24 * 60 * 60 * 1000;
  const hour = 60 * 60 * 1000;

  sampleConversations = [
    {
      id: 'conv-01',
      businessId: 'biz-gh',
      phoneNumberId: 'num-01',
      customerName: 'Juan Pérez',
      customerPhone: '+525555550120',
      handler: 'bot',
      handoffReason: undefined,
      stage: 'inicio',
      assignedTo: undefined,
      lastCustomerMessageAt: new Date(now - 2 * hour).toISOString(),
      windowExpiresAt: new Date(now + 22 * hour).toISOString(),
      waitingSince: undefined,
      lastUnansweredAt: undefined,
      unreadCount: 0,
      tags: [],
      notes: '',
      summary: undefined,
    },
    {
      id: 'conv-02',
      businessId: 'biz-gh',
      phoneNumberId: 'num-01',
      customerName: 'María González',
      customerPhone: '+525555550121',
      handler: 'waiting_human',
      handoffReason: 'venta',
      stage: 'calificación',
      assignedTo: undefined,
      lastCustomerMessageAt: new Date(now - 1 * hour).toISOString(),
      windowExpiresAt: new Date(now + 23 * hour).toISOString(),
      waitingSince: new Date(now - 30 * 60 * 1000).toISOString(),
      lastUnansweredAt: undefined,
      unreadCount: 3,
      tags: ['urgente'],
      notes: '',
      summary: undefined,
    },
    {
      id: 'conv-03',
      businessId: 'biz-demo2',
      phoneNumberId: 'num-02',
      customerName: 'Carlos López',
      customerPhone: '+525555550122',
      handler: 'human',
      handoffReason: undefined,
      stage: 'cierre',
      assignedTo: 'Héctor',
      lastCustomerMessageAt: new Date(now - 3 * hour).toISOString(),
      windowExpiresAt: new Date(now + 21 * hour).toISOString(),
      waitingSince: undefined,
      lastUnansweredAt: new Date(now - 10 * 60 * 1000).toISOString(),
      unreadCount: 1,
      tags: [],
      notes: 'Cliente interesado',
      summary: undefined,
    },
    {
      id: 'conv-04',
      businessId: 'biz-demo3',
      phoneNumberId: 'num-03',
      customerName: 'Ana Martín',
      customerPhone: '+525555550123',
      handler: 'waiting_human',
      handoffReason: 'queja',
      stage: 'soporte',
      assignedTo: undefined,
      lastCustomerMessageAt: new Date(now - 4 * hour).toISOString(),
      windowExpiresAt: new Date(now + 20 * hour).toISOString(),
      waitingSince: new Date(now - 2 * hour).toISOString(),
      lastUnansweredAt: undefined,
      unreadCount: 5,
      tags: ['reclamo'],
      notes: '',
      summary: undefined,
    },
    {
      id: 'conv-05',
      businessId: 'biz-gh',
      phoneNumberId: 'num-01',
      customerName: 'Pedro Ruiz',
      customerPhone: '+525555550124',
      handler: 'bot',
      handoffReason: undefined,
      stage: 'inicio',
      assignedTo: undefined,
      lastCustomerMessageAt: new Date(now - 5 * hour).toISOString(),
      windowExpiresAt: new Date(now + 19 * hour).toISOString(),
      waitingSince: undefined,
      lastUnansweredAt: undefined,
      unreadCount: 0,
      tags: [],
      notes: '',
      summary: undefined,
    },
  ];
});

describe('conversations domain', () => {
  describe('filterConversations', () => {
    it('filters by businessId', () => {
      const result = filterConversations(sampleConversations, { businessId: 'biz-gh', status: 'all', search: '' });
      assert.equal(result.length, 3);
      assert.ok(result.every(c => c.businessId === 'biz-gh'));
    });

    it('filters by status', () => {
      const result = filterConversations(sampleConversations, { businessId: null, status: 'waiting_human', search: '' });
      assert.equal(result.length, 2);
      assert.ok(result.every(c => c.handler === 'waiting_human'));
    });

    it('businessId=null does not filter by business', () => {
      const result = filterConversations(sampleConversations, { businessId: null, status: 'all', search: '' });
      assert.equal(result.length, 5);
    });

    it('status=all does not filter by status', () => {
      const result = filterConversations(sampleConversations, { businessId: 'biz-gh', status: 'all', search: '' });
      assert.equal(result.length, 3);
    });

    it('combines businessId and status filters', () => {
      const result = filterConversations(sampleConversations, { businessId: 'biz-gh', status: 'waiting_human', search: '' });
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'conv-02');
    });
  });

  describe('sortConversations', () => {
    it('puts waiting_human first', () => {
      const result = sortConversations([...sampleConversations]);
      const waitingHuman = result.filter(c => c.handler === 'waiting_human');
      const others = result.filter(c => c.handler !== 'waiting_human');
      // Todos los waiting_human deben estar antes que los otros
      const firstOtherIndex = result.findIndex(c => c.handler !== 'waiting_human');
      const lastWaitingIndex = result.findLastIndex(c => c.handler === 'waiting_human');
      assert.ok(lastWaitingIndex < firstOtherIndex, 'waiting_human should come first');
    });

    it('sorts by lastCustomerMessageAt descending within same handler', () => {
      const result = sortConversations([...sampleConversations]);
      // Entre bots: conv-01 (2h ago) antes que conv-05 (5h ago)
      const botIndex1 = result.findIndex(c => c.id === 'conv-01');
      const botIndex2 = result.findIndex(c => c.id === 'conv-05');
      assert.ok(botIndex1 < botIndex2, 'more recent bot conversation should come first');

      // Entre waiting_human: conv-02 (1h ago) antes que conv-04 (4h ago)
      const waitIndex1 = result.findIndex(c => c.id === 'conv-02');
      const waitIndex2 = result.findIndex(c => c.id === 'conv-04');
      assert.ok(waitIndex1 < waitIndex2, 'more recent waiting_human should come first');
    });

    it('does not mutate original array', () => {
      const original = [...sampleConversations];
      sortConversations([...sampleConversations]);
      assert.deepEqual(sampleConversations, original);
    });
  });

  describe('searchConversations', () => {
    it('finds by customerName case-insensitive', () => {
      const result = searchConversations(sampleConversations, 'juan');
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'conv-01');

      const result2 = searchConversations(sampleConversations, 'JUAN');
      assert.equal(result2.length, 1);
    });

    it('finds by customerPhone digits', () => {
      const result = searchConversations(sampleConversations, '5555550121');
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'conv-02');
    });

    it('finds by partial phone', () => {
      const result = searchConversations(sampleConversations, '0122');
      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'conv-03');
    });

    it('empty query returns all', () => {
      const result = searchConversations(sampleConversations, '');
      assert.equal(result.length, 5);

      const result2 = searchConversations(sampleConversations, '   ');
      assert.equal(result2.length, 5);
    });

    it('returns empty for no match', () => {
      const result = searchConversations(sampleConversations, 'zzzzz');
      assert.equal(result.length, 0);
    });
  });

  describe('composition filter+sort+search', () => {
    it('filter then sort then search works together', () => {
      // Filtrar biz-gh, luego ordenar, luego buscar "juan"
      const filtered = filterConversations(sampleConversations, { businessId: 'biz-gh', status: 'all', search: '' });
      const sorted = sortConversations(filtered);
      const searched = searchConversations(sorted, 'juan');
      assert.equal(searched.length, 1);
      assert.equal(searched[0].id, 'conv-01');
    });

    it('search then filter then sort works together', () => {
      const searched = searchConversations(sampleConversations, 'maría');
      const filtered = filterConversations(searched, { businessId: 'biz-gh', status: 'all', search: '' });
      const sorted = sortConversations(filtered);
      assert.equal(sorted.length, 1);
      assert.equal(sorted[0].id, 'conv-02');
    });

    it('full pipeline: all conversations, filter waiting_human, sort, search empty', () => {
      const filtered = filterConversations(sampleConversations, { businessId: null, status: 'waiting_human', search: '' });
      const sorted = sortConversations(filtered);
      const searched = searchConversations(sorted, '');
      // conv-02 (1h ago) antes que conv-04 (4h ago)
      assert.equal(searched.length, 2);
      assert.equal(searched[0].id, 'conv-02');
      assert.equal(searched[1].id, 'conv-04');
    });
  });
});