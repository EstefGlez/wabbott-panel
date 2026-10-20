# Spec 005: Negocios y Fuentes de Conocimiento (S4, S5)

> **Versión:** 1.0
> **Fecha:** 2026-10-19
> **Basado en:** `docs/borrador-ui.md` secciones S4 y S5, `docs/constitution.md`

---

## 1. Resumen

Esta spec cubre dos pantallas del panel de atención WhatsApp:

- **S4. Negocios y números**: Gestión de negocios (crear/editar nombre y color) y sus números de WhatsApp (listar, agregar, estado de conexión).
- **S5. Fuentes de conocimiento**: Por negocio, lista de fuentes con tipo, título, estado, tamaño, última actualización, interruptor activo/inactivo, acciones (actualizar, eliminar). Agregar fuente en tres pestañas: Enlace, Archivo, Texto pegado. Indicador de presupuesto de contexto (límite 30,000 caracteres). Vista previa de texto extraído.

**Alcance:** Solo interfaz con datos simulados. Sin backend real, sin procesamiento real de archivos/URLs, sin RAG vectorial.

---

## 2. Contrato de datos (ref. `src/domain/contract.js`)

### Business
```typescript
interface Business {
  id: string;
  name: string;
  color: string; // hex, ej. '#1d4ed8'
}
```

### PhoneNumber
```typescript
interface PhoneNumber {
  id: string;
  businessId: string;
  displayName: string; // ej. "Ventas"
  e164: string;        // ej. "+525555550101"
  status: 'connected' | 'disconnected';
}
```

### KnowledgeSource
```typescript
interface KnowledgeSource {
  id: string;
  businessId: string;
  kind: 'url' | 'pdf' | 'md' | 'txt' | 'text';
  title: string;
  origin: string;              // URL o nombre de archivo
  status: 'ready' | 'processing' | 'error';
  charCount: number;           // caracteres
  enabled: boolean;            // interruptor activo/inactivo
  updatedAt: Date | string;
  errorMessage?: string;       // si status === 'error'
  previewText: string;         // primeros ~500 chars
}
```

### Constantes
- `CONTEXT_LIMIT = 30000` (límite sugerido de caracteres para fuentes activas)
- `SOURCE_KINDS = ['url', 'pdf', 'md', 'txt', 'text']`
- `SOURCE_STATUSES = ['ready', 'processing', 'error']`
- Paleta de colores de negocio: mínimo 8 colores con contraste ≥4.5:1 sobre blanco

---

## 3. Capa de servicio (ref. `src/services/mockService.js`)

Métodos existentes relevantes:

```js
// Negocios y números
listBusinesses() → Business[]
listNumbers(businessId) → PhoneNumber[]

// Fuentes de conocimiento
listSources(businessId) → KnowledgeSource[]
addSource(businessId, { kind, title, origin, charCount }) → KnowledgeSource
toggleSource(id, enabled) → KnowledgeSource
deleteSource(id) → void
```

Nuevos métodos a implementar en `mockService.js`:
- `updateBusiness(id, changes: { name?, color? }) → Business`
- `deleteBusiness(id) → void` (validar que no tenga conversaciones/ números/ fuentes)
- `addNumber(businessId, { displayName, e164 }) → PhoneNumber`
- `updateNumber(id, changes: { displayName?, status? }) → PhoneNumber`
- `deleteNumber(id) → void`
- `updateSource(id, changes: { title?, enabled?, charCount?, status?, previewText? }) → KnowledgeSource`

---

## 4. Pantallas y componentes

### S4. Negocios y números (`/negocios`)

**Vista principal (lista de negocios):**
- Tarjeta por negocio: franja de color + inicial, nombre, contador de conversaciones abiertas (mock: longitud de `listConversations({businessId})` con handler ≠ 'bot').
- Botón "Crear negocio" → abre modal/formulario.
- Click en tarjeta → entra al detalle del negocio (números + acceso a fuentes).

**Detalle de negocio:**
- Encabezado: nombre editable (input + botón guardar), color (paleta fija), contador de conversaciones.
- Sección "Números de WhatsApp": lista de números con nombre visible, teléfono (formato legible), badge estado (conectado/desconectado).
- Botón "Agregar número" → formulario maqueta (nombre visible, teléfono E.164).
- Botón/Enlace "Fuentes de conocimiento" → navega a `/negocios/:businessId/fuentes`.

**Formularios (modales):**
- Crear/Editar negocio: nombre (requerido), selector de color (paleta 8+ colores, muestra inicial en círculo).
- Agregar número: nombre visible (requerido), teléfono E.164 (validación básica de dígitos).

### S5. Fuentes de conocimiento (`/negocios/:businessId/fuentes`)

**Lista de fuentes:**
- Tabla/lista con columnas: Tipo (icono + etiqueta), Título, Estado (badge: Lista/Procesando/Error), Tamaño (formato "9.2k chars"), Última actualización (fecha relativa), Activa (toggle switch), Acciones (Actualizar, Eliminar).
- Badge de estado: verde (Lista), ámbar (Procesando), rojo (Error con tooltip `errorMessage`).
- Switch activo/inactivo: al cambiar, llama `toggleSource` y recalcula indicador de presupuesto.
- Botón "Agregar fuente" → modal con 3 pestañas.

**Indicador de presupuesto de contexto:**
- Barra de progreso horizontal: total `charCount` de fuentes `enabled: true` / `CONTEXT_LIMIT` (30,000).
- Colores: verde (<80%), ámbar (80-100%), rojo (>100%).
- Texto: "X / 30,000 caracteres". Si >100%: mensaje "Demasiado texto: el bot puede responder más lento o ignorar partes."

