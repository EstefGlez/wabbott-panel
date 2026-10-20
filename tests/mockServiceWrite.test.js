import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createMockService } from '../src/services/mockService.js';
import { SOURCE_KINDS } from '../src/domain/contract.js';
import { calculateTotalChars, getBudgetLevel } from '../src/domain/contextBudget.js';

const NOW = new Date('2026-10-16T12:00:00Z');

describe('mockService.js - Servicio simulado de escritura', () => {
  let service;

  beforeEach(() => {
    service = createMockService({ now: () => NOW });
  });

  describe('takeConversation', () => {
    it('conv-04 (waiting_human) pasa a human y agrega evento system', async () => {
      const conv = await service.takeConversation('conv-04');
      assert.equal(conv.handler, 'human');

      const msgs = await service.listMessages('conv-04');
      const sysEvents = msgs.filter(m => m.type === 'system_event');
      assert.ok(sysEvents.some(e => e.body === 'Un asesor tomó la conversación'));
    });

    it('conv-07 (ya human) rechaza', async () => {
      await assert.rejects(
        service.takeConversation('conv-07'),
        { message: 'Solo se puede tomar una conversación en estado bot o waiting_human' }
      );
    });

    it('id inexistente rechaza', async () => {
      await assert.rejects(
        service.takeConversation('no-existe'),
        { message: 'Conversación no encontrada' }
      );
    });
  });

  describe('returnToBot', () => {
    it('conv-07 (human) pasa a bot y agrega evento system', async () => {
      const conv = await service.returnToBot('conv-07');
      assert.equal(conv.handler, 'bot');

      const msgs = await service.listMessages('conv-07');
      const sysEvents = msgs.filter(m => m.type === 'system_event');
      assert.ok(sysEvents.some(e => e.body === 'La conversación volvió al bot'));
    });

    it('conv-01 (bot) rechaza', async () => {
      await assert.rejects(
        service.returnToBot('conv-01'),
        { message: 'Solo se puede devolver al bot una conversación atendida por humano' }
      );
    });

    it('id inexistente rechaza', async () => {
      await assert.rejects(
        service.returnToBot('no-existe'),
        { message: 'Conversación no encontrada' }
      );
    });
  });

  describe('sendMessage', () => {
    it('conv-01 (bot) rechaza con motivo correcto', async () => {
      await assert.rejects(
        service.sendMessage('conv-01', 'Hola'),
        { message: 'Toma la conversación para poder responder.' }
      );
    });

    it('conv-10 (human, ventana cerrada) rechaza con motivo correcto', async () => {
      await assert.rejects(
        service.sendMessage('conv-10', 'Hola'),
        { message: 'La ventana de WhatsApp cerró. Escribe desde tu WhatsApp con el botón wa.me.' }
      );
    });

    it('conv-07 (human, ventana verde) agrega el mensaje', async () => {
      const msg = await service.sendMessage('conv-07', 'Hola cliente');
      assert.equal(msg.author, 'human');
      assert.equal(msg.type, 'text');
      assert.equal(msg.body, 'Hola cliente');
      assert.equal(msg.deliveryStatus, 'sent');
      assert.ok(msg.id.startsWith('msg-conv-07-'));
    });

    it('texto de solo espacios rechaza', async () => {
      await assert.rejects(
        service.sendMessage('conv-07', '   '),
        { message: 'El mensaje no puede estar vacío' }
      );
    });

    it('después de enviar, lastCustomerMessageAt no cambió', async () => {
      const convBefore = await service.getConversation('conv-07');
      const before = convBefore.lastCustomerMessageAt;
      await service.sendMessage('conv-07', 'Hola');
      const convAfter = await service.getConversation('conv-07');
      assert.equal(convAfter.lastCustomerMessageAt.getTime(), before.getTime());
    });

    it('tomar conv-05 (ventana roja) y luego enviar funciona', async () => {
      await service.takeConversation('conv-05');
      const msg = await service.sendMessage('conv-05', 'Respuesta');
      assert.equal(msg.author, 'human');
      assert.equal(msg.body, 'Respuesta');
    });

    it('id inexistente rechaza', async () => {
      await assert.rejects(
        service.sendMessage('no-existe', 'Hola'),
        { message: 'Conversación no encontrada' }
      );
    });
  });

  describe('updateConversation', () => {
    it('cambia customerName, tags y notes; ignora handler', async () => {
      const conv = await service.updateConversation('conv-01', {
        customerName: 'Ana',
        tags: ['vip'],
        notes: 'nota',
        handler: 'human'
      });
      assert.equal(conv.customerName, 'Ana');
      assert.deepEqual(conv.tags, ['vip']);
      assert.equal(conv.notes, 'nota');
      assert.equal(conv.handler, 'bot'); // no cambió
    });

    it('id inexistente rechaza', async () => {
      await assert.rejects(
        service.updateConversation('no-existe', { customerName: 'X' }),
        { message: 'Conversación no encontrada' }
      );
    });
  });

  describe('addSource', () => {
    it('agrega fuente ready y enabled, devuelve la fuente con id src-new-<n>', async () => {
      const src = await service.addSource('biz-gh', {
        kind: 'md',
        title: 'Nuevo markdown',
        origin: 'nuevo.md',
        charCount: 1500
      });
      assert.ok(src.id.startsWith('src-new-'));
      assert.equal(src.kind, 'md');
      assert.equal(src.title, 'Nuevo markdown');
      assert.equal(src.status, 'ready');
      assert.equal(src.enabled, true);
      assert.equal(src.charCount, 1500);
      assert.ok(src.updatedAt instanceof Date);
      assert.equal(src.previewText, '');
    });

    it('kind "doc" rechaza', async () => {
      await assert.rejects(
        service.addSource('biz-gh', { kind: 'doc', title: 'X', origin: 'x', charCount: 100 }),
        { message: 'Tipo de fuente no válido' }
      );
    });

    it('negocio inexistente rechaza', async () => {
      await assert.rejects(
        service.addSource('no-existe', { kind: 'md', title: 'X', origin: 'x', charCount: 100 }),
        { message: 'Negocio no encontrado' }
      );
    });

    it('título vacío rechaza', async () => {
      await assert.rejects(
        service.addSource('biz-gh', { kind: 'md', title: '  ', origin: 'x', charCount: 100 }),
        { message: 'Título requerido' }
      );
    });

    it('charCount negativo rechaza', async () => {
      await assert.rejects(
        service.addSource('biz-gh', { kind: 'md', title: 'X', origin: 'x', charCount: -1 }),
        { message: 'Tamaño no válido' }
      );
    });

    it('charCount no entero rechaza', async () => {
      await assert.rejects(
        service.addSource('biz-gh', { kind: 'md', title: 'X', origin: 'x', charCount: 10.5 }),
        { message: 'Tamaño no válido' }
      );
    });
  });

  describe('toggleSource', () => {
    it('cambia enabled y updatedAt', async () => {
      // primero agregamos una fuente
      const src = await service.addSource('biz-gh', { kind: 'md', title: 'Test', origin: 't.md', charCount: 100 });
      const toggled = await service.toggleSource(src.id, false);
      assert.equal(toggled.enabled, false);
      assert.ok(toggled.updatedAt instanceof Date);
      assert.ok(toggled.updatedAt.getTime() >= src.updatedAt.getTime());
    });

    it('id inexistente rechaza', async () => {
      await assert.rejects(
        service.toggleSource('no-existe', true),
        { message: 'Fuente no encontrada' }
      );
    });

    it('enabled no booleano rechaza', async () => {
      await assert.rejects(
        service.toggleSource('src-gh-url', 'true'),
        { message: 'Valor no válido' }
      );
    });
  });

  describe('deleteSource', () => {
    it('elimina la fuente', async () => {
      const src = await service.addSource('biz-gh', { kind: 'md', title: 'Para borrar', origin: 'd.md', charCount: 100 });
      await service.deleteSource(src.id);
      const sources = await service.listSources('biz-gh');
      assert.ok(!sources.some(s => s.id === src.id));
    });

    it('id inexistente rechaza', async () => {
      await assert.rejects(
        service.deleteSource('no-existe'),
        { message: 'Fuente no encontrada' }
      );
    });

    it('no devuelve nada', async () => {
      const src = await service.addSource('biz-gh', { kind: 'md', title: 'X', origin: '/docs/readme.md', charCount: 100 });
      const result = await service.deleteSource(src.id);
      assert.equal(result, undefined);
    });
  });

  describe('saveNotificationSettings', () => {
    it('email sin @ rechaza y no cambia settings', async () => {
      await assert.rejects(
        service.saveNotificationSettings({ email: 'abc' }),
        { message: 'Correo no válido' }
      );
      const settings = await service.getNotificationSettings();
      assert.equal(settings.email, 'admin@ejemplo.com'); // sin cambios
    });

    it('events no array de textos rechaza', async () => {
      await assert.rejects(
        service.saveNotificationSettings({ events: 'no-array' }),
        { message: 'Eventos no válidos' }
      );
    });

    it('email válido se guarda', async () => {
      const settings = await service.saveNotificationSettings({ email: 'hector@ejemplo.com' });
      assert.equal(settings.email, 'hector@ejemplo.com');
      const again = await service.getNotificationSettings();
      assert.equal(again.email, 'hector@ejemplo.com');
    });

    it('mezcla con ajustes actuales (solo email)', async () => {
      const settings = await service.saveNotificationSettings({ email: 'nuevo@ejemplo.com' });
      assert.equal(settings.email, 'nuevo@ejemplo.com');
      assert.deepEqual(settings.events, ['waiting_human', 'unanswered_15min', 'window_closing']);
      assert.deepEqual(settings.quietHours, { enabled: true, from: '23:00', to: '08:00' });
    });
  });

  describe('presupuesto de contexto con addSource/toggleSource/deleteSource (secuencial)', () => {
    it('secuencia completa: inicio 26700 -> encender text 31700 -> apagar md 22500 -> agregar md 24000 -> borrar url 15000', async () => {
      // Inicio: 26700 (warning)
      let sources = await service.listSources('biz-gh');
      let total = calculateTotalChars(sources);
      assert.equal(total, 26700);
      assert.equal(getBudgetLevel(total), 'warning');

      // Encender src-gh-text (5000): 31700 (danger)
      await service.toggleSource('src-gh-text', true);
      sources = await service.listSources('biz-gh');
      total = calculateTotalChars(sources);
      assert.equal(total, 31700);
      assert.equal(getBudgetLevel(total), 'danger');

      // Apagar src-gh-md (9200): 22500 (normal)
      await service.toggleSource('src-gh-md', false);
      sources = await service.listSources('biz-gh');
      total = calculateTotalChars(sources);
      assert.equal(total, 22500);
      assert.equal(getBudgetLevel(total), 'normal');

      // Agregar md de 1500: 24000 (normal)
      await service.addSource('biz-gh', { kind: 'md', title: 'Nuevo', origin: 'n.md', charCount: 1500 });
      sources = await service.listSources('biz-gh');
      total = calculateTotalChars(sources);
      assert.equal(total, 24000);
      assert.equal(getBudgetLevel(total), 'normal');

      // Borrar src-gh-url (9000): 15000 (normal)
      await service.deleteSource('src-gh-url');
      sources = await service.listSources('biz-gh');
      total = calculateTotalChars(sources);
      assert.equal(total, 15000);
      assert.equal(getBudgetLevel(total), 'normal');
    });
  });

  describe('dos servicios no comparten datos', () => {
    it('tomar conv-04 en uno no afecta al otro', async () => {
      const s1 = createMockService({ now: () => NOW });
      const s2 = createMockService({ now: () => NOW });

      await s1.takeConversation('conv-04');
      const conv1 = await s1.getConversation('conv-04');
      const conv2 = await s2.getConversation('conv-04');

      assert.equal(conv1.handler, 'human');
      assert.equal(conv2.handler, 'waiting_human');
    });

    it('un servicio nuevo siempre parte de los datos originales', async () => {
      const s1 = createMockService({ now: () => NOW });
      await s1.takeConversation('conv-04');
      await s1.addSource('biz-gh', { kind: 'md', title: 'Test', origin: 't.md', charCount: 100 });

      const s2 = createMockService({ now: () => NOW });
      const conv = await s2.getConversation('conv-04');
      const sources = await s2.listSources('biz-gh');

      assert.equal(conv.handler, 'waiting_human');
      // s2 no tiene la fuente agregada en s1
      assert.ok(!sources.some(s => s.title === 'Test'));
    });
  });

  describe('unicidad de IDs de mensajes tras tomar y devolver', () => {
    it('todos los IDs de mensajes de todas las conversaciones son únicos', async () => {
      await service.takeConversation('conv-04');
      await service.returnToBot('conv-07');
      await service.takeConversation('conv-05');

      const allMessages = [];
      for (const conv of await service.listConversations({})) {
        const msgs = await service.listMessages(conv.id);
        allMessages.push(...msgs);
      }

      const ids = allMessages.map(m => m.id);
      const uniqueIds = new Set(ids);
      assert.equal(ids.length, uniqueIds.size);
    });
  });
});