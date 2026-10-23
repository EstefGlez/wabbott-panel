# Spec 009: Esqueleto del servidor, seguridad global y esquema de base de datos
Estado: aprobado

## Contexto y objetivo
Inicio del backend del panel. Crear el servidor Express en `server/` con las
defensas globales y aplicar la migración `002_panel_schema.sql`, que extiende
la base actual del bot **sin romperla**. Sin login, sin lectura de
conversaciones y sin webhook nuevo (specs 010 a 013).

## Usuarios
Héctor (uso diario) y el equipo de auditoría Blue Team y Red Team.

## Historias de usuario
- HU-1. Como Héctor, quiero abrir el panel desde una sola dirección segura.
- HU-2. Como auditor, quiero que el servidor rechace configuración incompleta,
  cabeceras débiles y datos mal formados, para tener una base verificable.
- HU-3. Como Héctor, quiero que mis negocios queden aislados entre sí desde el
  diseño de la base de datos, y poder sumar usuarios en el futuro.
- HU-4. Como Héctor, quiero que el bot actual siga funcionando mientras se
  construye el panel.

## Definiciones
- **Mismo origen:** el panel estático y la API salen del mismo dominio.
- **Tenant:** negocio. Todo dato cuelga de un `business_id`.
- **service_role:** llave de Supabase con acceso total. Solo vive en el servidor.
- **Migración aditiva:** agrega tablas, columnas e índices; no borra ni renombra nada.

## Requisitos funcionales

### Estructura y dependencias
- RF-1: EL SISTEMA tendrá el servidor en `server/` con su propio `package.json`.
  El panel (`src/`) conservará cero dependencias.
- RF-2: EL SERVIDOR importará las reglas de `src/domain` sin copiarlas
  (ES Modules).
- RF-3: `npm test` en la raíz seguirá corriendo las pruebas del panel;
  `npm test --prefix server` correrá las del servidor.

### Configuración
- RF-4: AL ARRANCAR, EL SERVIDOR validará todas las variables de entorno con un
  esquema. SI falta o es inválida alguna, ENTONCES no arrancará y dirá cuál.
- RF-5: NINGÚN secreto estará en el repositorio. Habrá `.env.example` sin
  valores reales y `.env` estará en `.gitignore`.

### Entrega del panel
- RF-6: EL SERVIDOR servirá el panel desde el mismo origen, solo desde una lista
  explícita (`index.html`, `src/`). NO servirá `server/`, `docs/`, `specs/`,
  `tests/`, `migrations/`, `.git`, `.env` ni `package.json`.

### Seguridad HTTP
- RF-7: EL SERVIDOR enviará cabeceras de seguridad: CSP estricta
  (`default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;
  frame-ancestors 'none'; base-uri 'none'`), HSTS, `nosniff`, `Referrer-Policy`
  y sin `X-Powered-By`.
- RF-8: EL SERVIDOR no habilitará CORS. Todo es mismo origen.
- RF-9: EL SERVIDOR limitará el cuerpo JSON a 100 KB.
- RF-10: EL SERVIDOR confiará en un solo proxy (`trust proxy = 1`, por Render)
  para que el límite de peticiones use la IP real del cliente.
- RF-11: EL SERVIDOR aplicará límite de peticiones global, con cupos propios
  definidos para autenticación (spec 010).
- RF-12: EL SERVIDOR responderá errores con mensaje genérico y un id de
  petición, sin trazas ni detalles internos.
- RF-13: EL SERVIDOR tendrá `GET /health` sin datos sensibles.

### Registros
- RF-14: EL SERVIDOR registrará en JSON con redacción de las cabeceras
  `authorization` y `cookie`, teléfonos y cuerpos de mensajes.

### Base de datos
- RF-15: LA migración `002_panel_schema.sql` creará `profiles`,
  `business_members`, `phone_numbers`, `knowledge_sources`,
  `notification_settings`, `webhook_events`, `audit_log` y `schema_migrations`,
  y extenderá `businesses`, `conversations` y `messages`.
- RF-16: LOS enums de Postgres coincidirán con `contract.js` (handler, autor,
  tipo de mensaje, tipo y estado de fuente, motivo de handoff).
- RF-17: `phone_numbers.whatsapp_phone_number_id` será único y el token de
  acceso se guardará cifrado (RF-23).
- RF-18: `conversations` será única por `(phone_number_id, customer_phone)`.
  Los teléfonos se guardan solo con dígitos. El vencimiento de la ventana no se
  guarda: se calcula desde `last_customer_message_at`.
- RF-19: `messages` tendrá `wa_message_id` único, `author`, `type`,
  `delivery_status` y, para eventos de sistema, un `event_code` en lugar de
  texto libre.
- RF-20: `knowledge_sources.char_count` será una columna generada desde el texto
  guardado, para que el cliente no pueda declarar un tamaño falso.
