# Wabbott Panel: contexto

## Qué es y por qué
Página web de atención para un bot de WhatsApp. El bot ya existe y vive en otro repo (Wabbott).
Sirve para ver las conversaciones del bot, decidir quién atiende (bot o humano), responder y organizar clientes por negocio.
Motivo: los números van conectados solo por API y no tienen app con bandeja. Este panel es esa bandeja.

## Usuarios
Héctor, dueño de varios negocios. Usa iPhone. Poco técnico. Pocas pantallas y textos claros.

## Fase actual
Solo interfaz con datos simulados. Sin backend ni base de datos.
Lo que la interfaz necesita de datos define el contrato (abajo). Después se convierte en tablas.
El detalle de pantallas está en `docs/borrador-ui.md` (documento fuente, no es spec).

## Decisiones tomadas (no reabrir)
- Estados de atención: Bot, Esperando asesor, Atendido por humano. Acciones: Tomar y Devolver al bot.
- Ventana de 24 h de WhatsApp: se responde desde el panel solo mientras esté abierta. Si cierra: botón wa.me.
- Botón de seguimiento de WhatsApp antes del cierre: la interfaz solo muestra el evento.
- Avisos solo por correo, sin datos sensibles del cliente.
- Sin plantillas de Meta.
- Varios negocios. Cada uno con varios números y fuentes de conocimiento (enlace, PDF, .md, TXT, texto pegado).
- Plazos: 10 min esperando asesor. 15 min sin respuesta. Devolución automática al bot tras 4 h de inactividad (configurable).

## Tecnología (fase UI)
React + Vite + TypeScript. Tailwind CSS. react-router. Vitest + Testing Library para lógica pura.
Sin librerías de estado ni de componentes sin aprobación. Sin dependencias nuevas sin preguntar.
Móvil primero (390 px). Manifiesto de aplicación web para la pantalla de inicio del iPhone.

## Arquitectura (fase UI)
- `src/domain`: tipos y lógica pura. Ventana de 24 h, estados de atención, presupuesto de contexto, ocultar teléfono. Sin React.
- `src/services`: interfaz de servicio y su versión con datos simulados. Las pantallas solo hablan con esta capa.
- `src/pages` y `src/components`: pantallas y piezas. Poca lógica.
- `src/mock`: datos ficticios.

## Arquitectura futura (no implementar ahora)
Panel estático → Supabase (login, lectura, tiempo real) y → servidor del bot (enviar mensaje, cambiar atención) → API de WhatsApp.
Un revisor externo llama al servidor cada pocos minutos (plazos, seguimiento de ventana, correos).
Cambiar el mock por el servicio real no debe tocar las pantallas.

## Contrato de datos (resumen)
- Business: id, name, color.
- PhoneNumber: id, businessId, displayName, e164, status.
- Conversation: id, businessId, phoneNumberId, customerName?, customerPhone, handler (bot | waiting_human | human), handoffReason?, lastCustomerMessageAt, unreadCount, tags[], notes, summary?. El vencimiento de la ventana se calcula, no se guarda.
- Message: id, conversationId, author (customer | bot | human | system), type (text | image | audio | button | system_event), body, createdAt, deliveryStatus?.
- KnowledgeSource: id, businessId, kind (url | pdf | md | txt | text), title, origin, status (ready | processing | error), charCount, enabled, updatedAt, previewText.
- NotificationSettings: email, events, quietHours?.

## Convenciones
- Textos de interfaz: español de México. Identificadores de código: inglés.
- Horas en hora de Guadalajara.
- Datos ficticios siempre. Nunca teléfonos ni nombres reales.
- Sin secretos en el código del navegador.

## Supuestos y riesgos
- Repo nuevo `wabbott-panel`, separado del bot.
- El límite de 30,000 caracteres de contexto viene del bot actual. Confirmar después.
- El contrato de datos puede cambiar al revisar la interfaz con Héctor. Se congela al aprobarla.
