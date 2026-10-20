import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  BUSINESS_COLOR_PALETTE,
  validateBusinessName,
  validateBusinessColor,
  getBusinessInitial,
} from '../src/domain/business.js';
import { createMockService } from '../src/services/mockService.js';

describe('business domain', () => {
  describe('BUSINESS_COLOR_PALETTE', () => {
    it('has at least 8 colors', () => {
      assert.ok(BUSINESS_COLOR_PALETTE.length >= 8);
    });

    it('all colors are valid hex strings', () => {
      const hexRegex = /^#[0-9a-fA-F]{6}$/;
      for (const color of BUSINESS_COLOR_PALETTE) {
        assert.match(color, hexRegex);
      }
    });

    it('all colors are lowercase', () => {
      for (const color of BUSINESS_COLOR_PALETTE) {
        assert.equal(color, color.toLowerCase());
      }
    });

    it('colors are unique', () => {
      const unique = new Set(BUSINESS_COLOR_PALETTE);
      assert.equal(unique.size, BUSINESS_COLOR_PALETTE.length);
    });
  });

  describe('validateBusinessName', () => {
    it('accepts valid name', () => {
      const result = validateBusinessName('Mi Negocio');
      assert.equal(result.valid, true);
      assert.equal(result.error, undefined);
    });

    it('rejects undefined', () => {
      const result = validateBusinessName(undefined);
      assert.equal(result.valid, false);
      assert.equal(result.error, 'Nombre requerido');
    });

    it('rejects null', () => {
      const result = validateBusinessName(null);
      assert.equal(result.valid, false);
      assert.equal(result.error, 'Nombre requerido');
    });

    it('rejects empty string', () => {
      const result = validateBusinessName('');
      assert.equal(result.valid, false);
      assert.equal(result.error, 'El nombre no puede estar vacío');
    });

    it('rejects whitespace only', () => {
      const result = validateBusinessName('   ');
      assert.equal(result.valid, false);
      assert.equal(result.error, 'El nombre no puede estar vacío');
    });

    it('rejects name over 100 chars', () => {
      const longName = 'a'.repeat(101);
      const result = validateBusinessName(longName);
      assert.equal(result.valid, false);
      assert.equal(result.error, 'El nombre excede el límite de 100 caracteres');
    });

    it('accepts name exactly 100 chars', () => {
      const exactName = 'a'.repeat(100);
      const result = validateBusinessName(exactName);
      assert.equal(result.valid, true);
    });

    it('rejects duplicate name (case insensitive)', () => {
      const existing = ['Mi Negocio', 'Otro'];
      const result = validateBusinessName('mi negocio', existing);
      assert.equal(result.valid, false);
      assert.equal(result.error, 'Ya existe un negocio con ese nombre');
    });

    it('rejects duplicate name with different whitespace', () => {
      const existing = ['Mi Negocio'];
      const result = validateBusinessName('  Mi Negocio  ', existing);
      assert.equal(result.valid, false);
      assert.equal(result.error, 'Ya existe un negocio con ese nombre');
    });

    it('accepts similar but different name', () => {
      const existing = ['Mi Negocio'];
      const result = validateBusinessName('Mi Negocio 2', existing);
      assert.equal(result.valid, true);
    });
  });

  describe('validateBusinessColor', () => {
    it('returns true for valid palette color', () => {
      assert.equal(validateBusinessColor('#1d4ed8'), true);
      assert.equal(validateBusinessColor('#15803d'), true);
      assert.equal(validateBusinessColor('#c2410c'), true);
    });

    it('returns false for non-hex string', () => {
      assert.equal(validateBusinessColor('blue'), false);
      assert.equal(validateBusinessColor('rgb(0,0,0)'), false);
      assert.equal(validateBusinessColor(''), false);
    });

    it('returns false for invalid hex format', () => {
      assert.equal(validateBusinessColor('#123'), false);
      assert.equal(validateBusinessColor('#gggggg'), false);
      assert.equal(validateBusinessColor('1d4ed8'), false);
    });

    it('returns false for valid hex not in palette', () => {
      assert.equal(validateBusinessColor('#ff0000'), false);
      assert.equal(validateBusinessColor('#00ff00'), false);
      assert.equal(validateBusinessColor('#0000ff'), false);
    });

    it('returns false for non-string input', () => {
      assert.equal(validateBusinessColor(123), false);
      assert.equal(validateBusinessColor(null), false);
      assert.equal(validateBusinessColor(undefined), false);
    });

    it('handles uppercase hex in palette check', () => {
      // Function normalizes to lowercase, so uppercase version should be valid
      assert.equal(validateBusinessColor('#1D4ED8'), true);
    });
  });

  describe('getBusinessInitial', () => {
    it('returns first letter uppercase', () => {
      assert.equal(getBusinessInitial('Mi Negocio'), 'M');
      assert.equal(getBusinessInitial('negocio'), 'N');
    });

    it('handles leading/trailing whitespace', () => {
      assert.equal(getBusinessInitial('  Mi Negocio  '), 'M');
    });

    it('returns ? for empty string', () => {
      assert.equal(getBusinessInitial(''), '?');
    });

    it('returns ? for whitespace only', () => {
      assert.equal(getBusinessInitial('   '), '?');
    });

    it('returns ? for null', () => {
      assert.equal(getBusinessInitial(null), '?');
    });

    it('returns ? for undefined', () => {
      assert.equal(getBusinessInitial(undefined), '?');
    });

    it('returns ? for non-string', () => {
      assert.equal(getBusinessInitial(123), '?');
    });
  });
});

