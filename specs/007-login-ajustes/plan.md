# Plan de la spec 007: Login y Ajustes (S1, S6)

## Archivos y responsabilidades

### Lógica pura (domain)
- `src/domain/settings.js` — Lógica pura para ajustes
  - `validateEmail(email): { valid: boolean, error?: string }` — Validación básica de email
  - `formatTimeHHMM(date): string` — Formatea Date a HH:MM (ej. '23:00')
  - `parseTimeHHMM(str): Date|null` — Parsea HH:MM a Date (hoy), null si inválido
  - `mergeSettings(current, changes): NotificationSettings` — Merge inmutable de settings
  - `getEventLabel(eventKey): string` — Etiqueta legible para cada evento

### Servicios (services)
- `src/services/settings.js` — Capa de servicio para ajustes (re-exporta mockService)
  - `getSettings() → NotificationSettings`
  - `saveSettings(changes) → NotificationSettings`

### Dibujo (ui)
- `src/ui/login.js` — Pantalla login (S1)
  - `renderLogin(state)` — Renderiza formulario login
  - `bindLoginEvents(onLogin)` — Vincula submit y navegación
- `src/ui/settings.js` — Pantalla ajustes (S6)
  - `renderSettings(settings)` — Renderiza pantalla completa
  - `renderEmailSection(settings, onChange)` — Sección correo + botón prueba
  - `renderEventsSection(settings, onChange)` — Tres toggles de eventos
  - `renderQuietHoursSection(settings, onChange)` — Checkbox + inputs time
  - `renderPreviewSection()` — Vista previa estática del correo
- `src/ui/toast.js` — Componente toast reutilizable
  - `showToast(message, type)` — Muestra toast (type: 'info' | 'success' | 'error')
  - Auto-dismiss a 3s, accessible (aria-live)

### Pantallas (ui)
- `src/ui/screens.js` — Actualiza `renderLogin` y `renderSettings` para usar nuevos componentes

### Estilos (styles)
- `src/styles/login.css` — Estilos login: formulario centrado, inputs, botón, error, responsive
- `src/styles/settings.css` — Estilos ajustes: secciones, toggles, inputs time, vista previa, responsive
- `src/styles/toast.css` — Estilos toast: posición fixed, animación slide, tipos

---

## Funciones puras (src/domain/settings.js)

```js
/**
 * Valida formato básico de email.
 * @param {string} email
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateEmail(email) { ... }

/**
 * Formatea una hora a string HH:MM (24h).
 * @param {Date} date
 * @returns {string}
 */
export function formatTimeHHMM(date) { ... }

/**
 * Parsea string HH:MM a Date (hoy a esa hora).
 * @param {string} str
 * @returns {Date|null}
 */
export function parseTimeHHMM(str) { ... }

/**
 * Merge inmutable de settings actuales con cambios.
 * @param {NotificationSettings} current
 * @param {Partial<NotificationSettings>} changes
 * @returns {NotificationSettings}
 */
export function mergeSettings(current, changes) { ... }

/**
 * Etiqueta legible para clave de evento.
 * @param {string} eventKey — 'waiting_human' | 'unanswered_15min' | 'window_closing'
 * @returns {string}
 */
export function getEventLabel(eventKey) { ... }
```

**Tipos (JSDoc)**:
```js
/** @typedef {{email:string, events:string[], quietHours?:{enabled:boolean, from:string, to:string}}} NotificationSettings */
```

---

## Estado (src/ui/app.js - extensión)

```js
const state = {
  currentHash: window.location.hash,
  isLoggedIn: false,           // maqueta: true tras login exitoso
  notificationSettings: null,  // cargado de service
  toast: null,                 // { message, type } | null
};
```

**Flujo de datos:**
1. Carga inicial: verifica hash → si no hay hash/login → render login
2. Login submit → `state.isLoggedIn = true`, navega a `#/conversaciones`
3. Navegación a `#/ajustes` → `state.notificationSettings = await service.getSettings()` → render
4. Cambio en ajustes → `state.notificationSettings = await service.saveSettings(changes)` → re-render + toast si aplica
5. Toast: `state.toast = { message, type }` → render → `setTimeout` limpia toast

