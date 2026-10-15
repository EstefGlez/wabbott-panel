# Borrador de interfaz: Panel de atención WhatsApp

**Documento fuente, NO es una spec SDD.** Las specs se generan con `/sdd-spec` leyendo las secciones de este documento (ver `encargos.md`). Los nombres de capa de servicio y de carpetas viven en `contexto.md`.
Alcance de esta fase: **solo interfaz con datos simulados**. Sin backend, sin Supabase, sin envío real a WhatsApp.

---

## 1. Contexto y objetivo

El bot de WhatsApp (Node, Render, Supabase, Gemini) ya atiende clientes. Falta una **página web de atención**: un "WhatsApp para gestionar el WhatsApp" más un mini CRM, para que Héctor (dueño de varios negocios) vea las conversaciones del bot, decida quién atiende (bot o humano), responda y organice clientes por negocio.

**Principio de esta fase:** se diseña primero la interfaz. Todo dato que la interfaz necesite se documenta en la sección 7 (contrato de datos). Ese contrato es la entrada para el esquema de base de datos y el backend en una fase posterior.

**Usuario principal:** Héctor. Usa iPhone, es poco técnico y no quiere aprender herramientas nuevas. La interfaz debe ser simple, con pocas pantallas y lenguaje claro en español de México.

## 2. Decisiones ya tomadas (no reabrir)

- Los números de WhatsApp están conectados solo por API: el panel es la única "pantalla de chat" que tendrán.
- Cada conversación tiene un estado de atención: **Bot**, **Esperando asesor** o **Atendido por humano**. El estado de atención es independiente de la etapa de venta.
- Interruptor Bot/Humano con botones **Tomar** y **Devolver al bot**.
- Botón **wa.me** para abrir el chat con el cliente desde el WhatsApp normal de Héctor.
- Ventana de 24 horas de WhatsApp: solo se puede responder desde el panel mientras esté abierta (24 h desde el último mensaje del cliente). Si cierra, se ofrece wa.me.
- Botón de seguimiento de WhatsApp antes de que cierre la ventana: si el cliente toca "Sí", la ventana se reinicia. En la interfaz solo se **muestra** el evento, no se envía.
- Notificaciones **solo por correo** en esta fase. El correo lleva resumen sin datos sensibles y un enlace al panel.
- Sin plantillas de Meta.
- Plazos mostrados: 10 min esperando asesor, 15 min sin respuesta al cliente, devolución automática al bot tras inactividad larga (sugerido: 4 horas, configurable).
- Varios negocios, cada uno con varios números y sus propias fuentes de conocimiento.

## 3. Alcance

**Dentro:** login (maqueta), bandeja de conversaciones, vista de conversación, negocios y números, fuentes de conocimiento por negocio, ajustes de avisos por correo, datos simulados, capa de servicio abstracta.

**Fuera:** envío real de mensajes, autenticación real, base de datos, procesamiento real de archivos y URLs, notificaciones push, RAG vectorial, facturación, roles de usuario avanzados.

## 4. Pantallas

### S1. Inicio de sesión
- Correo y contraseña, botón "Entrar". Maqueta: cualquier credencial entra.
- Mensaje de error de ejemplo.

### S2. Bandeja de conversaciones (pantalla principal)
- **Selector de negocio** en la parte superior: un menú desplegable donde cada negocio tiene su color (franja y etiqueta con inicial, nunca solo color). Al abrirlo muestra los negocios y, dentro de cada uno, sus números. Opción "Todos los negocios".
- **Filtros por estado** con contadores: Todos, Esperando asesor, Atendidos, Bot. "Esperando asesor" resaltado.
- **Lista de conversaciones**, cada fila con:
  - Nombre del cliente (o teléfono parcialmente oculto, ej. `+52 33 ••• 0120`).
  - Negocio y número (franja de color + etiqueta).
  - Último mensaje (una línea) y hora.
  - Insignia de estado de atención.
  - Chip de ventana de 24 h con cuenta regresiva.
  - Punto de mensajes sin leer.
