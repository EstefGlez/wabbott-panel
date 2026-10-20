# Plan de la spec 003: Lista de conversaciones (S2)

## Archivos y responsabilidades

### Lógica pura (domain)
- `src/domain/conversations.js` — Lógica de filtrado, orden y búsqueda de conversaciones
  - `filterConversations(conversations, filters): Conversation[]` — Filtra por negocio, estado, búsqueda
  - `sortConversations(conversations): Conversation[]` — Ordena: waiting_human primero, luego por lastCustomerMessageAt descendente
  - `searchConversations(conversations, query): Conversation[]` — Busca por nombre, teléfono, texto de último mensaje (insensible a mayúsculas)

### Servicios (services)
- `src/services/conversations.js` — Capa de servicio para conversaciones (mock)
  - Re-exporta `listConversations`, `getConversation` del mock service existente

### Dibujo (ui)
- `src/ui/conversationList.js` — Componente lista de conversaciones
  - `renderConversationList(state)` — Renderiza la lista completa con selector, filtros, buscador, filas
  - `renderConversationRow(conversation, businessColors)` — Renderiza una fila
  - `renderBusinessSelector(state)` — Selector de negocio con colores y números
  - `renderStatusFilters(state)` — Filtros con contadores
  - `renderSearchInput(state)` — Buscador

### Pantallas (ui)
- `src/ui/screens.js` — Actualiza `renderConversations` para usar el nuevo componente

### Estilos (styles)
- `src/styles/conversationList.css` — Estilos de la lista: filas, selector, filtros, buscador, chips, badges

---

## Funciones puras (src/domain/conversations.js)

```js
/**
 * Filtra conversaciones según filtros activos.
 * @param {Conversation[]} conversations
 * @param {Object} filters — { businessId: string|null, status: string, search: string }
 * @returns {Conversation[]}
 */
export function filterConversations(conversations, filters) { ... }

/**
 * Ordena conversaciones: waiting_human primero, luego por lastCustomerMessageAt descendente.
 * @param {Conversation[]} conversations
 * @returns {Conversation[]}
 */
export function sortConversations(conversations) { ... }

/**
 * Busca conversaciones por nombre, teléfono o último mensaje (case-insensitive).
 * @param {Conversation[]} conversations
 * @param {string} query
 * @returns {Conversation[]}
 */
export function searchConversations(conversations, query) { ... }
```

**Tipos (JSDoc)**:
```js
/** @typedef {{id:string, businessId:string, phoneNumberId:string, customerName:string|undefined, customerPhone:string, handler:'bot'|'waiting_human'|'human', handoffReason:string|undefined, stage:string, assignedTo:string|undefined, lastCustomerMessageAt:string, windowExpiresAt:string, waitingSince:string|undefined, lastUnansweredAt:string|undefined, unreadCount:number, tags:string[], notes:string, summary:string|undefined}} Conversation */
```

---

## Estado (src/ui/app.js - extensión)

```js
const state = {
  currentHash: window.location.hash,
  conversations: [],           // lista completa del servicio
  filteredConversations: [],   // resultado de filter+sort+search
  selectedBusinessId: null,    // null = "Todos los negocios"
  selectedStatus: 'all',       // 'all' | 'waiting_human' | 'human' | 'bot'
  searchQuery: '',             // texto del buscador
};
```

**Flujo de datos**:
1. Carga inicial: `state.conversations = await service.listConversations()`
2. Cambio de filtro/búsqueda → `state.filteredConversations = sortConversations(searchConversations(filterConversations(state.conversations, filters), state.searchQuery))`
3. Render usa `state.filteredConversations`

---

## Interfaz (componentes)

### Selector de negocio (`renderBusinessSelector`)
- `<select id="business-select">` con opción "Todos los negocios" + opciones por negocio
- Cada opción muestra: franja de color (inline) + nombre del negocio
- Al abrir: muestra números anidados (optgroup o sub-opciones)
- `onchange` actualiza `state.selectedBusinessId` y re-filtra

### Filtros de estado (`renderStatusFilters`)
- 4 botones tipo "chip": Todos, Esperando asesor, Atendidos, Bot
- Cada uno con contador: `filterConversations(...).length`
- "Esperando asesor" resaltado (estilo distinto)
- `onclick` actualiza `state.selectedStatus` y re-filtra

