# Tareas para Spec 001: Reglas del dominio y datos simulados

Reglas para todas las tareas:
- JavaScript con módulos ES. En los imports se escribe `.js`. Sin dependencias.
- Funciones puras. La hora actual entra como parámetro `now` (un `Date`). No usar `new Date()` sin argumentos dentro de `src/domain`.
- Pruebas con `node:test` y `node:assert/strict`, en `tests/*.test.js`.
- "Hecho cuando" siempre incluye `npm test` en verde.
- Máximo 3 archivos por tarea. No cambiar la spec.

1. **Contrato de datos: constantes y tipos**
   - Archivos: `src/domain/contract.js`, `tests/contract.test.js`.
   - Exportar:
     - `HANDLERS = ['bot', 'waiting_human', 'human']`
     - `MESSAGE_AUTHORS = ['customer', 'bot', 'human', 'system']`
     - `MESSAGE_TYPES = ['text', 'image', 'audio', 'button', 'system_event']`
     - `SOURCE_KINDS = ['url', 'pdf', 'md', 'txt', 'text']`
     - `SOURCE_STATUSES = ['ready', 'processing', 'error']`
     - `HANDOFF_REASONS = ['venta', 'envio', 'queja', 'devolucion', 'medico', 'otro']`
     - `CONTEXT_LIMIT = 30000` y `WINDOW_HOURS = 24`
   - Agregar comentarios JSDoc `@typedef` para Business, PhoneNumber, Conversation, Message, KnowledgeSource y NotificationSettings, con los campos de `contexto.md`.
   - Prueba: cada arreglo tiene exactamente esos valores y sin repetidos.
   - RF: RF-5, RF-19.
   - Hecho cuando: `npm test` en verde.

2. **Ventana de 24 horas**
   - Archivos: `src/domain/window.js`, `tests/window.test.js`.
   - Funciones (la entrada puede ser `Date`, texto ISO o `null`):
     - `getWindowExpiration(lastCustomerMessageAt)` devuelve un `Date`, o `null` si la entrada es `null`.
     - `getWindowRemainingMs(lastCustomerMessageAt, now)` devuelve milisegundos; `0` si la entrada es `null`.
     - `getWindowStatus(lastCustomerMessageAt, now)` devuelve `'green'`, `'amber'`, `'red'` o `'closed'`. Verde: más de 6 h. Ámbar: de 1 h a 6 h, ambas incluidas. Rojo: más de 0 y menos de 1 h. Cerrada: 0 o menos.
     - `getWindowChip(lastCustomerMessageAt, now)` devuelve `{ status, label }`. Etiquetas: `"Quedan 3 h 20 min"`, `"Quedan 45 min"` (si falta menos de 1 h) y `"Cerrada"`. Los minutos se redondean hacia abajo.
   - Pruebas: exactamente 6 h restantes es ámbar; 6 h más 1 ms es verde; exactamente 1 h es ámbar; 1 h menos 1 ms es rojo; exactamente 0 es cerrada; negativo es cerrada; entrada `null` es cerrada; mensaje recién enviado da `"Quedan 24 h 0 min"`.
   - RF: RF-1, RF-2, RF-3, RF-4.
   - Hecho cuando: `npm test` en verde con todos esos casos.

3. **Estado de atención**
   - Archivos: `src/domain/attention.js`, `tests/attention.test.js`.
   - Funciones:
     - `getAvailableActions(handler)` devuelve `['take']` para `bot` y `waiting_human`, y `['return_to_bot']` para `human`. Lanza `Error` si el estado no es válido.
     - `canSend(handler, windowStatus)` devuelve `{ allowed, reason }`. Permitido solo si `handler === 'human'` y `windowStatus !== 'closed'`. Motivos: `"Toma la conversación para poder responder."` si no es humano; `"La ventana de WhatsApp cerró. Escribe desde tu WhatsApp con el botón wa.me."` si está cerrada. Si fallan ambas cosas, el motivo es el primero. Cuando está permitido, `reason` es `null`.
     - `applyTake(conversation, now)` devuelve `{ conversation, event }` sin modificar la original. El estado pasa a `human`. El evento es `{ id, conversationId, author: 'system', type: 'system_event', body: 'Un asesor tomó la conversación', createdAt }`. Lanza `Error` si el estado actual no es `bot` ni `waiting_human`.
     - `applyReturnToBot(conversation, now)` igual, con estado `bot` y cuerpo `'La conversación volvió al bot'`. Lanza `Error` si el estado actual no es `human`.
     - `cancelReturnToBot(conversation)` devuelve `{ conversation, event: null }` con la conversación igual.
   - Pruebas: las tres acciones por estado, `canSend` con cada combinación, tomar y devolver (la original no cambia), tomar dos veces lanza error, cancelar no cambia nada.
   - RF: RF-5 a RF-13.
   - Hecho cuando: `npm test` en verde.