---

## Interfaz (componentes)

### Login (`renderLogin`)
- `<form id="login-form">` con:
  - `<label for="login-email">Correo</label>` + `<input type="email" id="login-email" required autocomplete="email">`
  - `<label for="login-password">Contraseña</label>` + `<input type="password" id="login-password" required autocomplete="current-password">`
  - `<button type="submit" class="btn btn-primary">Entrar</button>`
  - `<p id="login-error" class="error" hidden>Credenciales inválidas. Intenta de nuevo.</p>`
  - `<p class="forgot"><a href="#">¿Olvidaste tu contraseña?</a></p>` (maqueta)
- `onsubmit`: previene default, si campos tienen valor → navega a `#/conversaciones`, sino muestra error

### Ajustes (`renderSettings`)
- Contenedor `<section id="settings">` con 4 secciones:

#### 1. Correo (`renderEmailSection`)
- `<div class="settings-section">`
  - `<h2>Correo de destino</h2>`
  - `<label for="settings-email">Correo</label>` + `<input type="email" id="settings-email" value="{email}">`
  - `<button type="button" id="settings-test-email" class="btn btn-secondary">Enviar correo de prueba</button>`
  - `onchange` email → `saveSettings({ email })`
  - `onclick` test email → `showToast(\`Correo de prueba enviado a {email} (simulado)\`, 'info')`

#### 2. Eventos (`renderEventsSection`)
- `<div class="settings-section">`
  - `<h2>Eventos a avisar</h2>`
  - 3 × `<label class="toggle-label">`:
    - `<span class="toggle-info">` → `<strong>{label}</strong>` + `<small>{descripción}</small>`
    - `<input type="checkbox" class="toggle" role="switch" checked={events.includes(key)}>`
    - `<span class="toggle-slider"></span>`
  - `onchange` toggle → nuevo array `events` → `saveSettings({ events })`

#### 3. Horario silencio (`renderQuietHoursSection`)
- `<div class="settings-section">`
  - `<h2>Horario de silencio</h2>`
  - `<label class="toggle-label">`
    - `<span>Activar horario de silencio</span>`
    - `<input type="checkbox" id="quiet-enabled" checked={quietHours?.enabled}>`
  - Si enabled:
    - `<label for="quiet-from">Desde</label>` + `<input type="time" id="quiet-from" value={from}>`
    - `<label for="quiet-to">Hasta</label>` + `<input type="time" id="quiet-to" value={to}>`
  - `onchange` → `saveSettings({ quietHours: { enabled, from, to } })`

#### 4. Vista previa (`renderPreviewSection`)
- `<div class="settings-section preview">`
  - `<h2>Vista previa del correo</h2>`
  - `<div class="preview-card">` con contenido estático (ver spec)
  - `<p class="preview-note">Los avisos por correo no incluyen nombre, teléfono, dirección ni mensajes del cliente por privacidad.</p>`

### Toast (`showToast`)
- Crea `<div class="toast toast-{type}" role="alert" aria-live="polite">{message}</div>`
- Append a `<body>` o contenedor `#toast-container`
- `setTimeout(3000, () => remove())`
- Animación CSS: slide-in desde abajo, fade-out

---

## Decisiones con alternativa descartada

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| Lógica pura en `domain/settings.js` | Validación inline en UI | Testeable sin DOM; reutilizable |
| Toast como componente separado | `alert()` o inline en settings | Reutilizable; no bloquea; accesible |
| Toggle nativo `<input type="checkbox" role="switch">` | Custom switch con div | Accesibilidad nativa; menos CSS/JS |
| `type="time"` para horario | Selects hora/minuto | Nativo en móvil; UX estándar |
| Vista previa estática (no dinámica) | Generada desde settings actuales | Simplicidad; borrador-ui muestra ejemplo fijo |
| Login redirige a conversaciones | Login se queda en login | Flujo natural: login → bandeja principal |
| Hash vacío → login (no conversaciones) | Hash vacío → conversaciones | Login es puerta de entrada (S1) |

