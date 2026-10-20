# Tareas Spec 004: Detalle de conversación (S3)

> Una tarea = máx. 3 archivos. Verificación = `npm test` + checklist visual en navegador.

---

## Tarea 1: Lógica pura de mensajes + tests

**Archivos:**
- `src/domain/messages.js` (nuevo)
- `tests/messages.test.js` (nuevo)

**Implementar:**
- `formatMessageTime(isoString)` → "HH:mm"
- `groupMessagesByDate(messages)` → Map<dateKey, Message[]>
- `validateMessageText(text)` → { valid, error? }
- `isSystemMessage(message)` → boolean
- `getMessageBubbleClass(message)` → string (clase CSS)

**Tests (node --test):**
- formatMessageTime: varios ISO → HH:mm correcto
- groupMessagesByDate: mensajes mismo día, días distintos, hoy/ayer
- validateMessageText: vacío→error, espacios→error, >4096→error, válido→ok
- isSystemMessage: system_event→true, otros→false
- getMessageBubbleClass: customer/bot/human/system → clases esperadas

**Verificación:** `npm test` (tests nuevos pasan + 232 existentes no rotos)

---

## Tarea 2: Servicio conversaciones + app.js (hash y carga)

**Archivos:**
- `src/services/conversations.js` (nuevo)
- `src/ui/app.js` (modificar)

**Implementar servicio (`conversations.js`):**
```js
export { listConversations, getConversation, listMessages, takeConversation, returnToBot, sendMessage, updateConversation } from '../services/mockService.js';
```

**Modificar `app.js`:**
- Parsear hash `#/conversaciones/:id` → extraer `conversationId`
- En `init()`: escuchar `hashchange`, si match detalle → cargar conversación + mensajes
- Estado extendido: `currentConversationId`, `currentConversation`, `messages`
- Función `loadConversationDetail(id)` → `service.getConversation(id)` + `service.listMessages(id)`
- Delegación eventos: click en "Tomar", "Devolver", "Enviar", wa.me (navegación nativa)
- Re-render automático tras acciones

**Verificación:** Browser: navegar a `#/conversaciones/conv-01` muestra detalle (aunque sea placeholder inicial); `npm test` pasa

---

## Tarea 3: Componente detalle - Header, interruptor, banner, hilo, temporizadores

**Archivos:**
- `src/ui/conversationDetail.js` (nuevo - parte 1)

**Implementar funciones:**
- `renderConversationDetail(state)` → contenedor principal
- `renderConversationHeader(conversation, businessColors)` → nombre, teléfono, wa.me, negocio, menú
- `renderAttentionSwitch(conversation, state)` → botón Tomar / Devolver (con `<dialog>`)
- `renderWindowBanner(conversation)` → usa `getWindowChip` de domain/window.js
- `renderMessageThread(messages, conversation, state)` → separadores fecha, burbujas, hora, estado entrega, eventos sistema
- `renderTimers(conversation)` → waitingSince, lastUnansweredAt, windowExpiresAt (human)

**Detalles hilo:**
- Separadores: "Hoy", "Ayer", "DD/MM/YYYY"
- Burbuja cliente: derecha, azul claro
- Burbuja bot: izquierda, gris
- Burbuja human: izquierda, azul primario
- Burbuja sistema: centrado, gris pequeño
- Hora: HH:mm en cada burbuja
- Estado entrega: iconos (enviado=✓, entregado=✓✓, leído=✓✓ azul) solo bot/human
- No-texto: "[Imagen]" 📷, "[Audio]" 🔊
- Eventos sistema: texto exacto del body

**Verificación:** Browser: header, interruptor, banner, hilo, temporizadores renderizan correctamente con datos mock; `npm test` pasa

---

## Tarea 4: Componente detalle - Compositor, panel lateral + estilos

**Archivos:**
- `src/ui/conversationDetail.js` (completar - parte 2)
- `src/styles/conversationDetail.css` (nuevo)

