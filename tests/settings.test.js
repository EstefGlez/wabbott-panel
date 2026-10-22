import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEmail,
  formatTimeHHMM,
  parseTimeHHMM,
  mergeSettings,
  getEventLabel,
} from '../src/domain/settings.js';

describe('validateEmail', () => {
  it('email válido → { valid: true }', () => {
    const result = validateEmail('admin@ejemplo.com');
    assert.deepEqual(result, { valid: true });
  });

  it('sin @ → { valid: false, error }', () => {
    const result = validateEmail('admin-ejemplo.com');
    assert.equal(result.valid, false);
    assert.ok(result.error);
  });

  it('vacío → { valid: false, error }', () => {
    const result = validateEmail('');
    assert.equal(result.valid, false);
    assert.ok(result.error);
  });

  it('solo local-part → { valid: false, error }', () => {
    const result = validateEmail('admin@');
    assert.equal(result.valid, false);
    assert.ok(result.error);
  });

  it('dominio sin punto → { valid: false, error }', () => {
    const result = validateEmail('admin@ejemplo');
    assert.equal(result.valid, false);
    assert.ok(result.error);
  });

  it('espacios alrededor → válido', () => {
    const result = validateEmail('  admin@ejemplo.com  ');
    assert.deepEqual(result, { valid: true });
  });
});

describe('formatTimeHHMM', () => {
  it('Date(2024,0,1,23,0) → "23:00"', () => {
    const date = new Date(2024, 0, 1, 23, 0);
    assert.equal(formatTimeHHMM(date), '23:00');
  });

  it('Date(2024,0,1,8,5) → "08:05"', () => {
    const date = new Date(2024, 0, 1, 8, 5);
    assert.equal(formatTimeHHMM(date), '08:05');
  });

  it('Date(2024,0,1,0,0) → "00:00"', () => {
    const date = new Date(2024, 0, 1, 0, 0);
    assert.equal(formatTimeHHMM(date), '00:00');
  });

  it('Date inválida → lanza Error', () => {
    assert.throws(() => formatTimeHHMM(new Date('invalid')), /Fecha inválida/);
  });
});

describe('parseTimeHHMM', () => {
  it('"23:00" → Date hoy 23:00', () => {
    const result = parseTimeHHMM('23:00');
    assert.ok(result instanceof Date);
    assert.equal(result.getHours(), 23);
    assert.equal(result.getMinutes(), 0);
    assert.equal(result.getSeconds(), 0);
    assert.equal(result.getMilliseconds(), 0);
  });

  it('"08:05" → Date hoy 08:05', () => {
    const result = parseTimeHHMM('08:05');
    assert.ok(result instanceof Date);
    assert.equal(result.getHours(), 8);
    assert.equal(result.getMinutes(), 5);
  });

  it('"00:00" → Date hoy 00:00', () => {
    const result = parseTimeHHMM('00:00');
    assert.ok(result instanceof Date);
    assert.equal(result.getHours(), 0);
    assert.equal(result.getMinutes(), 0);
  });

  it('"24:00" → null (hora inválida)', () => {
    assert.equal(parseTimeHHMM('24:00'), null);
  });

  it('"25:00" → null (hora inválida)', () => {
    assert.equal(parseTimeHHMM('25:00'), null);
  });

  it('"12:60" → null (minutos inválidos)', () => {
    assert.equal(parseTimeHHMM('12:60'), null);
  });

  it('"abc" → null (formato inválido)', () => {
    assert.equal(parseTimeHHMM('abc'), null);
  });

  it('null → null', () => {
    assert.equal(parseTimeHHMM(null), null);
  });

  it('undefined → null', () => {
    assert.equal(parseTimeHHMM(undefined), null);
  });
});

describe('mergeSettings', () => {
  const base = {
    email: 'admin@ejemplo.com',
    events: ['waiting_human', 'unanswered_15min'],
    quietHours: { enabled: true, from: '23:00', to: '08:00' },
  };

  it('cambia solo email → mantiene events y quietHours', () => {
    const result = mergeSettings(base, { email: 'nuevo@ejemplo.com' });
    assert.equal(result.email, 'nuevo@ejemplo.com');
    assert.deepEqual(result.events, base.events);
    assert.deepEqual(result.quietHours, base.quietHours);
  });

  it('cambia events → mantiene email y quietHours', () => {
    const result = mergeSettings(base, { events: ['window_closing'] });
    assert.equal(result.email, base.email);
    assert.deepEqual(result.events, ['window_closing']);
    assert.deepEqual(result.quietHours, base.quietHours);
  });

  it('quietHours.enabled=false → quita from/to (mantiene defaults)', () => {
    const result = mergeSettings(base, { quietHours: { enabled: false } });
    assert.equal(result.quietHours.enabled, false);
    assert.equal(result.quietHours.from, '23:00');
    assert.equal(result.quietHours.to, '08:00');
  });

  it('quietHours null → enabled=false con defaults', () => {
    const result = mergeSettings(base, { quietHours: null });
    assert.equal(result.quietHours.enabled, false);
    assert.equal(result.quietHours.from, '23:00');
    assert.equal(result.quietHours.to, '08:00');
  });

  it('quietHours parcial → completa con defaults', () => {
    const result = mergeSettings(base, { quietHours: { enabled: true, from: '22:00' } });
    assert.equal(result.quietHours.enabled, true);
    assert.equal(result.quietHours.from, '22:00');
    assert.equal(result.quietHours.to, '08:00');
  });

  it('sin cambios → igual al original', () => {
    const result = mergeSettings(base, {});
    assert.deepEqual(result, base);
  });
});

describe('getEventLabel', () => {
  it('waiting_human → "Nueva conversación esperando asesor"', () => {
    assert.equal(getEventLabel('waiting_human'), 'Nueva conversación esperando asesor');
  });

  it('unanswered_15min → "Cliente escribe y nadie responde en 15 min"', () => {
    assert.equal(getEventLabel('unanswered_15min'), 'Cliente escribe y nadie responde en 15 min');
  });

  it('window_closing → "Ventana por cerrar en conversaciones atendidas"', () => {
    assert.equal(getEventLabel('window_closing'), 'Ventana por cerrar en conversaciones atendidas');
  });

  it('clave desconocida → devuelve la clave original', () => {
    assert.equal(getEventLabel('unknown_event'), 'unknown_event');
  });
});