**Modal "Agregar fuente" (3 pestañas):**
1. **Enlace**: Input URL (requerido), texto de ayuda "Se convierte a texto plano al agregarlo." Simula `status: 'processing'` → `setTimeout` a 'ready' con `charCount` aleatorio 1000-15000.
2. **Archivo**: Dropzone + input file. Acepta `.pdf`, `.md`, `.txt`. Aviso: "PDFs escaneados (imágenes) no se leen." Simula procesamiento igual que enlace.
3. **Texto pegado**: Textarea + input Título (requerido). `charCount = texto.length`. `status: 'ready'` inmediato.

**Vista previa de fuente:**
- Click en fila o botón "Ver" → panel lateral/modal con `previewText` (primeros 500 chars), título, tipo, origen, tamaño, estado.

**Estados vacíos y error:**
- Sin fuentes: ilustración + texto "Este negocio no tiene fuentes de conocimiento. Agrega una para empezar."
- Fuente en error: badge rojo + tooltip con `errorMessage`.

---

## 5. Navegación y rutas (hash-based)

| Pantalla | Hash | Parámetros |
|----------|------|------------|
| Lista de negocios | `#/negocios` | — |
| Detalle de negocio (números) | `#/negocios/:businessId` | `businessId` |
| Fuentes de conocimiento | `#/negocios/:businessId/fuentes` | `businessId` |

En `src/domain/navigation.js` extender `parseHash` para reconocer estas rutas.

---

## 6. Reglas de interacción

### Negocios
- Crear: valida nombre no vacío y único; color de paleta fija.
- Editar nombre: input inline o modal, valida no vacío y único.
- Eliminar: solo si no tiene números, conversaciones ni fuentes asociadas (validar en servicio). Confirmación con `<dialog>`.

### Números
- Agregar: valida `displayName` no vacío, `e164` solo dígitos y `+`.
- Editar: nombre visible, estado (connected/disconnected).
- Eliminar: confirmación.

### Fuentes
- Agregar (cualquier pestaña): valida título no vacío. Para URL: valida formato URL. Para archivo: valida extensión. Para texto: valida longitud > 0.
- Simular procesamiento: al agregar URL/archivo, crea fuente con `status: 'processing'`, `charCount: 0`, y tras 1-2s `setTimeout` actualiza a `ready` con `charCount` simulado y `previewText` truncado.
- Toggle activo/inactivo: llama `toggleSource(id, enabled)` → recalcula indicador.
- Eliminar: confirmación.
- Indicador de presupuesto: se recalcula en tiempo real al cambiar `enabled` o agregar/eliminar fuentes.

---

## 7. Accesibilidad y responsive

- **Móvil primero (390px)**: formularios en modal a pantalla completa, listas apiladas, botones ≥44px.
- **Escritorio (≥1024px)**: layout de dos columnas o paneles laterales según necesidad.
- **Contraste**: 4.5:1 mínimo. Colores de negocio siempre con texto/inicial (nunca solo color).
- **Teclado**: foco visible, navegación completa sin ratón.
- **ARIA**: `aria-label` en iconos/botones sin texto, `role="dialog"` en modales, `aria-live` en indicador de presupuesto.
- **Reducir movimiento**: `prefers-reduced-motion` desactiva animaciones.
- **Alto contraste**: `prefers-contrast: high` bordes con `currentColor`.

---

## 8. Criterios de aceptación (ref. borrador-ui §9)

| # | Criterio |
|---|----------|
| 7 | Agregar fuente en cualquier pestaña → aparece en lista con estado/tamaño simulados, indicador actualizado. |
| 8 | Total caracteres >80% límite → indicador ámbar; >100% → rojo con mensaje. |
| 12 | Cambiar interruptor de fuente a inactiva → deja de contar en indicador. |
| 10 | 390px sin scroll horizontal, botones ≥44px. |
| — | Crear/editar/eliminar negocio y números funciona y persiste en mock. |
| — | Navegación hash entre `/negocios`, `/negocios/:id`, `/negocios/:id/fuentes` funciona. |

---

## 9. Archivos a crear/modificar (resumen)

### Nuevos (domain)
- `src/domain/business.js` — lógica pura: validaciones, formateo, paleta colores.
- `src/domain/source.js` — lógica pura: validaciones, formateo tamaño, presupuesto.

### Nuevos (services)
- Extender `src/services/mockService.js` con métodos de escritura para negocios, números, fuentes.

### Nuevos (ui)
- `src/ui/businessList.js` — lista de negocios (S4 principal).
- `src/ui/businessDetail.js` — detalle de negocio + números (S4).
- `src/ui/sourceList.js` — lista de fuentes + indicador presupuesto (S5).
- `src/ui/sourceModal.js` — modal agregar/editar fuente (3 pestañas).
- `src/ui/businessModal.js` — modal crear/editar negocio.
- `src/ui/numberModal.js` — modal agregar/editar número.

### Modificar
- `src/domain/navigation.js` — nuevas rutas.
- `src/ui/screens.js` — renderizado pantallas S4/S5.
- `src/ui/app.js` — delegación eventos, carga de datos.
- `src/styles/business.css` — estilos S4.
- `src/styles/source.css` — estilos S5.
- `index.html` — vincular nuevos CSS.

### Tests
- `tests/business.test.js`
- `tests/source.test.js`
- `tests/navigation.test.js` (extender)

---

## 10. Fuera de alcance (esta spec)

- Procesamiento real de URLs/archivos/texto (RAG, embeddings).
- Autenticación real.
- Notificaciones push.
- Panel "Probar al bot" (opcional prioridad baja en borrador).
- Roles de usuario avanzados.