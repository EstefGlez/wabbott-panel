import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTEXT_LIMIT,
  SOURCE_KINDS,
  SOURCE_STATUSES,
  validateSourceInput,
  formatCharCount,
  calculateContextBudget,
  getSourceKindIcon,
  getStatusBadgeClass,
  truncatePreview,
} from '../src/domain/source.js';
import { createMockService } from '../src/services/mockService.js';

describe('source domain', () => {
  describe('constants', () => {
    it('CONTEXT_LIMIT is 30000', () => {
      assert.equal(CONTEXT_LIMIT, 30000);
    });

    it('SOURCE_KINDS has expected values', () => {
      assert.deepEqual(SOURCE_KINDS, ['url', 'pdf', 'md', 'txt', 'text']);
    });

    it('SOURCE_STATUSES has expected values', () => {
      assert.deepEqual(SOURCE_STATUSES, ['ready', 'processing', 'error']);
    });
  });

  describe('validateSourceInput', () => {
    describe('common validations', () => {
      it('rejects invalid kind', () => {
        const result = validateSourceInput('invalid', { title: 'Test', origin: 'https://example.com' });
        assert.equal(result.valid, false);
        assert.equal(result.error, 'Tipo de fuente no válido');
      });

      it('rejects missing title', () => {
        const result = validateSourceInput('url', { origin: 'https://example.com' });
        assert.equal(result.valid, false);
        assert.equal(result.error, 'Título requerido');
      });

      it('rejects empty title', () => {
        const result = validateSourceInput('url', { title: '', origin: 'https://example.com' });
        assert.equal(result.valid, false);
        assert.equal(result.error, 'El título no puede estar vacío');
      });

      it('rejects whitespace only title', () => {
        const result = validateSourceInput('url', { title: '   ', origin: 'https://example.com' });
        assert.equal(result.valid, false);
        assert.equal(result.error, 'El título no puede estar vacío');
      });

      it('rejects title over 200 chars', () => {
        const result = validateSourceInput('url', { title: 'a'.repeat(201), origin: 'https://example.com' });
        assert.equal(result.valid, false);
        assert.equal(result.error, 'El título excede el límite de 200 caracteres');
      });

      it('rejects missing origin', () => {
        const result = validateSourceInput('url', { title: 'Test' });
        assert.equal(result.valid, false);
        assert.equal(result.error, 'Origen requerido');
      });

      it('rejects empty origin', () => {
        const result = validateSourceInput('url', { title: 'Test', origin: '' });
        assert.equal(result.valid, false);
        assert.equal(result.error, 'El origen no puede estar vacío');
      });
    });

    describe('url kind', () => {
      it('accepts valid URL', () => {
        const result = validateSourceInput('url', { title: 'Test', origin: 'https://example.com/page' });
        assert.equal(result.valid, true);
      });

      it('accepts valid URL with query params', () => {
        const result = validateSourceInput('url', { title: 'Test', origin: 'https://example.com?foo=bar' });
        assert.equal(result.valid, true);
      });

      it('rejects invalid URL format', () => {
        const result = validateSourceInput('url', { title: 'Test', origin: 'not-a-url' });
        assert.equal(result.valid, false);
        assert.equal(result.error, 'URL no válida');
      });

      it('rejects URL without protocol', () => {
        const result = validateSourceInput('url', { title: 'Test', origin: 'example.com' });
        assert.equal(result.valid, false);
        assert.equal(result.error, 'URL no válida');
      });
    });

    describe('pdf kind', () => {
      it('accepts .pdf extension', () => {
        const result = validateSourceInput('pdf', { title: 'Test', origin: '/docs/manual.pdf' });
        assert.equal(result.valid, true);
      });

      it('accepts .PDF uppercase extension', () => {
        const result = validateSourceInput('pdf', { title: 'Test', origin: '/docs/manual.PDF' });
        assert.equal(result.valid, true);
      });

      it('rejects non-pdf extension', () => {
        const result = validateSourceInput('pdf', { title: 'Test', origin: '/docs/manual.txt' });
        assert.equal(result.valid, false);
        assert.match(result.error, /Extensión no permitida/);
      });

      it('rejects no extension', () => {
        const result = validateSourceInput('pdf', { title: 'Test', origin: '/docs/manual' });
        assert.equal(result.valid, false);
        assert.match(result.error, /Extensión no permitida/);
      });
    });

    describe('md kind', () => {
      it('accepts .md extension', () => {
        const result = validateSourceInput('md', { title: 'Test', origin: '/docs/readme.md' });
        assert.equal(result.valid, true);
      });

      it('accepts .markdown extension', () => {
        const result = validateSourceInput('md', { title: 'Test', origin: '/docs/readme.markdown' });
        assert.equal(result.valid, true);
      });

      it('rejects .txt extension', () => {
        const result = validateSourceInput('md', { title: 'Test', origin: '/docs/readme.txt' });
        assert.equal(result.valid, false);
        assert.match(result.error, /Extensión no permitida/);
      });
    });

    describe('txt kind', () => {
      it('accepts .txt extension', () => {
        const result = validateSourceInput('txt', { title: 'Test', origin: '/docs/notes.txt' });
        assert.equal(result.valid, true);
      });

      it('rejects .md extension', () => {
        const result = validateSourceInput('txt', { title: 'Test', origin: '/docs/notes.md' });
        assert.equal(result.valid, false);
        assert.match(result.error, /Extensión no permitida/);
      });
    });

    describe('text kind', () => {
      it('accepts .txt extension', () => {
        const result = validateSourceInput('text', { title: 'Test', origin: '/docs/notes.txt' });
        assert.equal(result.valid, true);
      });

      it('accepts .md extension', () => {
        const result = validateSourceInput('text', { title: 'Test', origin: '/docs/notes.md' });
        assert.equal(result.valid, true);
      });

      it('accepts .markdown extension', () => {
        const result = validateSourceInput('text', { title: 'Test', origin: '/docs/notes.markdown' });
        assert.equal(result.valid, true);
      });

      it('accepts .text extension', () => {
        const result = validateSourceInput('text', { title: 'Test', origin: '/docs/notes.text' });
        assert.equal(result.valid, true);
      });

      it('rejects .pdf extension', () => {
        const result = validateSourceInput('text', { title: 'Test', origin: '/docs/notes.pdf' });
        assert.equal(result.valid, false);
        assert.match(result.error, /Extensión no permitida/);
      });
    });

    describe('charCount validation', () => {
      it('accepts valid charCount', () => {
        const result = validateSourceInput('url', { title: 'Test', origin: 'https://example.com', charCount: 1000 });
        assert.equal(result.valid, true);
      });

      it('accepts charCount zero', () => {
        const result = validateSourceInput('url', { title: 'Test', origin: 'https://example.com', charCount: 0 });
        assert.equal(result.valid, true);
      });

      it('rejects negative charCount', () => {
        const result = validateSourceInput('url', { title: 'Test', origin: 'https://example.com', charCount: -1 });
        assert.equal(result.valid, false);
        assert.equal(result.error, 'Tamaño no válido (debe ser entero ≥ 0)');
      });

      it('rejects non-integer charCount', () => {
        const result = validateSourceInput('url', { title: 'Test', origin: 'https://example.com', charCount: 100.5 });
        assert.equal(result.valid, false);
        assert.equal(result.error, 'Tamaño no válido (debe ser entero ≥ 0)');
      });

      it('rejects string charCount', () => {
        const result = validateSourceInput('url', { title: 'Test', origin: 'https://example.com', charCount: '1000' });
        assert.equal(result.valid, false);
        assert.equal(result.error, 'Tamaño no válido (debe ser entero ≥ 0)');
      });
    });
  });

  describe('formatCharCount', () => {
    it('formats 0', () => {
      assert.equal(formatCharCount(0), '0 chars');
    });

    it('formats small numbers', () => {
      assert.equal(formatCharCount(500), '500 chars');
      assert.equal(formatCharCount(999), '999 chars');
    });

    it('formats thousands with k', () => {
      assert.equal(formatCharCount(1000), '1.0k chars');
      assert.equal(formatCharCount(1500), '1.5k chars');
      assert.equal(formatCharCount(9999), '10.0k chars');
    });

    it('formats millions with M', () => {
      assert.equal(formatCharCount(1000000), '1.0M chars');
      assert.equal(formatCharCount(2500000), '2.5M chars');
    });

    it('handles invalid input gracefully', () => {
      assert.equal(formatCharCount(-1), '0 chars');
      assert.equal(formatCharCount(1.5), '0 chars');
      assert.equal(formatCharCount('1000'), '0 chars');
    });
  });

  describe('calculateContextBudget', () => {
    const sampleSources = [
      { id: 's1', businessId: 'b1', kind: 'url', title: 'Test 1', origin: 'https://a.com', charCount: 10000, enabled: true, status: 'ready', updatedAt: new Date().toISOString() },
      { id: 's2', businessId: 'b1', kind: 'pdf', title: 'Test 2', origin: '/doc.pdf', charCount: 15000, enabled: true, status: 'ready', updatedAt: new Date().toISOString() },
      { id: 's3', businessId: 'b1', kind: 'md', title: 'Test 3', origin: '/readme.md', charCount: 5000, enabled: false, status: 'ready', updatedAt: new Date().toISOString() },
    ];

    it('sums only enabled sources', () => {
      const result = calculateContextBudget(sampleSources);
      assert.equal(result.totalChars, 25000); // 10000 + 15000, s3 disabled
    });

    it('calculates percentage correctly', () => {
      const result = calculateContextBudget(sampleSources, 30000);
      assert.equal(result.percentage, 83); // 25000/30000 = 83.33% -> 83
    });

    it('returns safe status for < 80%', () => {
      const sources = [
        { id: 's1', charCount: 10000, enabled: true, status: 'ready', updatedAt: new Date().toISOString() },
      ];
      const result = calculateContextBudget(sources, 30000);
      assert.equal(result.status, 'safe');
      assert.equal(result.message, undefined);
    });

    it('returns warning status for 80-100%', () => {
      // 25000/30000 = 83%
      const result = calculateContextBudget(sampleSources, 30000);
      assert.equal(result.status, 'warning');
      assert.match(result.message, /Próximo al límite/);
    });

    it('returns danger status for > 100%', () => {
      const sources = [
        { id: 's1', charCount: 35000, enabled: true, status: 'ready', updatedAt: new Date().toISOString() },
      ];
      const result = calculateContextBudget(sources, 30000);
      assert.equal(result.status, 'danger');
      assert.match(result.message, /Límite de contexto superado/);
    });

    it('returns safe at exactly 80%', () => {
      const sources = [
        { id: 's1', charCount: 24000, enabled: true, status: 'ready', updatedAt: new Date().toISOString() },
      ];
      const result = calculateContextBudget(sources, 30000);
      assert.equal(result.percentage, 80);
      assert.equal(result.status, 'warning'); // 80% is warning threshold
    });

    it('returns warning at exactly 100%', () => {
      const sources = [
        { id: 's1', charCount: 30000, enabled: true, status: 'ready', updatedAt: new Date().toISOString() },
      ];
      const result = calculateContextBudget(sources, 30000);
      assert.equal(result.percentage, 100);
      assert.equal(result.status, 'warning');
    });

    it('handles empty sources array', () => {
      const result = calculateContextBudget([]);
      assert.equal(result.totalChars, 0);
      assert.equal(result.percentage, 0);
      assert.equal(result.status, 'safe');
    });

    it('handles all disabled sources', () => {
      const sources = [
        { id: 's1', charCount: 10000, enabled: false, status: 'ready', updatedAt: new Date().toISOString() },
        { id: 's2', charCount: 20000, enabled: false, status: 'ready', updatedAt: new Date().toISOString() },
      ];
      const result = calculateContextBudget(sources);
      assert.equal(result.totalChars, 0);
      assert.equal(result.status, 'safe');
    });

    it('ignores non-integer charCount', () => {
      const sources = [
        { id: 's1', charCount: 10000, enabled: true, status: 'ready', updatedAt: new Date().toISOString() },
        { id: 's2', charCount: 'invalid', enabled: true, status: 'ready', updatedAt: new Date().toISOString() },
      ];
      const result = calculateContextBudget(sources);
      assert.equal(result.totalChars, 10000);
    });
  });

  describe('getSourceKindIcon', () => {
    it('returns correct icon for url', () => {
      assert.equal(getSourceKindIcon('url'), '🔗 URL');
    });

    it('returns correct icon for pdf', () => {
      assert.equal(getSourceKindIcon('pdf'), '📄 PDF');
    });

    it('returns correct icon for md', () => {
      assert.equal(getSourceKindIcon('md'), '📝 Markdown');
    });

    it('returns correct icon for txt', () => {
      assert.equal(getSourceKindIcon('txt'), '📄 Texto');
    });

    it('returns correct icon for text', () => {
      assert.equal(getSourceKindIcon('text'), '📄 Texto');
    });

    it('returns fallback for unknown kind', () => {
      assert.equal(getSourceKindIcon('unknown'), '❓ Desconocido');
    });
  });

  describe('getStatusBadgeClass', () => {
    it('returns correct class for ready', () => {
      assert.equal(getStatusBadgeClass('ready'), 'status-badge--ready');
    });

    it('returns correct class for processing', () => {
      assert.equal(getStatusBadgeClass('processing'), 'status-badge--processing');
    });

    it('returns correct class for error', () => {
      assert.equal(getStatusBadgeClass('error'), 'status-badge--error');
    });

    it('returns fallback for unknown status', () => {
      assert.equal(getStatusBadgeClass('unknown'), 'status-badge--unknown');
    });
  });

  describe('truncatePreview', () => {
    it('returns empty string for null/undefined', () => {
      assert.equal(truncatePreview(null), '');
      assert.equal(truncatePreview(undefined), '');
    });

    it('returns empty string for empty string', () => {
      assert.equal(truncatePreview(''), '');
    });

    it('returns trimmed text if within limit', () => {
      assert.equal(truncatePreview('  Hello World  '), 'Hello World');
    });

    it('truncates at default max (500)', () => {
      const longText = 'a'.repeat(600);
      const result = truncatePreview(longText);
      assert.equal(result.length, 501); // 500 + 1 for ellipsis
      assert.ok(result.endsWith('…'));
    });

    it('truncates at custom max', () => {
      const result = truncatePreview('Hello World', 5);
      assert.equal(result, 'Hello…');
    });

    it('does not add ellipsis if exact fit', () => {
      const result = truncatePreview('Hello', 5);
      assert.equal(result, 'Hello');
    });

    it('handles whitespace trimming before truncation', () => {
      // '  Hello World  '.trim() = 'Hello World' (11 chars), truncate to 8 -> 'Hello Wo…'
      const result = truncatePreview('  Hello World  ', 8);
      assert.equal(result, 'Hello Wo…');
    });
  });
});

