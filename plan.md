# Plan: Wabbott Panel (hoja de ruta)

Cada spec: `/sdd-spec` → aprobar → `/sdd-plan` → aprobar → `/sdd-tasks` → aprobar → `/sdd-implement`.
Máx. 10 tareas por spec. Si salen más, dividir.
Última actualización: 23/10/2026.

## Fase 1: interfaz con datos simulados
- [x] 0. Chore: cambiar al stack HTML/CSS/JS, nueva constitución y AGENTS.md. Rama `chore/stack-vanilla`.
- [x] 1. Spec 001: reglas del dominio y datos simulados (RF-1 a RF-27).
- [x] 2. Spec 002: estructura base, diseño adaptable y navegación.
- [x] 3. Spec 003: bandeja de conversaciones.
- [x] 4. Spec 004: conversación.
- [x] 5. Spec 005: negocios, números y fuentes de conocimiento (incluye lo que se planeó como spec 006).
- [x] 6. (Spec 006 fusionada en la 005; el número queda sin usar.)
- [x] 7. Spec 007: inicio de sesión y ajustes de avisos.
- [ ] 8. Revisión de la interfaz completa con Héctor y aprobación.
- [ ] 9. Congelar el contrato de datos y anotar los cambios en `contexto.md`.
      El servicio ya tiene más métodos que los 15 originales (ver `contexto.md`).

## Fase 2: backend (en paralelo a la revisión con Héctor)
Los números de spec son identificadores, no un orden estricto. La 008 vive en el repo del bot (Wabbott).

- [ ] Spec 008: endurecimiento del bot (repo Wabbott). Firma del webhook, enrutamiento por número,
      duplicados y registros sin datos de clientes. Migración `001`.
- [ ] Spec 009: servidor Express (`server/`), seguridad global y esquema de base de datos.
      Migración `002` ya aplicada en Supabase el 23/10/2026. Pendiente: enmienda a la constitución y el servidor.
- [ ] Spec 010: inicio de sesión real (cookies HttpOnly, CSRF, límite de intentos) y acceso por negocio.
      Incluye `getMe` y el manejo de sesión vencida en `app.js`.
- [ ] Spec 011: lectura de conversaciones y mensajes con control por negocio. Nace `apiService.js` en lugar del mock
      y el refresco periódico de la bandeja.
- [ ] Spec 012: webhook completo (mensajes, estados de entrega, medios). El bot calla cuando atiende un humano.
- [ ] Spec 013: envío de mensajes y toma de control. La ventana de 24 h se valida en el servidor.
- [ ] Spec 014: fuentes de conocimiento reales (enlace, PDF, .md, TXT, texto), con protección contra SSRF.
      El bot pasa a leer `knowledge_sources`.
- [ ] Spec 015: revisor externo de plazos (10 min, 15 min, 4 h), seguimiento de ventana y correos de aviso.
- [ ] Spec 017: endurecimiento del frontend. Quitar `innerHTML` de login y ajustes, arreglar `escapeHtml`,
      no recortar la contraseña, separar negocio y número en el filtro, validar URL solo `https`,
      zona horaria de Guadalajara, `now` inyectado y errores de red con aviso. Hacerla antes de la 016.
- [ ] Spec 016: pruebas de seguridad automatizadas y ejercicios Blue Team y Red Team (en el proyecto de pruebas).

## Decisiones de la Fase 2
- El panel habla solo con el servidor Express, que lo sirve desde el mismo origen. No habla con Supabase directo.
- La sesión va en cookies HttpOnly. Los secretos viven solo en el servidor.
- Los cambios de base de datos van en `migrations/`, numerados, y se prueban primero en el proyecto de pruebas.
- Se trabaja con planes gratuitos hasta que Héctor apruebe el MVP.

## Pendientes de operación (no son specs)
- [x] Agregar `META_APP_SECRET` en Render.
- [x] Aplicar la migración `002` y limpiar datos de prueba.
- [x] Aplicar la migración `001` y verificar sus cuatro índices.
- [ ] Desplegar la spec 008 y **después** correr `truncate table api_logs;` (una sola vez).
- [ ] Crear el proyecto de Supabase de pruebas para el Red Team.
- [ ] Quitar de Render las variables sin uso: `BUSINESS_CONTEXT_DOC_URL` y `PUBLIC_BASE_URL`.
- [ ] Token permanente de System User de Meta, y migrar del número provisional al número propio.
- [ ] Tras el visto bueno de Héctor: Supabase Pro (respaldos), Gemini de pago y Render Starter.
