import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  digitsOnly,
  isValidWhatsAppNumber,
  buildWhatsAppLink,
  maskPhone,
  formatPhone,
} from '../src/domain/phone.js';

describe('phone.js - Teléfonos y enlace wa.me', () => {
  describe('digitsOnly', () => {
    it('elimina todo menos dígitos', () => {
      assert.equal(digitsOnly('(52) 33-1234 5678'), '523312345678');
    });

    it('con signo +', () => {
      assert.equal(digitsOnly('+52 33 1234 5678'), '523312345678');
    });

    it('solo dígitos queda igual', () => {
      assert.equal(digitsOnly('523312345678'), '523312345678');
    });
  });

  describe('isValidWhatsAppNumber', () => {
    it('9 dígitos es false', () => {
      assert.equal(isValidWhatsAppNumber('123456789'), false);
    });

    it('10 dígitos es true', () => {
      assert.equal(isValidWhatsAppNumber('5233123456'), true);
    });

    it('15 dígitos es true', () => {
      assert.equal(isValidWhatsAppNumber('523312345678901'), true);
    });

    it('16 dígitos es false', () => {
      assert.equal(isValidWhatsAppNumber('5233123456789012'), false);
    });

    it('acepta entrada con espacios, guiones, paréntesis y +', () => {
      assert.equal(isValidWhatsAppNumber('+52 33 1234 5678'), true);
      assert.equal(isValidWhatsAppNumber('(52) 33-1234-5678'), true);
    });
  });

  describe('buildWhatsAppLink', () => {
    it('+52 33 1234 5678 produce https://wa.me/523312345678', () => {
      assert.equal(buildWhatsAppLink('+52 33 1234 5678'), 'https://wa.me/523312345678');
    });

    it('menos de 10 dígitos da null', () => {
      assert.equal(buildWhatsAppLink('123456789'), null);
    });

    it('más de 15 dígitos da null', () => {
      assert.equal(buildWhatsAppLink('5233123456789012'), null);
    });

    it('acepta entrada con espacios, guiones, paréntesis y +', () => {
      assert.equal(buildWhatsAppLink('(52) 33-1234-5678'), 'https://wa.me/523312345678');
    });
  });

  describe('maskPhone', () => {
    it('+52 33 1234 5678 da +52 33 ••• 5678', () => {
      assert.equal(maskPhone('+52 33 1234 5678'), '+52 33 ••• 5678');
    });

    it('9 dígitos da ••• seguido de últimos 4', () => {
      assert.equal(maskPhone('123456789'), '••• 6789');
    });

    it('8 dígitos da ••• seguido de últimos 4', () => {
      assert.equal(maskPhone('12345678'), '••• 5678');
    });

    it('3 dígitos da ••• seguido de todos', () => {
      assert.equal(maskPhone('123'), '••• 123');
    });

    it('acepta entrada con espacios, guiones, paréntesis y +', () => {
      assert.equal(maskPhone('(52) 33-1234-5678'), '+52 33 ••• 5678');
    });
  });

  describe('formatPhone', () => {
    it('12 dígitos da +52 33 1234 5678 (2,2,4,4)', () => {
      assert.equal(formatPhone('523312345678'), '+52 33 1234 5678');
    });

    it('10 dígitos da + seguido de dígitos', () => {
      assert.equal(formatPhone('5233123456'), '+5233123456');
    });

    it('15 dígitos da + seguido de dígitos', () => {
      assert.equal(formatPhone('523312345678901'), '+523312345678901');
    });

    it('acepta entrada con espacios, guiones, paréntesis y +', () => {
      assert.equal(formatPhone('+52 33 1234 5678'), '+52 33 1234 5678');
      assert.equal(formatPhone('(52) 33-1234-5678'), '+52 33 1234 5678');
    });
  });
});