4. **Teléfonos y enlace wa.me**
   - Archivos: `src/domain/phone.js`, `tests/phone.test.js`.
   - Funciones:
     - `digitsOnly(phone)` deja solo los dígitos.
     - `isValidWhatsAppNumber(phone)` es verdadero si tiene de 10 a 15 dígitos.
     - `buildWhatsAppLink(phone)` devuelve `https://wa.me/` más los dígitos, o `null` si no es válido.
     - `maskPhone(phone)`: con 10 dígitos o más, devuelve `+CC AA ••• LLLL` (código de país: primeros 2 dígitos; AA: los 2 siguientes; LLLL: últimos 4). Con menos de 10 dígitos, devuelve `•••` seguido de los últimos 4 dígitos (o todos si hay menos de 4).
     - `formatPhone(phone)`: con 12 dígitos devuelve `+52 33 1234 5678` (2, 2, 4 y 4 dígitos). Con otra longitud devuelve `+` seguido de los dígitos.
   - Pruebas: `+52 33 1234 5678` produce el enlace `https://wa.me/523312345678`; produce `+52 33 ••• 5678` al ocultarlo; números de 9, 10, 15 y 16 dígitos en `isValidWhatsAppNumber`; un número de 9 dígitos al ocultarlo; entrada con espacios, guiones y paréntesis.
   - RF: RF-14, RF-15, RF-20, RF-21, RF-22.
   - Hecho cuando: `npm test` en verde.

5. **Presupuesto de contexto**
   - Archivos: `src/domain/contextBudget.js`, `tests/contextBudget.test.js`.
   - Funciones:
     - `isActiveSource(source)` es verdadero si `enabled === true` y `status === 'ready'`.
     - `calculateTotalChars(sources)` suma `charCount` solo de las fuentes activas.
     - `getBudgetLevel(total)` devuelve `'normal'` (hasta 24,000), `'warning'` (de 24,001 a 30,000) o `'danger'` (más de 30,000).
     - `getBudgetMessage(level)` devuelve `"Demasiado texto: el bot puede responder más lento o ignorar partes."` para `'danger'` y `null` para los demás.
   - Pruebas: totales de 24,000, 24,001, 30,000 y 30,001; fuentes inactivas, en Procesando y en Error no suman; lista vacía da 0.
   - RF: RF-16, RF-17, RF-18.
   - Hecho cuando: `npm test` en verde.

6. **Datos simulados: negocios, números y fuentes**
   - Archivos: `src/mock/businesses.js` (exporta `businesses` y `phoneNumbers`), `src/mock/sources.js` (exporta `sources`), `tests/mockSources.test.js`.
   - Negocios: 3, con `id`, `name` y `color` distintos. Ejemplo: `GH Multimarcas` (`#1d4ed8`), `Negocio Demo 2` (`#15803d`), `Negocio Demo 3` (`#c2410c`). De 1 a 2 números por negocio, con teléfonos como `525555550101`.
   - Fuentes: para cada negocio, al menos una de tipo `url`, una `pdf` y una `md`. En todo el conjunto deben aparecer los estados `ready`, `processing` y `error`.
   - GH Multimarcas: fuentes listas y activas con `charCount` 9000 (url), 8500 (pdf) y 9200 (md), total 26,700.
   - Prueba (usa `calculateTotalChars`): cada negocio tiene los tres tipos; todos los tipos y estados son válidos según `contract.js`; GH suma entre 24,001 y 30,000; aparecen `ready`, `processing` y `error`; hay 3 negocios con nombre y color distintos.
   - RF: RF-19, RF-23, RF-24, RF-27.
   - Hecho cuando: `npm test` en verde.

7. **Datos simulados: conversaciones y mensajes con horas relativas**
   - Archivos: `src/mock/conversations.js` (exporta `buildConversations(now)` y `buildMessages(now)`), `tests/mockConversations.test.js`.
   - Toda hora se calcula restando minutos a `now`. Teléfonos de clientes ficticios: `5255555501NN`. Nombres como `Cliente Demo 1`. Al menos una conversación por negocio.
   - 12 conversaciones (se pueden ajustar si se cumple la cobertura de abajo):
     1. bot, verde (hace 1 h). Su hilo incluye eventos: tomó y devolvió.
     2. bot, ámbar (hace 20 h).
     3. bot, cerrada (hace 30 h).
     4. waiting_human, verde, 2 sin leer, motivo `devolucion`.
     5. waiting_human, rojo (hace 23 h 30 min), motivo `envio`.
     6. waiting_human, ámbar (hace 19 h), motivo `queja`.
     7. human, verde (hace 3 h). Su hilo incluye el evento de tomar.
     8. human, ámbar (hace 22 h).
     9. human, rojo (hace 23 h 15 min), 1 sin leer.
     10. human, cerrada (hace 26 h).
     11. bot, verde. Su hilo incluye un mensaje de imagen y uno de audio.
     12. waiting_human, cerrada (hace 40 h), motivo `medico`.
   - Prueba: con dos horas de referencia distintas (`now` y `now` más 3 días), `buildConversations` cubre cada estado de atención y cada nivel de ventana (verde, ámbar, rojo y cerrada); existe al menos una con sin leer mayor a 0; los mensajes incluyen tipo `image` y `audio`; hay eventos de sistema de tomar y de devolver; hay conversaciones de los 3 negocios; todos los teléfonos empiezan con `525555550`.
   - RF: RF-23, RF-25, RF-26.
   - Hecho cuando: `npm test` en verde, con la prueba de dos horas de referencia.

