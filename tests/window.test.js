import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getWindowExpiration,
  getWindowRemainingMs,
  getWindowStatus,
  getWindowChip,
} from '../src/domain/window.js';

describe('window.js - Ventana de 24 horas', () => {
  const MS_PER_HOUR = 60 * 60 * 1000;

  describe('getWindowExpiration', () => {
    it('devuelve lastCustomerMessageAt + 24h', () => {
      const lastMsg = new Date('2026-01-01T10:00:00Z');
      const exp = getWindowExpiration(lastMsg);
      assert.deepEqual(exp, new Date('2026-01-02T10:00:00Z'));
    });

    it('acepta string ISO', () => {
      const exp = getWindowExpiration('2026-01-01T10:00:00Z');
      assert.deepEqual(exp, new Date('2026-01-02T10:00:00Z'));
    });

    it('devuelve null si entrada es null', () => {
      assert.equal(getWindowExpiration(null), null);
    });
  });

  describe('getWindowRemainingMs', () => {
    it('devuelve ms restantes positivos', () => {
      const now = new Date('2026-01-01T10:00:00Z');
      const lastMsg = new Date('2026-01-01T08:00:00Z'); // 2h ago
      const rem = getWindowRemainingMs(lastMsg, now);
      assert.equal(rem, 22 * MS_PER_HOUR);
    });

    it('devuelve 0 si entrada es null', () => {
      assert.equal(getWindowRemainingMs(null, new Date()), 0);
    });

    it('devuelve negativo si ventana ya cerró', () => {
      const now = new Date('2026-01-01T10:00:00Z');
      const lastMsg = new Date('2025-12-31T08:00:00Z'); // 26h ago
      const rem = getWindowRemainingMs(lastMsg, now);
      assert.ok(rem < 0);
    });
  });

  describe('getWindowStatus', () => {
    it('verde: más de 6h (6h + 1ms restantes)', () => {
      const now = new Date('2026-01-01T10:00:00Z');
      // Mensaje hace 17h 59m 59s -> quedan 6h 0m 1s
      const lastMsg = new Date(now.getTime() - (17 * MS_PER_HOUR + 59 * 60 * 1000 + 999));
      assert.equal(getWindowStatus(lastMsg, now), 'green');
    });

    it('ámbar: exactamente 6h restantes', () => {
      const now = new Date('2026-01-01T10:00:00Z');
      // Mensaje hace 18h -> quedan exactamente 6h
      const lastMsg = new Date(now.getTime() - 18 * MS_PER_HOUR);
      assert.equal(getWindowStatus(lastMsg, now), 'amber');
    });

    it('ámbar: 1h exactamente restante', () => {
      const now = new Date('2026-01-01T10:00:00Z');
      // Mensaje hace 23h -> queda 1h
      const lastMsg = new Date(now.getTime() - 23 * MS_PER_HOUR);
      assert.equal(getWindowStatus(lastMsg, now), 'amber');
    });

    it('rojo: 1h - 1ms restante', () => {
      const now = new Date('2026-01-01T10:00:00Z');
      // Mensaje hace 23h 0m 1s -> quedan 59m 59s
      const lastMsg = new Date(now.getTime() - (23 * MS_PER_HOUR + 1000));
      assert.equal(getWindowStatus(lastMsg, now), 'red');
    });

    it('cerrada: exactamente 0', () => {
      const now = new Date('2026-01-01T10:00:00Z');
      // Mensaje hace 24h -> quedan 0
      const lastMsg = new Date(now.getTime() - 24 * MS_PER_HOUR);
      assert.equal(getWindowStatus(lastMsg, now), 'closed');
    });

    it('cerrada: negativo', () => {
      const now = new Date('2026-01-01T10:00:00Z');
      // Mensaje hace 25h -> quedan -1h
      const lastMsg = new Date(now.getTime() - 25 * MS_PER_HOUR);
      assert.equal(getWindowStatus(lastMsg, now), 'closed');
    });

    it('cerrada: entrada null', () => {
      assert.equal(getWindowStatus(null, new Date()), 'closed');
    });
  });

  describe('getWindowChip', () => {
    it('verde: etiqueta con horas y minutos', () => {
      const now = new Date('2026-01-01T10:00:00Z');
      // Mensaje hace 5h -> quedan 19h
      const lastMsg = new Date(now.getTime() - 5 * MS_PER_HOUR);
      const chip = getWindowChip(lastMsg, now);
      assert.equal(chip.status, 'green');
      assert.equal(chip.label, 'Quedan 19 h 0 min');
    });

    it('ámbar: etiqueta con horas y minutos', () => {
      const now = new Date('2026-01-01T10:00:00Z');
      // Mensaje hace 18h -> quedan 6h (ámbar)
      const lastMsg = new Date(now.getTime() - 18 * MS_PER_HOUR);
      const chip = getWindowChip(lastMsg, now);
      assert.equal(chip.status, 'amber');
      assert.equal(chip.label, 'Quedan 6 h 0 min');
    });

    it('rojo: menos de 1h muestra solo minutos', () => {
      const now = new Date('2026-01-01T10:00:00Z');
      // Mensaje hace 23.5h -> quedan 30min (rojo)
      const lastMsg = new Date(now.getTime() - 23.5 * MS_PER_HOUR);
      const chip = getWindowChip(lastMsg, now);
      assert.equal(chip.status, 'red');
      assert.equal(chip.label, 'Quedan 30 min');
    });

    it('cerrada: etiqueta "Cerrada"', () => {
      const now = new Date('2026-01-01T10:00:00Z');
      const lastMsg = new Date(now.getTime() - 25 * MS_PER_HOUR);
      const chip = getWindowChip(lastMsg, now);
      assert.equal(chip.status, 'closed');
      assert.equal(chip.label, 'Cerrada');
    });

    it('cerrada: entrada null', () => {
      const chip = getWindowChip(null, new Date());
      assert.equal(chip.status, 'closed');
      assert.equal(chip.label, 'Cerrada');
    });

    it('mensaje recién enviado: "Quedan 24 h 0 min"', () => {
      const now = new Date('2026-01-01T10:00:00Z');
      const lastMsg = new Date(now.getTime()); // mismo instante (0ms atrás)
      const chip = getWindowChip(lastMsg, now);
      assert.equal(chip.label, 'Quedan 24 h 0 min');
    });

    it('minutos redondeados hacia abajo', () => {
      const now = new Date('2026-01-01T10:00:00Z');
      // 23h 14m 30s ago -> 45m 30s left -> redondea a 45 min
      const lastMsg = new Date(now.getTime() - (23 * MS_PER_HOUR + 14 * 60 * 1000 + 30 * 1000));
      const chip = getWindowChip(lastMsg, now);
      assert.equal(chip.label, 'Quedan 45 min');
    });
  });
});