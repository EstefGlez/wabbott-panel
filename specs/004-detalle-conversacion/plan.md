# Plan de la spec 004: Detalle de conversación (S3)

## Archivos y responsabilidades

### Lógica pura (domain)
- `src/domain/window.js` — Ya existe: `getWindowStatus`, `getWindowChip`, `getWindowRemainingMs` (usar)
- `src/domain/messages.js` — **NUEVO**: Formateo de mensajes, validación, agrupación por fecha
- `src/domain/attention.js` — Ya existe: `applyTake`, `applyReturnToBot`, `canSend` (usar)

### Servicios (services)
- `src/services/conversations.js` — **NUEVO**: Re-exporta `getConversation`, `listMessages`, `setHandler`, `sendMessage`, `updateConversation` del mock service

### Datos simulados (mock)
- `src/mock/conversations.js` — Ya tiene `buildMessages` con eventos de sistema; verificar cobertura

### Interfaz (ui)
- `src/ui/conversationDetail.js` — **NUEVO**: Componente completo de detalle
  - `renderConversationDetail(state, conversationId)` — Renderiza todo el detalle
  - `renderConversationHeader(conversation, businessColors)` — Encabezado + wa.me
  - `renderAttentionSwitch(conversation, state)` — Interruptor Tomar/Devolver
  - `renderWindowBanner(conversation)` — Banner ventana 24h
  - `renderMessageThread(messages, conversation, state)` — Hilo con burbujas, eventos, temporizadores
  - `renderComposer(conversation, state)` — Compositor o botón Tomar
  - `renderSidePanel(conversation, businessColors)` — Panel lateral datos cliente

### Pantallas (ui)
- `src/ui/screens.js` — Actualizar `renderConversationDetail` para usar el nuevo componente
- `src/ui/app.js` — Manejar hash `#/conversaciones/:id`, cargar conversación y mensajes, delegar eventos

### Estilos (styles)
- `src/styles/conversationDetail.css` — **NUEVO**: Estilos del detalle

---

## Funciones puras nuevas (src/domain/messages.js)

```js
/**
 * Formatea hora de mensaje para hilo (HH:mm).
 * @param {string} isoString
 * @returns {string}
 */
export function formatMessageTime(isoString) { ... }

/**
 * Agrupa mensajes por fecha para separadores de día.
 * @param {Message[]} messages
 * @returns {Map<string, Message[]>}
 */
export function groupMessagesByDate(messages) { ... }

/**
 * Valida texto de mensaje para envío (no vacío, no solo espacios, máx 4096 chars).
 * @param {string} text
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateMessageText(text) { ... }

/**
 * Determina si un mensaje es de sistema (system_event).
 * @param {Message} message
 * @returns {boolean}
 */
export function isSystemMessage(message) { ... }

/**
 * Obtiene clase CSS para burbuja según autor.
 * @param {Message} message
 * @returns {string}
 */
export function getMessageBubbleClass(message) { ... }
```

---

## Estado extendido (src/ui/app.js)

```js
const state = {
  // ... estado existente ...
  currentConversationId: null,    // ID de conversación en detalle
  currentConversation: null,      // Objeto conversación completa
  messages: [],                   // Mensajes de la conversación actual
};
```

**Flujo de datos:**
1. Hash change a `#/conversaciones/:id` → `state.currentConversationId = id`
2. Cargar: `state.currentConversation = await service.getConversation(id)`, `state.messages = await service.listMessages(id)`
3. Render usa `state.currentConversation` y `state.messages`
4. Acciones (Tomar, Devolver, Enviar) → llaman service → actualizan `state.currentConversation` y `state.messages` → re-render

---

## Interfaz (componentes)

### Encabezado (`renderConversationHeader`)
- Nombre cliente (editable inline? No, solo visual en S3; editable en panel lateral)
- Teléfono completo + botón wa.me (`<a href="https://wa.me/...">`)
- Negocio/número con badge de color
- Menú acciones (⋮): editar nombre, ver perfil, etc. (maqueta)

### Interruptor atención (`renderAttentionSwitch`)
- Si `handler === 'bot' || handler === 'waiting_human'`: botón primario "Tomar conversación"
  - `onclick` → `service.takeConversation(id)` → actualiza estado + re-render
- Si `handler === 'human'`: botón "Devolver al bot" + confirmación (dialog nativo `<dialog>`)
  - `onclick` → `service.returnToBot(id)` → actualiza estado + re-render

### Banner ventana 24h (`renderWindowBanner`)
- Usa `getWindowChip` de `window.js` con `lastCustomerMessageAt` y `now`
- Verde: "Puedes responder desde aquí. Quedan X h Y min."
- Ámbar: "La ventana cierra en X h Y min."
- Rojo: "La ventana cierra en X min."
- Cerrada: "La ventana de WhatsApp cerró. Escribe desde tu WhatsApp." + botón wa.me
- Clases: `.window-banner--open`, `--warning`, `--urgent`, `--closed`

