# Spec 004: Detalle de conversación (S3)

## Contexto

Pantalla S3 del borrador-ui: vista de conversación con encabezado, interruptor de atención, banner de ventana 24h, hilo de mensajes, compositor y panel lateral de datos del cliente.

## Alcance

**Dentro:**
- Encabezado: nombre, teléfono completo, negocio/número, botón wa.me, menú de acciones
- Interruptor de atención: botón "Tomar conversación" (Bot/Esperando) o "Devolver al bot" (Humano) con confirmación
- Banner de ventana 24h: verde (>6h), ámbar (1-6h), rojo (<1h), gris "Cerrada" con texto + color
- Hilo de mensajes: burbujas por autor (Cliente, Bot, Humano, Sistema), hora, estado entrega, mensajes no-texto
- Eventos de sistema en el hilo: "Tomó la conversación", "Volvió al bot", "Aviso de seguimiento enviado", "Cliente respondió Sí: ventana reactivada", "Volvió al bot por inactividad"
- Temporizadores visibles: "Esperando asesor hace X min", "Sin respuesta hace X min", "Vuelve al bot en X h"
- Compositor: habilitado solo si Humano + ventana abierta; si Bot muestra botón "Tomar"
- Panel lateral (escritorio) / pestaña (móvil): datos cliente (nombre editable, teléfono), negocio, motivo handoff, etiquetas, notas, resumen
- Navegación: hash `#/conversaciones/:id` → muestra detalle; móvil oculta lista, escritorio panel lateral

**Fuera:**
- Envío real de mensajes (simulado via service)
- Autenticación real
- Notificaciones push
- RAG vectorial

## Requisitos funcionales (desde borrador-ui S3)

| RF | Descripción |
|---|---|
| 57 | Encabezado con nombre, teléfono completo, negocio/número, botón wa.me (nueva pestaña), menú acciones |
| 58 | Interruptor: Bot/Esperando → botón primario "Tomar conversación" |
| 59 | Interruptor: Humano → botón "Devolver al bot" con confirmación |
| 60 | Banner ventana 24h: abierta "Puedes responder...", por cerrar ámbar, cerrada "ventana cerró + wa.me" + compositor deshabilitado |
| 61 | Hilo mensajes: burbujas distintas por autor (Cliente, Bot, Humano), hora, estado entrega (enviado/entregado/leído), no-texto "[Imagen]" "[Audio]" |
| 62 | Eventos de sistema en hilo: "Pasó a asesor: devolución", "Héctor tomó la conversación", "Se envió el aviso de seguimiento", "El cliente respondió Sí: ventana reactivada", "Volvió al bot por inactividad" |
| 63 | Temporizadores visibles: "Esperando asesor hace X min", "Sin respuesta hace X min", "Vuelve al bot en X h" |
| 64 | Compositor: habilitado solo si Humano + ventana abierta; si Bot → botón "Tomar" |
| 65 | Panel lateral/pestaña: datos cliente (nombre editable, teléfono), negocio, motivo handoff, etiquetas, notas, bloque "Resumen" |
| 55 | Móvil: lista y conversación pantallas separadas; escritorio: dos paneles |

## Contrato de datos (entrada desde borrador-ui §7)

```js
Conversation: {
  id, businessId, phoneNumberId, customerName?, customerPhone,
  handler: 'bot' | 'waiting_human' | 'human',
  handoffReason?: 'venta' | 'envio' | 'queja' | 'devolucion' | 'medico' | 'otro',
  stage, assignedTo?, lastCustomerMessageAt, windowExpiresAt,
  waitingSince?, lastUnansweredAt?, unreadCount, tags[], notes, summary?
}

Message: {
  id, conversationId, author: 'customer' | 'bot' | 'human' | 'system',
  type: 'text' | 'image' | 'audio' | 'button' | 'system_event',
  body, createdAt, deliveryStatus?
}
```

## Capa de servicio (métodos necesarios)

- `getConversation(id)` → Conversation
- `listMessages(conversationId)` → Message[]
- `setHandler(conversationId, handler)` → { conversation, event }
- `sendMessage(conversationId, text)` → Message
- `updateConversation(id, changes)` → Conversation (para nombre, tags, notes)

## Arquitectura

- **Domain** (`src/domain`): Lógica pura para window status, formatters, validación de mensajes
- **Services** (`src/services/conversations.js`): Re-exporta métodos del mock service
- **Mock** (`src/mock/conversations.js`): Ya tiene `buildMessages` con eventos de sistema
- **UI** (`src/ui/conversationDetail.js`): Componente principal de detalle
- **Styles** (`src/styles/conversationDetail.css`): Estilos del detalle

## Criterios de aceptación (desde borrador-ui §9)

2. **Dado** conversación en "Esperando asesor", **cuando** pulso Tomar, **entonces** pasa a Humano, aparece evento de sistema y se habilita el compositor.
3. **Dado** conversación en Humano, **cuando** pulso Devolver al bot y confirmo, **entonces** pasa a Bot y el compositor se deshabilita.
4. **Dado** conversación con ventana cerrada, **entonces** compositor deshabilitado y banner ofrece botón wa.me.
5. **Dado** conversación con ventana abierta y estado Humano, **cuando** envío mensaje, **entonces** aparece en hilo como burbuja de Humano.
6. **Dado** botón wa.me, **cuando** lo pulso, **entonces** abre `https://wa.me/<telefono>` en pestaña nueva.
9. **Dado** teléfono en lista parcialmente oculto, **entonces** en conversación aparece completo.
10. **Dado** 390px, **entonces** sin scroll horizontal, botones ≥44px.