- Orden por defecto: "Esperando asesor" primero, luego por último mensaje.
- Buscador por nombre, teléfono o texto de mensaje.
- Estado vacío con texto claro.
- En móvil: lista y conversación son pantallas separadas; en escritorio, dos paneles.

### S3. Conversación
- **Encabezado:** nombre, teléfono completo, negocio/número, botón **wa.me** (abre `https://wa.me/<telefono>` en pestaña nueva), menú de acciones.
- **Interruptor de atención:**
  - Si es Bot o Esperando asesor: botón primario **Tomar conversación**.
  - Si es Humano: botón **Devolver al bot**, con confirmación breve.
- **Banner de ventana de 24 h:**
  - Abierta: "Puedes responder desde aquí. Quedan 3 h 20 min."
  - Por cerrar (menos de 1 h): aviso en ámbar.
  - Cerrada: "La ventana de WhatsApp cerró. Escribe desde tu WhatsApp con el botón wa.me." Compositor deshabilitado.
- **Hilo de mensajes** con burbujas distintas por autor: Cliente, Bot, Humano. Hora y estado de entrega (enviado, entregado, leído). Mensajes no texto como "[Imagen]" o "[Audio]".
- **Eventos de sistema** en el hilo: "Pasó a asesor: devolución", "Héctor tomó la conversación", "Se envió el aviso de seguimiento", "El cliente respondió Sí: ventana reactivada", "Volvió al bot por inactividad".
- **Temporizadores visibles** cuando aplique: "Esperando asesor hace 4 min", "Sin respuesta hace 12 min", "Vuelve al bot en 3 h 20 min".
- **Compositor:** habilitado solo si el estado es Humano y la ventana está abierta. Si es Bot, muestra el botón Tomar en su lugar.
- **Panel lateral (escritorio) o pestaña (móvil):** datos del cliente (nombre editable, teléfono), negocio, motivo del handoff, etiquetas y notas internas. Un bloque "Resumen" con texto simulado.

### S4. Negocios y números
- Lista de negocios con color, nombre y número de conversaciones abiertas.
- Crear y editar negocio: nombre y color (paleta fija de al menos 8 colores con buen contraste).
- Dentro de cada negocio: lista de números (nombre visible, teléfono, estado conectado/desconectado) y botón "Agregar número" (formulario maqueta).
- Acceso directo a "Fuentes de conocimiento" del negocio.

### S5. Fuentes de conocimiento (por negocio)
- Lista de fuentes con: tipo (icono y etiqueta), título, estado (Lista, Procesando, Error), tamaño en caracteres, última actualización, interruptor de activa/inactiva, acciones (actualizar, eliminar).
- **Agregar fuente**, con pestañas:
  - **Enlace:** campo de URL. Texto de ayuda: "Se convierte a texto plano al agregarlo."
  - **Archivo:** zona para arrastrar o elegir. Aceptar PDF, Markdown (.md) y TXT. Recomendar .md como formato preferido. Aviso: los PDF escaneados (imágenes) no se leen.
  - **Texto pegado:** área de texto con título.
- **Indicador de presupuesto de contexto:** barra con total de caracteres de las fuentes activas contra el límite sugerido de 30,000. En ámbar al pasar el 80%, en rojo al excederlo, con mensaje: "Demasiado texto: el bot puede responder más lento o ignorar partes."
- **Vista previa** del texto extraído de cada fuente (primeros 500 caracteres).
- Estado vacío y estado de error con mensaje.
- (Opcional, prioridad baja) Panel "Probar al bot de este negocio": mini chat simulado.

### S6. Ajustes de avisos
- Correo de destino (campo y botón "Enviar correo de prueba", maqueta).
- Eventos a avisar, cada uno con interruptor: nueva conversación esperando asesor; cliente escribe y nadie responde en 15 min; ventana por cerrar en conversaciones atendidas.
- Horario de avisos opcional (silenciar de 23:00 a 8:00).
- **Vista previa del correo** con contenido de ejemplo: negocio, motivo, tiempo de espera, botón "Abrir panel". **Sin nombre, teléfono, dirección ni mensajes del cliente.**
- Nota informativa: "Los avisos por correo no incluyen datos del cliente por privacidad."