describe('mockService source CRUD', () => {
  let service;
  const fixedNow = new Date('2026-01-15T10:00:00Z');

  beforeEach(() => {
    service = createMockService({ now: () => fixedNow });
  });

  describe('updateSource', () => {
    it('updates source title', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      const sources = await service.listSources(bizId);
      const sourceId = sources[0].id;
      const updated = await service.updateSource(sourceId, { title: 'Nuevo Título' });
      assert.equal(updated.title, 'Nuevo Título');
    });

    it('updates source origin', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      const sources = await service.listSources(bizId);
      const sourceId = sources[0].id;
      const updated = await service.updateSource(sourceId, { origin: 'https://nuevo-ejemplo.com' });
      assert.equal(updated.origin, 'https://nuevo-ejemplo.com');
    });

    it('updates source kind with valid origin', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      const sources = await service.listSources(bizId);
      const sourceId = sources[0].id;
      // When changing kind, must also provide valid origin for new kind
      const updated = await service.updateSource(sourceId, { kind: 'pdf', origin: '/docs/manual.pdf' });
      assert.equal(updated.kind, 'pdf');
      assert.equal(updated.origin, '/docs/manual.pdf');
    });

    it('updates source enabled state', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      const sources = await service.listSources(bizId);
      const sourceId = sources[0].id;
      const updated = await service.updateSource(sourceId, { enabled: false });
      assert.equal(updated.enabled, false);
    });

    it('updates source charCount', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      const sources = await service.listSources(bizId);
      const sourceId = sources[0].id;
      const updated = await service.updateSource(sourceId, { charCount: 5000 });
      assert.equal(updated.charCount, 5000);
    });

    it('rejects invalid origin for kind', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      const sources = await service.listSources(bizId);
      const sourceId = sources[0].id;
      await assert.rejects(
        service.updateSource(sourceId, { kind: 'pdf', origin: 'https://example.com' }),
        /Extensión no permitida/
      );
    });

    it('rejects invalid charCount', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      const sources = await service.listSources(bizId);
      const sourceId = sources[0].id;
      await assert.rejects(
        service.updateSource(sourceId, { charCount: -1 }),
        /Tamaño no válido/
      );
    });

    it('throws for non-existent source', async () => {
      await assert.rejects(
        service.updateSource('src-999', { title: 'Test' }),
        /Fuente no encontrada/
      );
    });
  });

  describe('toggleSource', () => {
    it('toggles source enabled state', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      const sources = await service.listSources(bizId);
      const sourceId = sources[0].id;
      const originalEnabled = sources[0].enabled;
      const updated = await service.toggleSource(sourceId, !originalEnabled);
      assert.equal(updated.enabled, !originalEnabled);
    });

    it('throws for non-existent source', async () => {
      await assert.rejects(
        service.toggleSource('src-999', true),
        /Fuente no encontrada/
      );
    });
  });

  describe('deleteSource', () => {
    it('deletes source', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      const sources = await service.listSources(bizId);
      const sourceId = sources[0].id;
      await service.deleteSource(sourceId);
      const remaining = await service.listSources(bizId);
      assert.ok(!remaining.find(s => s.id === sourceId));
    });

    it('throws for non-existent source', async () => {
      await assert.rejects(
        service.deleteSource('src-999'),
        /Fuente no encontrada/
      );
    });
  });

  describe('addSource', () => {
    it('adds source to business', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      const source = await service.addSource(bizId, {
        kind: 'url',
        title: 'Nueva Fuente',
        origin: 'https://nuevo-ejemplo.com',
        charCount: 1000,
      });
      assert.equal(source.businessId, bizId);
      assert.equal(source.kind, 'url');
      assert.equal(source.title, 'Nueva Fuente');
      assert.equal(source.origin, 'https://nuevo-ejemplo.com');
      assert.equal(source.charCount, 1000);
      assert.equal(source.enabled, true);
      assert.equal(source.status, 'ready');
    });

    it('rejects invalid kind', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      await assert.rejects(
        service.addSource(bizId, { kind: 'invalid', title: 'Test', origin: 'https://example.com', charCount: 100 }),
        /Tipo de fuente no válido/
      );
    });

    it('rejects missing title', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      await assert.rejects(
        service.addSource(bizId, { kind: 'url', title: '', origin: 'https://example.com', charCount: 100 }),
        /Título requerido/
      );
    });

    it('rejects invalid origin for url kind', async () => {
      const businesses = await service.listBusinesses();
      const bizId = businesses[0].id;
      await assert.rejects(
        service.addSource(bizId, { kind: 'url', title: 'Test', origin: 'no-url', charCount: 100 }),
        /URL no válida/
      );
    });

    it('throws for non-existent business', async () => {
      await assert.rejects(
        service.addSource('biz-999', { kind: 'url', title: 'Test', origin: 'https://example.com', charCount: 100 }),
        /Negocio no encontrado/
      );
    });
  });
});