# Cobertura de la Spec 001: RF-1 a RF-27

| RF | Qué cubre | Archivo de prueba |
|----|-----------|-------------------|
| RF-1 | Calcular vencimiento de ventana: último mensaje del cliente + 24h | `tests/window.test.js` (getWindowExpiration) |
| RF-2 | Nivel de ventana: verde (>6h), ámbar (1-6h), rojo (<1h) | `tests/window.test.js` (getWindowStatus) |
| RF-3 | Ventana cerrada cuando tiempo restante ≤ 0 | `tests/window.test.js` (getWindowStatus - closed) |
| RF-4 | Sin mensajes del cliente → ventana cerrada | `tests/window.test.js` (getWindowStatus con null) |
| RF-5 | Tres estados de atención: bot, waiting_human, human | `tests/attention.test.js` (getAvailableActions, HANDLERS en contract.test.js) |
| RF-6 | Estado bot o waiting_human → solo acción "tomar" | `tests/attention.test.js` (getAvailableActions) |
| RF-7 | Estado human → solo acción "devolver al bot" | `tests/attention.test.js` (getAvailableActions) |
| RF-8 | Estado human + ventana abierta → permite enviar | `tests/attention.test.js` (canSend human + green/amber/red) |
| RF-9 | Estado no human o ventana cerrada → no permite, indica motivo | `tests/attention.test.js` (canSend bot/waiting_human + closed) |
| RF-10 | Tomar conversación → estado human + evento sistema | `tests/attention.test.js` (applyTake); `tests/mockServiceWrite.test.js` (takeConversation) |
| RF-11 | Devolver al bot → pide confirmación | Se cubre en la spec 004 (interfaz) |
| RF-12 | Confirmar devolución → estado bot + evento sistema | `tests/attention.test.js` (applyReturnToBot); `tests/mockServiceWrite.test.js` (returnToBot) |
| RF-13 | Cancelar devolución → sin cambios ni eventos | `tests/attention.test.js` (cancelReturnToBot) |
| RF-14 | Enlace wa.me: https://wa.me/ + dígitos internacionales | `tests/phone.test.js` (buildWhatsAppLink) |
| RF-15 | Teléfono <10 o >15 dígitos → sin enlace wa.me | `tests/phone.test.js` (buildWhatsAppLink con 9 y 16 dígitos) |
| RF-16 | Presupuesto = suma charCount de fuentes activas (enabled + ready) | `tests/contextBudget.test.js` (calculateTotalChars, isActiveSource) |
| RF-17 | Total 24,001–30,000 → nivel warning | `tests/contextBudget.test.js` (getBudgetLevel 24001, 30000) |
| RF-18 | Total >30,000 → nivel danger + mensaje | `tests/contextBudget.test.js` (getBudgetLevel 30001, getBudgetMessage danger) |
| RF-19 | 5 tipos de fuente: url, pdf, md, txt, text | `tests/contract.test.js` (SOURCE_KINDS); `tests/mockSources.test.js` (cada negocio tiene url, pdf, md) |
| RF-20 | Teléfono en listas: oculta dígitos medios (+CC AA ••• LLLL) | `tests/phone.test.js` (maskPhone) |
| RF-21 | Teléfono <10 dígitos → solo últimos 4 (•••xxxx) | `tests/phone.test.js` (maskPhone con 9, 8, 3 dígitos) |
| RF-22 | Teléfono en vista conversación → completo con formato legible | `tests/phone.test.js` (formatPhone) |
| RF-23 | Solo datos ficticios, ningún nombre/teléfono real | `tests/mockSources.test.js` (negocios nombres/colores); `tests/mockConversations.test.js` (teléfonos 525555550NN) |
| RF-24 | ≥3 negocios con nombre y color distintos | `tests/mockSources.test.js` (3 negocios, nombres y colores distintos) |
| RF-25 | ≥12 conversaciones: 3 handlers, 4 niveles ventana, unread>0, image/audio, eventos take/return, 3 negocios | `tests/mockConversations.test.js` (dos referencias now, cobertura completa) |
| RF-26 | Horas relativas al now (se mantienen al abrir en cualquier momento) | `tests/mockConversations.test.js` (buildConversations con now y now+3días) |
| RF-27 | Fuentes por negocio: ≥1 url, 1 pdf, 1 md; estados ready/processing/error; biz-gh 24001–30000 | `tests/mockSources.test.js` (tipos, estados, presupuesto biz-gh) |