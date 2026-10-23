# Wabbott Panel: contexto

## Qué es y por qué
Página web de atención para un bot de WhatsApp. El bot ya existe y vive en otro repo (Wabbott).
Sirve para ver las conversaciones del bot, decidir quién atiende (bot o humano), responder y organizar clientes por negocio.
Motivo: los números van conectados solo por API y no tienen app con bandeja. Este panel es esa bandeja.

## Usuarios
Héctor, dueño de varios negocios. Usa iPhone. Poco técnico. Pocas pantallas y textos claros.
Más adelante, otros usuarios (clientes de Héctor) que verán solo sus propios negocios.

## Fase actual
- Fase 1 (interfaz con datos simulados): terminada y en GitHub, pendiente de la revisión final con Héctor.
- Fase 2 (backend, base de datos, login y webhooks): en curso. Ver `plan.md`.
El detalle de pantallas está en `docs/borrador-ui.md` (documento fuente, no es spec).

## Decisiones tomadas (no reabrir)
- Estados de atención: Bot, Esperando asesor, Atendido por humano. Acciones: Tomar y Devolver al bot.
- Ventana de 24 h de WhatsApp: se responde desde el panel solo mientras esté abierta. Si cierra: botón wa.me.
- Botón de seguimiento de WhatsApp antes del cierre: la interfaz solo muestra el evento.
- Avisos solo por correo, sin datos sensibles del cliente.
- Sin plantillas de Meta.
- Varios negocios. Cada uno con varios números y fuentes de conocimiento (enlace, PDF, .md, TXT, texto pegado).
- Plazos: 10 min esperando asesor. 15 min sin respuesta. Devolución automática al bot tras 4 h de inactividad (configurable).
- Navegación: tres destinos: Conversaciones, Negocios (incluye fuentes) y Ajustes.
- El panel habla solo con el servidor Express, que lo sirve desde el mismo origen. No habla con Supabase directo.
- La sesión va en cookies HttpOnly. Los secretos viven solo en el servidor.

## Tecnología
- Panel: HTML + CSS + JavaScript con módulos ES. Sin frameworks, sin TypeScript, sin Tailwind y sin paso de compilación. Cero dependencias. Pruebas con `node --test`. Móvil primero (390 px de referencia).
- Servidor (`server/`): Node.js + Express, módulos ES, dependencias aprobadas por spec.
- Base de datos: Supabase (Postgres). Cambios por migraciones en `migrations/`.
- Para ver el panel solo (fase 1) se necesita un servidor local (Live Server o `npx serve .`).

## Arquitectura
- `src/domain`: lógica pura (ventana de 24 h, estados de atención, presupuesto de contexto, teléfonos). Sin DOM. La hora actual entra como parámetro. La usan el panel y el servidor.
- `src/mock`: datos ficticios.
- `src/services`: lista de métodos del servicio, su versión simulada y, en fase 2, `apiService.js`. La interfaz solo habla con esta capa.
- `src/ui`: pantallas y piezas de interfaz.
- `src/styles`: CSS con variables.
- `server/`: servidor Express (fase 2).
- `migrations/`: SQL numerado de la base compartida con el bot.
- `tests`: pruebas.

Flujo en fase 2:
Panel → servidor Express (mismo origen, cookies HttpOnly) → Supabase y → API de WhatsApp.
Meta → webhook firmado (HMAC) → servidor → Supabase.
Un revisor externo (GitHub Actions) llama al servidor cada pocos minutos (plazos, seguimiento de ventana, correos).
Cambiar el mock por el servicio real no debe tocar las pantallas.

## Reglas para la interfaz
- Un solo objeto de estado. Una función de dibujo por pantalla. Eventos con atributos `data-action`.
- Textos de clientes con `textContent`, nunca como HTML.
- CSS móvil primero, con variables en `src/styles/tokens.css`.

## Contrato de datos (resumen)
- Business: id, name, color.
- PhoneNumber: id, businessId, displayName, e164, status. (En la base, el teléfono se guarda solo con dígitos y el número lleva su `whatsapp_phone_number_id`.)
- Conversation: id, businessId, phoneNumberId, customerName?, customerPhone, handler (bot | waiting_human | human), handoffReason?, lastCustomerMessageAt, unreadCount, tags[], notes, summary?, lastMessagePreview. El vencimiento de la ventana se calcula, no se guarda.
- Message: id, conversationId, author (customer | bot | human | system), type (text | image | audio | button | system_event), body, createdAt, deliveryStatus?. Los eventos de sistema llevan un código y el panel muestra el texto.
- KnowledgeSource: id, businessId, kind (url | pdf | md | txt | text), title, origin, status (ready | processing | error), charCount, enabled, updatedAt, previewText. El servidor calcula `charCount`.
- NotificationSettings: email, events, quietHours?.

## Métodos del servicio
Lectura: listBusinesses, listNumbers, listConversations, getConversation, listMessages, listSources, getNotificationSettings.
Escritura: takeConversation, returnToBot, sendMessage, updateConversation, addSource, toggleSource, deleteSource, saveNotificationSettings.
Añadidos durante la fase 1 (a confirmar al congelar el contrato): updateBusiness, deleteBusiness, addNumber, updateNumber, deleteNumber, updateSource.
Propuestos para la fase 2: createBusiness, login, logout, getMe.

## Convenciones
- Textos de interfaz: español de México. Identificadores de código: inglés.
- Horas en hora de Guadalajara en pantalla. En la base de datos, todo en UTC.
- Datos ficticios siempre en el repositorio. Nunca teléfonos ni nombres reales.
- Sin secretos en el código del navegador ni en el repositorio.

## Supuestos y riesgos
- Repo `wabbott-panel`, separado del bot. Se fusionarán más adelante.
- El límite de 30,000 caracteres de contexto viene del bot actual. Confirmar después.
- El contrato de datos puede cambiar al revisar la interfaz con Héctor. Se congela al aprobarla.
- Los planes gratuitos de Render, Supabase y las IAs son para pruebas. Antes de clientes reales hay que pasar a planes de pago.