### Hilo de mensajes (`renderMessageThread`)
- Contenedor scrollable `<div class="message-thread">`
- Separadores de fecha (hoy, ayer, DD/MM)
- Burbujas:
  - Cliente: alineación derecha, fondo primario claro
  - Bot: alineación izquierda, fondo gris
  - Humano: alineación izquierda, fondo azul primario
  - Sistema: centrado, texto pequeño, gris
- Hora en burbuja (HH:mm)
- Estado entrega: solo Bot/Humano (iconos: enviado ✓, entregado ✓✓, leído ✓✓ azul)
- No-texto: "[Imagen]", "[Audio]" con icono
- Eventos de sistema: texto específico según `body`

### Temporizadores (`renderTimers`)
- Si `waitingSince`: "Esperando asesor hace X min"
- Si `lastUnansweredAt`: "Sin respuesta hace X min"
- Si `windowExpiresAt` y handler=human: "Vuelve al bot en X h Y min" (cuenta regresiva?)
- Posición: sobre el hilo o en banner

### Compositor (`renderComposer`)
- Si `handler !== 'human'` o ventana cerrada: botón grande "Tomar conversación" (llama a take)
- Si `handler === 'human'` y ventana abierta:
  - `<textarea>` auto-resize, placeholder "Escribe un mensaje..."
  - Botón "Enviar" (Enter = enviar, Shift+Enter = nueva línea)
  - `onkeydown` manejo
  - Validación: `validateMessageText` de domain
  - `onclick` Enviar → `service.sendMessage(id, text)` → agrega mensaje optimista → re-render

### Panel lateral (`renderSidePanel`)
- **Datos cliente**: nombre (editable inline con `contenteditable`? No, input + botón guardar via `updateConversation`), teléfono completo
- **Negocio**: badge color + nombre + número
- **Motivo handoff**: si `handoffReason` muestra etiqueta
- **Etiquetas**: chips con `tags[]`, agregar/quitar (maqueta)
- **Notas**: textarea, guardar via `updateConversation`
- **Resumen**: bloque con `summary` simulado
- En móvil: pestaña/accordion; en escritorio: panel fijo al lado

---

## Decisiones con alternativa descartada

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| Lógica mensajes en `domain/messages.js` | En componente UI | Testeable, reutilizable |
| `<dialog>` nativo para confirmar Devolver | Custom modal | Accesibilidad nativa, menos código |
| wa.me como `<a target="_blank">` | `window.open` | Sin bloqueo popup, accesible |
| Separadores de fecha en hilo | Sin separadores | UX estándar chat |
| Compositor condicional (Tomar vs textarea) | Siempre textarea + disabled | UX clara: acción principal visible |
| Panel lateral fijo escritorio / accordion móvil | Siempre panel | Responsive nativo |

---

## Estrategia de tests

**Archivo**: `tests/messages.test.js` (nuevo)

**Casos (domain/messages.js)**:
1. `formatMessageTime` devuelve HH:mm correcto
2. `groupMessagesByDate` agrupa correctamente (hoy, ayer, fecha)
3. `validateMessageText` rechaza vacío, solo espacios, >4096; acepta válido
4. `isSystemMessage` detecta `type === 'system_event'`
5. `getMessageBubbleClass` devuelve clase correcta por autor

**Cobertura**: 100% de `src/domain/messages.js`

---

## Tareas (máx. 3 archivos por tarea, verificables individualmente)

| # | Descripción | Archivos | Verificación |
|---|---|---|---|
| 1 | Lógica pura mensajes: format, group, validate, helpers + tests | `src/domain/messages.js`, `tests/messages.test.js` | `npm test` |
| 2 | Servicio conversaciones + integración app.js (hash, carga, estado) | `src/services/conversations.js`, `src/ui/app.js` | Browser: hash `#/conversaciones/conv-01` carga detalle |
| 3 | Componente detalle: header, interruptor, banner, hilo, temporizadores | `src/ui/conversationDetail.js` (parcial) | Browser: header, interruptor, banner, hilo renderizan |
| 4 | Componente detalle: compositor, panel lateral + styles | `src/ui/conversationDetail.js` (resto), `src/styles/conversationDetail.css` | Browser 360/390/1280px: compositor, panel, responsive |
| 5 | Pantallas + integración final: screens.js, delegación eventos, tests mock | `src/ui/screens.js`, `src/ui/app.js` (final), `tests/*.test.js` | `npm test` + browser checklist criterios 2,3,4,5,6,9,10 |

---

## Qué RF cubre cada parte

| Parte | Criterios borrador-ui |
|---|---|
| `messages.js` + tests | Formato hora (61), validación (64), burbujas (61), eventos (62) |
| `conversationDetail.js` | Header (57), interruptor (58,59), banner (60), hilo (61,62), temporizadores (63), compositor (64), panel (65) |
| `conversationDetail.css` | Móvil/escritorio (55), touch targets (114), contraste (115), teléfono completo (116) |
| `services/conversations.js` | Capa de servicio abstracta (135) |
| Integración app.js | Navegación hash, acciones Tomar/Devolver/Enviar, wa.me (6) |