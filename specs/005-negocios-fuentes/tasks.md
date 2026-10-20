# Tarea 1: Lógica pura de Dominio (Negocios y Fuentes) + Tests

## Archivos a crear:
1. `src/domain/business.js`
2. `src/domain/source.js`
3. `tests/business.test.js`
4. `tests/source.test.js`

## Especificación de Tareas:

### A. `src/domain/business.js`
- Definir `BUSINESS_COLOR_PALETTE` con al menos 8 colores hexadecimales de alto contraste (≥4.5:1).
- Implementar funciones puras:
  - `validateBusinessName(name, existingNames)` -> `{ valid: boolean, error?: string }`
  - `validateBusinessColor(color)` -> `boolean`
  - `getBusinessInitial(name)` -> `string` (primera letra en mayúscula)

### B. `src/domain/source.js`
- Definir constantes `CONTEXT_LIMIT = 30000`, `SOURCE_KINDS`, `SOURCE_STATUSES`.
- Implementar funciones puras:
  - `validateSourceInput(kind, data)` -> `{ valid: boolean, error?: string }` (Valida título no vacío y reglas específicas por tipo: URL formato válido, archivo con extensión permitida, texto longitud > 0).
  - `formatCharCount(n)` -> `string` (ej. "9.2k chars" o formato legible).
  - `calculateContextBudget(sources, limit = 30000)` -> `{ totalChars: number, percentage: number, status: 'safe'|'warning'|'danger', message?: string }` (Suma solo fuentes con `enabled: true`).
  - `getSourceKindIcon(kind)` -> `string` (retorna icono/etiqueta descriptiva).
  - `getStatusBadgeClass(status)` -> `string` (retorna variante CSS: ready, processing, error).
  - `truncatePreview(text, max = 500)` -> `string`.

### C. `tests/business.test.js`
- Pruebas unitarias completas para validación de nombres (vacíos, duplicados), colores de paleta e iniciales.

### D. `tests/source.test.js`
- Pruebas unitarias completas para validación de inputs por tipo de fuente, cálculo del presupuesto de contexto (incluyendo umbrales <80% verde, 80-100% ámbar, >100% rojo) y truncado de texto.

## Verificación:
- Ejecutar `node --test tests/business.test.js tests/source.test.js` y confirmar que todas las pruebas pasen en verde.