describe('mockService business CRUD', () => {
  let service;
  const fixedNow = new Date('2026-01-15T10:00:00Z');

  beforeEach(() => {
    service = createMockService({ now: () => fixedNow });
  });

  describe('updateBusiness', () => {
    it('updates business name', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      const updated = await service.updateBusiness(bizId, { name: 'Nuevo Nombre' });
      assert.equal(updated.name, 'Nuevo Nombre');
    });

    it('updates business color', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      const updated = await service.updateBusiness(bizId, { color: '#15803d' });
      assert.equal(updated.color, '#15803d');
    });

    it('rejects invalid color', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      await assert.rejects(
        service.updateBusiness(bizId, { color: '#ff0000' }),
        /Color no válido/
      );
    });

    it('rejects duplicate name', async () => {
      const businesses = await service.listBusinesses();
      const bizId1 = businesses[0].id;
      const bizId2 = businesses[1].id;
      await assert.rejects(
        service.updateBusiness(bizId1, { name: businesses[1].name }),
        /Ya existe un negocio con ese nombre/
      );
    });

    it('throws for non-existent business', async () => {
      await assert.rejects(
        service.updateBusiness('biz-999', { name: 'Test' }),
        /Negocio no encontrado/
      );
    });
  });

  describe('deleteBusiness', () => {
    it('deletes business and associated numbers', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      await service.deleteBusiness(bizId);
      const remaining = await service.listBusinesses();
      assert.ok(!remaining.find(b => b.id === bizId));
      const numbers = await service.listNumbers(bizId);
      assert.equal(numbers.length, 0);
    });

    it('throws for non-existent business', async () => {
      await assert.rejects(
        service.deleteBusiness('biz-999'),
        /Negocio no encontrado/
      );
    });
  });

  describe('addNumber', () => {
    it('adds phone number to business', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      const number = await service.addNumber(bizId, {
        displayName: 'Línea Principal',
        e164: '+34600111222',
      });
      assert.equal(number.businessId, bizId);
      assert.equal(number.displayName, 'Línea Principal');
      assert.equal(number.e164, '+34600111222');
      assert.equal(number.status, 'connected');
    });

    it('rejects invalid e164 (too short)', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      await assert.rejects(
        service.addNumber(bizId, { displayName: 'Test', e164: '+123' }),
        /Teléfono no válido/
      );
    });

    it('rejects missing displayName', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      await assert.rejects(
        service.addNumber(bizId, { displayName: '', e164: '+34600111222' }),
        /Nombre para mostrar requerido/
      );
    });

    it('throws for non-existent business', async () => {
      await assert.rejects(
        service.addNumber('biz-999', { displayName: 'Test', e164: '+34600111222' }),
        /Negocio no encontrado/
      );
    });
  });

  describe('updateNumber', () => {
    it('updates phone number displayName', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      const number = await service.addNumber(bizId, {
        displayName: 'Original',
        e164: '+34600111222',
      });
      const updated = await service.updateNumber(number.id, { displayName: 'Actualizado' });
      assert.equal(updated.displayName, 'Actualizado');
    });

    it('updates phone number e164', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      const number = await service.addNumber(bizId, {
        displayName: 'Test',
        e164: '+34600111222',
      });
      const updated = await service.updateNumber(number.id, { e164: '+34699887766' });
      assert.equal(updated.e164, '+34699887766');
    });

    it('rejects invalid e164', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      const number = await service.addNumber(bizId, {
        displayName: 'Test',
        e164: '+34600111222',
      });
      await assert.rejects(
        service.updateNumber(number.id, { e164: '+123' }),
        /Teléfono no válido/
      );
    });

    it('throws for non-existent number', async () => {
      await assert.rejects(
        service.updateNumber('num-999', { displayName: 'Test' }),
        /Número no encontrado/
      );
    });
  });

  describe('deleteNumber', () => {
    it('deletes phone number', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      const number = await service.addNumber(bizId, {
        displayName: 'Test',
        e164: '+34600111222',
      });
      await service.deleteNumber(number.id);
      const numbers = await service.listNumbers(bizId);
      assert.ok(!numbers.find(n => n.id === number.id));
    });

    it('throws for non-existent number', async () => {
      await assert.rejects(
        service.deleteNumber('num-999'),
        /Número no encontrado/
      );
    });
  });
});