### Buscador (`renderSearchInput`)
- `<input type="search" id="conversation-search" placeholder="Buscar nombre, teléfono, mensaje...">`
- `oninput` con debounce (150ms) actualiza `state.searchQuery` y re-filtra

### Lista (`renderConversationList`)
- Contenedor `<section id="conversation-list">`
- Header con selector + filtros + buscador
- `<ul class="conversation-rows">` con filas
- Estado vacío: "No hay conversaciones" (si filteredConversations.length === 0)

### Fila (`renderConversationRow`)
- `<li class="conversation-row">` con `data-conversation-id`
- Contenido (flex, gap, alineado):
  1. Punto rojo si `unreadCount > 0`
  2. Nombre cliente o teléfono enmascarado (`maskPhone` de phone.js)
  3. Negocio/número: `<span class="business-badge" style="--color: var(--biz-color)">Inicial</span> Nombre`
  4. Último mensaje (1 línea, truncado) + hora relativa
  5. Badge estado atención: "Bot" / "Esperando" / "Humano"
  6. Chip ventana 24h: verde/ámbar/rojo/gris con texto + cuenta regresiva
- `onclick` (delegado en app.js) → navega a `#/conversaciones/${id}`

---

## Decisiones con alternativa descartada

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| Lógica pura en `domain/conversations.js` | Lógica en componente UI | Testeable sin DOM; reutilizable |
| Selector nativo `<select>` | Dropdown custom | Accesibilidad nativa; menos código; mobile-friendly |
| Filtros como botones chip | `<select>` multiple | Visibilidad de contadores; UX táctil |
| Debounce 150ms en búsqueda | Sin debounce | Evita re-render excesivo al teclear |
| Teléfono enmascarado en lista | Teléfono completo | Privacidad (constitución §5) |
| Chip ventana con texto + color | Solo color | Accesibilidad: color no es único indicador |

---

## Estrategia de tests

**Archivo**: `tests/conversations.test.js`

**Casos (domain/conversations.js)**:
1. `filterConversations` por businessId filtra correctamente
2. `filterConversations` por status filtra correctamente
3. `filterConversations` con businessId=null no filtra por negocio
4. `filterConversations` con status='all' no filtra por estado
5. `sortConversations` pone waiting_human primero
6. `sortConversations` ordena por lastCustomerMessageAt descendente dentro de mismo handler
7. `searchConversations` encuentra por customerName (case-insensitive)
8. `searchConversations` encuentra por customerPhone (dígitos)
8. `searchConversations` encuentra por último mensaje (requiere messages en conversation o búsqueda en servicio)
9. `searchConversations` vacía devuelve todas
10. Composición filter+sort+search produce resultado esperado

**Cobertura**: 100% de `src/domain/conversations.js`

---

## Tareas (máx. 3 archivos por tarea, verificables individualmente)

| # | Descripción | Archivos | Verificación |
|---|---|---|---|
| 1 | Lógica pura: filter, sort, search + tests | `src/domain/conversations.js`, `tests/conversations.test.js` | `npm test` |
| 2 | Componente lista: filas, selector, filtros, buscador | `src/ui/conversationList.js`, `src/ui/screens.js` | Browser: selector filtra por negocio, chips filtran por estado, buscador filtra, fila muestra datos correctos |
| 3 | Estilos lista + integración en app.js | `src/styles/conversationList.css`, `src/ui/app.js` | Browser 360/390/1280px: sin scroll horizontal, touch targets ≥44px, contraste ≥4.5:1, dos paneles en escritorio |
| 4 | Datos simulados y servicio | `src/mock/conversations.js`, `src/services/conversations.js` | `npm test` (tests de mock/service existentes pasan) |
| 5 | Revisión final y criterios de aceptación | máx. 3 archivos de `src/styles` o `src/ui` | Checklist criterios 1, 9, 10, 16 del borrador-ui; `npm test` |

---

## Qué RF cubre cada parte (referencia borrador-ui S2)

| Parte | Criterios borrador-ui |
|---|---|
| `conversations.js` + tests | Orden por defecto (52), búsqueda (52) |
| `conversationList.js` | Selector negocio (42), filtros con contadores (43), filas (44-50), estado vacío (53) |
| `conversationList.css` | Móvil/escritorio (54), touch targets (114), contraste (115), teléfono enmascarado (116) |
| `mock/conversations.js` | 12+ conversaciones cubriendo todos los casos (142) |
| Integración app.js | Navegación a detalle al click en fila |