## 5. Reglas de interacción

**Estado de atención**

| Estado | Quién contesta | Acciones disponibles |
|---|---|---|
| Bot | El bot | Tomar |
| Esperando asesor | Nadie todavía (el bot puede dar respuestas generales) | Tomar |
| Atendido por humano | Héctor | Devolver al bot, responder |

**Ventana de 24 h:** `ventana_vence = último_mensaje_del_cliente + 24 h`. Colores del chip, siempre con texto además del color: verde (más de 6 h), ámbar (de 1 a 6 h), rojo (menos de 1 h), gris "Cerrada".

**Tomar:** pasa a Humano, agrega evento de sistema, habilita el compositor (si la ventana está abierta).
**Devolver al bot:** pide confirmación, pasa a Bot, agrega evento de sistema, deshabilita el compositor.
**Enviar mensaje (simulado):** agrega la burbuja de Humano al hilo con estado "enviado" y luego "entregado".

## 6. Requisitos no funcionales

- **Móvil primero**, diseño base 390 px (iPhone). Escritorio con dos paneles.
- Objetivos táctiles mínimos de 44 px.
- **Accesibilidad:** elementos reales (`button`, `a`, `input` con `label`). Contraste de texto 4.5:1. El color de negocio siempre va acompañado de texto o inicial. Navegación por teclado.
- **Privacidad:** teléfono parcialmente oculto en listas y completo solo dentro de la conversación. Ningún secreto ni token en el código del navegador.
- Idioma: español de México. Fechas y horas en hora de Guadalajara.
- Preparada para instalarse en la pantalla de inicio de iPhone (manifiesto de aplicación web), sin implementar notificaciones push todavía.
- Rendimiento: listas con cientos de conversaciones sin lentitud perceptible.

## 7. Contrato de datos (insumo para el backend)

Entidades que la interfaz exige. **Este contrato es lo que se convertirá en tablas.**

- **Business:** `id`, `name`, `color`.
- **PhoneNumber:** `id`, `businessId`, `displayName`, `e164`, `whatsappPhoneNumberId`, `status`.
- **Conversation:** `id`, `businessId`, `phoneNumberId`, `customerName?`, `customerPhone`, `handler` (`bot` | `waiting_human` | `human`), `handoffReason?` (`venta` | `envio` | `queja` | `devolucion` | `medico` | `otro`), `stage`, `assignedTo?`, `lastCustomerMessageAt`, `windowExpiresAt` (derivado), `waitingSince?`, `lastUnansweredAt?`, `unreadCount`, `tags[]`, `notes`, `summary?`.
- **Message:** `id`, `conversationId`, `author` (`customer` | `bot` | `human` | `system`), `type` (`text` | `image` | `audio` | `button` | `system_event`), `body`, `createdAt`, `deliveryStatus?`.
- **KnowledgeSource:** `id`, `businessId`, `kind` (`url` | `pdf` | `md` | `txt` | `text`), `title`, `origin` (URL o nombre de archivo), `status` (`ready` | `processing` | `error`), `charCount`, `enabled`, `updatedAt`, `errorMessage?`, `previewText`.
- **NotificationSettings:** `email`, `events` (los tres interruptores), `quietHours?`.
- **User:** `id`, `email`, `name`.

**Capa de servicio (interfaz abstracta).** Todas las pantallas leen y escriben **solo** a través de esta capa; en esta fase la implementa un módulo con datos simulados, y después se reemplaza por el backend sin tocar las pantallas:

`listBusinesses()`, `listNumbers(businessId)`, `listConversations(filtros)`, `getConversation(id)`, `listMessages(conversationId)`, `setHandler(conversationId, handler)`, `sendMessage(conversationId, texto)`, `updateConversation(id, cambios)`, `listSources(businessId)`, `addSource(businessId, fuente)`, `toggleSource(id, enabled)`, `deleteSource(id)`, `getNotificationSettings()`, `saveNotificationSettings(cambios)`.

## 8. Datos simulados