8. **Servicio simulado: lectura**
   - Archivos: `src/services/service.js`, `src/services/mockService.js`, `tests/mockServiceRead.test.js`.
   - `service.js` exporta `SERVICE_METHODS` con estos 15 nombres: `listBusinesses`, `listNumbers`, `listConversations`, `getConversation`, `listMessages`, `listSources`, `getNotificationSettings`, `takeConversation`, `returnToBot`, `sendMessage`, `updateConversation`, `addSource`, `toggleSource`, `deleteSource`, `saveNotificationSettings`.
   - `mockService.js` exporta `createMockService({ now })`, donde `now` es una función que devuelve un `Date` (por defecto, la hora real). Todos los métodos son `async`.
   - Implementar solo los de lectura: `listBusinesses()`, `listNumbers(businessId)`, `listConversations({ businessId, handler, search })`, `getConversation(id)`, `listMessages(conversationId)`, `listSources(businessId)` y `getNotificationSettings()` (con datos ficticios: un correo de ejemplo y tres eventos activos).
   - `listConversations`: filtra por negocio y estado de atención; `search` busca en nombre y en los dígitos del teléfono. Orden: `waiting_human` primero y luego por último mensaje del cliente, del más reciente al más antiguo.
   - Los métodos de escritura deben existir y lanzar `Error('No implementado')` por ahora.
   - Los resultados son copias: modificar lo devuelto no cambia los datos internos.
   - Pruebas: el servicio tiene los 15 métodos; conteos de negocios, conversaciones y fuentes; filtros por negocio, estado y búsqueda; orden; las copias no alteran los datos.
   - RF: soporte de RF-23 a RF-27 (los datos se sirven por el servicio).
   - Hecho cuando: `npm test` en verde.

9. **Servicio simulado: escritura**
   - Archivos: `src/services/mockService.js`, `tests/mockServiceWrite.test.js`.
   - Implementar usando las funciones del dominio:
     - `takeConversation(id)`: usa `applyTake`, guarda el cambio y agrega el evento al hilo.
     - `returnToBot(id)`: usa `applyReturnToBot`, guarda y agrega el evento.
     - `sendMessage(id, text)`: usa `canSend` con el estado real de la ventana (`getWindowStatus` y `now`). Si no está permitido, lanza `Error` con el motivo. Si sí, agrega un mensaje `{ author: 'human', type: 'text', deliveryStatus: 'sent' }`. No cambia la hora del último mensaje del cliente.
     - `updateConversation(id, { customerName, tags, notes })`: solo esos tres campos.
     - `addSource(businessId, { kind, title, origin, charCount })`: valida que `kind` sea válido y agrega la fuente como `ready` y activa.
     - `toggleSource(id, enabled)`, `deleteSource(id)`.
     - `saveNotificationSettings(changes)`: valida que el correo contenga `@`.
   - Pruebas: tomar y devolver cambian el estado y agregan eventos; tomar una conversación ya atendida lanza error; no se puede enviar en estado bot ni con ventana cerrada, con el motivo correcto; enviar con estado humano y ventana abierta agrega el mensaje; agregar, apagar y borrar una fuente cambia el total del presupuesto; guardar ajustes con un correo inválido lanza error.
   - RF: RF-8 a RF-13, RF-16.
   - Hecho cuando: `npm test` en verde.

10. **Verificación de cobertura de la spec**
    - Archivos: `docs/handoff/001-cobertura.md` y las pruebas que falten.
    - Correr `npm test`. Escribir en el archivo una tabla con una fila por cada RF-1 a RF-27 y el archivo de prueba que lo cubre. Si algún RF no tiene prueba, escribirla.
    - Revisión de seguridad: buscar en `src` las palabras `token`, `secret`, `password` e `innerHTML`. No debe haber ninguna (RNF-2).
    - Hecho cuando: la tabla está completa, `npm test` en verde y las búsquedas no encuentran nada.