- RF-21: TODAS las tablas nuevas tendrán RLS activado, sin políticas, y sin
  permisos para `anon` ni `authenticated`. Una prueba comprobará que la llave
  anónima no lee nada.
- RF-22: `audit_log` será de solo inserción (sin UPDATE, DELETE ni TRUNCATE).
- RF-23: EL token de WhatsApp se cifrará en la aplicación con AES-256-GCM y la
  clave vendrá del entorno. Ninguna respuesta de la API lo incluirá.
- RF-24: TODAS las horas serán `timestamptz` en UTC.
- RF-25: EL bot actual seguirá funcionando sin cambios de código: unos
  disparadores completarán `author`, `last_customer_message_at`,
  `last_message_at`, `unread_count` y `phone_number_id` cuando el bot inserte.
- RF-26: BORRAR un negocio o un número será archivado (`archived_at`); las
  llaves foráneas usan `restrict` para no dejar conversaciones huérfanas.

## Requisitos no funcionales
- RNF-1. Mensajes de error y de sistema en español de México.
- RNF-2. Ningún secreto en el navegador ni en el repositorio.
- RNF-3. `npm audit` sin vulnerabilidades altas ni críticas al cerrar la spec.
- RNF-4. La migración se prueba primero en el proyecto de pruebas de Supabase.

## Enmienda propuesta a la constitución
La regla 2 ("cero dependencias de ejecución") pasa a: *"El panel (`src/`) no
tiene dependencias de ejecución. El servidor (`server/`) puede tenerlas si están
aprobadas por escrito en la spec de la tarea, fijadas con `package-lock.json` y
revisadas con `npm audit`."* Sin esta enmienda aprobada, `/sdd-plan` no debe
arrancar esta spec.

## Casos límite
- Falta una variable de entorno: no arranca.
- Petición a `/.env`, `/server/...`, `/migrations/...` o `/.git/...`: 404.
- Cuerpo JSON mayor a 100 KB: 413 con mensaje genérico.
- Error no controlado: 500 genérico, sin traza.
- Mismo cliente en el mismo número, dos conversaciones: la base lo impide.
- Migración corrida dos veces: no duplica datos ni falla (los rellenos de datos
  se hacen una sola vez, registrados en `schema_migrations`).
- Un negocio con varios números: queda pendiente retirar el índice único
  `(business_id, customer_phone)` de la migración 001 cuando el bot enrute por
  número (spec 012).

## Fuera de alcance
Login y cookies (010), lectura de conversaciones (011), webhook completo y bot
que calla si atiende un humano (012), envío y toma de control (013), fuentes
reales con SSRF y archivos (014), revisor de plazos y correos (015), pruebas de
intrusión (016).

## Criterios de finalización
- Pruebas del servidor en verde: variables, rutas bloqueadas, cabeceras, límite
  de cuerpo, error genérico, RLS con llave anónima.
- La migración corre en el proyecto de pruebas y después en producción.
- Un mensaje de WhatsApp enviado después de la migración sigue funcionando y
  actualiza `last_customer_message_at`.
- `npm test` de la raíz sigue en verde (428 pruebas).

## Decisiones tomadas
- **Despliegue.** El mismo servicio de Render (plan gratuito) por ahora. Un
  keep-alive de GitHub Actions lo mantiene despierto cada 14 minutos en horario
  de demanda (8:00 a 23:00, hora de Guadalajara). El revisor de plazos (spec 015)
  se disparará con ese mismo mecanismo, con un endpoint protegido por secreto, y
  tendrá una precisión de unos 14 minutos. Se acepta para el MVP; se revisa al
  pasar a plan de pago o al fusionar los repos.
- **`phone_numbers`.** Son las líneas de WhatsApp del propio negocio (Ventas,
  Soporte), no los números de los clientes. Los clientes se guardan solos en
  `conversations.customer_phone` cuando escriben, y su negocio se deduce del
  número al que escribieron. `phone_digits` se completa desde la pantalla de
  números del panel.
- **Usuarios.** Al inicio solo Héctor. Después, más usuarios (clientes de Héctor)
  que verán solo sus negocios; la dueña de la plataforma los administra. Los roles
  son por negocio (`owner`, `admin`, `agent`); la asignación exacta se define en
  la spec 010.
- **Respaldos.** Se refieren a la base de datos (Supabase); Render no guarda
  datos. El plan Pro de Supabase, Gemini de pago y Render Starter se contratan
  cuando Héctor apruebe el MVP. Hasta entonces, solo datos de prueba.
- **Migración 002.** Aplicada el 23/10/2026 y verificada: el relleno de datos y los
  disparadores funcionan. Los datos de prueba se limpiaron después.

## Dudas abiertas
Ninguna.