---

## Estrategia de tests

**Archivo**: `tests/settings.test.js`

**Casos (domain/settings.js)**:
1. `validateEmail` — email válido → `{ valid: true }`
2. `validateEmail` — sin @ → `{ valid: false, error }`
3. `validateEmail` — vacío → `{ valid: false, error }`
4. `validateEmail` — solo local-part → `{ valid: false, error }`
5. `formatTimeHHMM` — Date(2024,0,1,23,0) → '23:00'
6. `formatTimeHHMM` — Date(2024,0,1,8,5) → '08:05'
7. `parseTimeHHMM` — '23:00' → Date hoy 23:00
8. `parseTimeHHMM` — '08:05' → Date hoy 08:05
9. `parseTimeHHMM` — '25:00' → null
10. `parseTimeHHMM` — 'abc' → null
11. `mergeSettings` — cambia solo email → mantiene events y quietHours
12. `mergeSettings` — cambia events → mantiene email y quietHours
13. `mergeSettings` — quietHours.enabled=false → quita from/to
14. `getEventLabel` — 'waiting_human' → 'Nueva conversación esperando asesor'
15. `getEventLabel` — 'unanswered_15min' → 'Cliente escribe y nadie responde en 15 min'
16. `getEventLabel` — 'window_closing' → 'Ventana por cerrar en conversaciones atendidas'
17. `getEventLabel` — desconocido → clave original

**Cobertura**: 100% de `src/domain/settings.js`

**Archivo**: `tests/navigation.test.js` (extender)
- `parseHash('#/login')` → `{ screen: 'login' }`
- `parseHash('#/ajustes')` → `{ screen: 'settings' }`
- Hash vacío/desconocido → default a 'login' (no 'conversations')

---

## Tareas (máx. 3 archivos por tarea, verificables individualmente)

| # | Descripción | Archivos | Verificación |
|---|---|---|---|
| 1 | Lógica pura settings + tests | `src/domain/settings.js`, `tests/settings.test.js` | `npm test` |
| 2 | Componente toast + estilos | `src/ui/toast.js`, `src/styles/toast.css` | Browser: toast aparece, auto-dismiss, accessible |
| 3 | Pantalla login + estilos + navegación | `src/ui/login.js`, `src/styles/login.css`, `src/domain/navigation.js` | Browser: login muestra form, submit vacío → error, submit con datos → navega a conversaciones |
| 4 | Pantalla ajustes (secciones email, eventos, silencio, preview) | `src/ui/settings.js`, `src/ui/screens.js` | Browser: carga settings, toggles funcionan, email se guarda, horario silencio funciona |
| 5 | Estilos ajustes + integración app.js + tests navegación | `src/styles/settings.css`, `src/ui/app.js`, `tests/navigation.test.js` | Browser 360/390/1280px: sin scroll horizontal, touch targets ≥44px, contraste ≥4.5:1, `npm test` |
| 6 | Revisión final y criterios de aceptación | máx. 3 archivos de `src/styles` o `src/ui` | Checklist criterios 1-10 spec; `npm test` pasa completo |

---

## Qué RF cubre cada parte (referencia borrador-ui S1, S6)

| Parte | Criterios borrador-ui |
|---|---|
| `settings.js` + tests | Validación email, merge settings, formateo hora |
| `login.js` + `login.css` | S1: campos, botón, error, maqueta |
| `settings.js` + `settings.css` | S6: correo (88), eventos (89), silencio (90), preview (91-92) |
| `toast.js` + `toast.css` | Feedback "correo de prueba enviado" |
| `navigation.js` | Rutas login/ajustes, redirección inicial |
| `app.js` | Flujo login → conversaciones, carga settings |
| `mockService.js` (existente) | `getNotificationSettings`, `saveNotificationSettings` |