**Implementar funciones (conversationDetail.js):**
- `renderComposer(conversation, state)` → si !human o ventana cerrada: botón "Tomar conversación"; si human + ventana abierta: textarea + botón Enviar (Enter=enviar, Shift+Enter=nueva línea)
- `renderSidePanel(conversation, businessColors)` → nombre (input+guardar), teléfono, negocio+badge, handoffReason, tags (chips), notes (textarea), summary

**Estilos (`conversationDetail.css`):**
- Layout: móvil = pantalla completa (lista oculta); escritorio = panel lateral fijo (350px?) + hilo flexible
- Header: sticky top, sombra
- Interruptor: botón primario / secondary, dialog centrado
- Banner: colores semánticos (verde/ámbar/rojo/gris) + texto, padding, sticky?
- Hilo: scroll interno, separadores fecha sticky, burbujas max-width 80%, gap
- Burbujas: radio, padding, colores por autor, hora pequeña
- Estado entrega: iconos 14px
- Temporizadores: chips pequeños sobre hilo o en banner
- Compositor: sticky bottom, textarea auto-resize (max 120px), botón enviar
- Panel lateral: secciones con título, inputs, textarea, chips tags
- Responsive: <1024px panel lateral como accordion/pestaña; ≥1024px panel fijo
- Touch targets ≥44px, contraste ≥4.5:1, focus-visible
- `prefers-reduced-motion`, `prefers-contrast: high`

**Verificación:** Browser 360/390/1280px: compositor funciona, panel lateral responsive, sin scroll horizontal, touch targets OK, contraste OK; `npm test` pasa

---

## Tarea 5: Pantallas, integración final, revisión criterios

**Archivos:**
- `src/ui/screens.js` (modificar `renderConversationDetail`)
- `src/ui/app.js` (ajustes finales delegación, estado)
- `tests/*.test.js` (verificar tests mock service existentes)

**Implementar:**
- `screens.js`: `renderConversationDetail(state)` delega a `renderConversationDetail` de conversationDetail.js
- `app.js`: asegurar flujo completo hash → carga → render → acciones → re-render
- Verificar que `mockService` métodos `takeConversation`, `returnToBot`, `sendMessage`, `updateConversation` funcionan y tests pasan

**Checklist criterios de aceptación (borrador-ui §9):**
- [ ] **Criterio 2**: Tomar en "Esperando" → Humano + evento + compositor habilitado
- [ ] **Criterio 3**: Devolver en Humano + confirmar → Bot + compositor deshabilitado
- [ ] **Criterio 4**: Ventana cerrada → compositor deshabilitado + banner con wa.me
- [ ] **Criterio 5**: Humano + ventana abierta + enviar → burbuja Humano en hilo
- [ ] **Criterio 6**: wa.me → abre `https://wa.me/<telefono>` en pestaña nueva
- [ ] **Criterio 9**: Teléfono completo en detalle (no enmascarado)
- [ ] **Criterio 10**: 390px sin scroll horizontal, botones ≥44px

**Verificación:** `npm test` (232+ tests pasan) + browser checklist completo ✅

---

## Notas de implementación

- **Hora actual**: En domain `window.js` ya recibe `now` como parámetro. En UI pasar `new Date()` al llamar `getWindowChip`.
- **Eventos sistema**: `mock/conversations.js` ya genera `body` exactos: "Un asesor tomó la conversación", "La conversación volvió al bot", etc. Usar tal cual.
- **Teléfono wa.me**: Usar `buildWhatsAppLink` de `domain/phone.js` con `customerPhone`.
- **Confirmación Devolver**: `<dialog>` nativo con `<form method="dialog">` + botón "Confirmar" y "Cancelar".
- **Auto-resize textarea**: `textarea.style.height = 'auto'; textarea.style.height = textarea.scrollHeight + 'px';`
- **Optimistic update**: Al enviar mensaje, agregar a `state.messages` inmediatamente con `deliveryStatus: 'sent'` y `author: 'human'`, luego service devuelve confirmación.
- **Accesibilidad**: `aria-live="polite"` en hilo para nuevos mensajes; `aria-label` en botones solo icono; `role="dialog"` en confirmación.