Usar datos ficticios (nunca teléfonos o nombres reales):
- 3 negocios: **GH Multimarcas** (azul), y dos negocios de ejemplo con colores distintos.
- De 1 a 2 números por negocio.
- Al menos 12 conversaciones que cubran todos los casos: cada estado de atención, ventana abierta, por cerrar, cerrada, sin leer, con mensajes no texto, con eventos de sistema (incluido seguimiento reactivado y vuelta al bot).
- Fuentes de ejemplo por negocio: un enlace, un PDF y un .md; una en estado Procesando y una con Error; el negocio principal cerca del 80% del presupuesto.

## 9. Criterios de aceptación

1. **Dado** que abro la bandeja, **cuando** cambio de negocio en el selector, **entonces** la lista muestra solo conversaciones de ese negocio y el color corresponde.
2. **Dado** una conversación en "Esperando asesor", **cuando** pulso Tomar, **entonces** pasa a Humano, aparece el evento de sistema y se habilita el compositor.
3. **Dado** una conversación en Humano, **cuando** pulso Devolver al bot y confirmo, **entonces** pasa a Bot y el compositor se deshabilita.
4. **Dado** una conversación con la ventana cerrada, **entonces** el compositor está deshabilitado y el banner ofrece el botón wa.me.
5. **Dado** una conversación con la ventana abierta y estado Humano, **cuando** envío un mensaje, **entonces** aparece en el hilo como burbuja de Humano.
6. **Dado** el botón wa.me, **cuando** lo pulso, **entonces** abre `https://wa.me/<telefono>` en una pestaña nueva.
7. **Dado** que agrego una fuente en cualquiera de las tres pestañas, **entonces** aparece en la lista con el estado y el tamaño simulados, y el indicador de presupuesto se actualiza.
8. **Dado** que el total de caracteres supera el 80% del límite, **entonces** el indicador se muestra en ámbar; superando el 100%, en rojo con mensaje.
9. **Dado** un teléfono de cliente en la lista, **entonces** aparece parcialmente oculto, y completo solo en la conversación.
10. **Dado** un teléfono de 390 px de ancho, **entonces** ninguna pantalla requiere desplazamiento horizontal y los botones miden al menos 44 px.
11. **Dado** la vista previa del correo, **entonces** no contiene nombre, teléfono, dirección ni mensajes del cliente.
12. **Dado** que cambio el interruptor de una fuente a inactiva, **entonces** deja de contar en el indicador de presupuesto.

## 10. Plan de tareas (reemplazado por `plan.md`)

Solo referencia. La hoja de ruta vigente está en `plan.md`.

Las tareas 2 a 6 se pueden hacer en paralelo una vez terminadas la 1 y la 7.

1. **Base y diseño:** estructura del proyecto, sistema de diseño (colores, tipografía, espaciados, componentes base, paleta de negocios), navegación y disposición adaptable.
2. **Bandeja (S2):** selector de negocios con colores, filtros, lista, buscador, estados vacíos.
3. **Conversación (S3):** encabezado, interruptor, banner de ventana, hilo, compositor, panel lateral, eventos de sistema.
4. **Negocios y números (S4).**
5. **Fuentes de conocimiento (S5):** lista, agregar fuente (tres pestañas), indicador de presupuesto, vista previa.
6. **Ajustes de avisos y login (S1, S6).**
7. **Capa de servicio y datos simulados** (sección 7 y 8). Se hace junto con la 1.
8. **Revisión final:** accesibilidad, 390 px, criterios de aceptación 1 a 12, y documento con los cambios que el contrato de datos sufrió durante el diseño.

## 11. Preguntas abiertas

- Marco de trabajo del frontend: decidido en `contexto.md`.
- Identidad visual: ¿hay colores o logotipo de Héctor o de GH que usar?
- ¿Habrá más usuarios además de Héctor? (cambiaría roles y asignaciones).
- Límite de caracteres de contexto: 30,000 es el aviso actual del bot; confirmar con pruebas de la IA gratuita.
- Valor final de la devolución automática al bot (sugerido: 4 horas).
