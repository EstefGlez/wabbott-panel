# Tareas spec 007: Login y Ajustes (S1, S6)

> **Orden obligatorio**: una tarea a la vez. Máximo 3 archivos por tarea. Verificar con `npm test` antes de marcar como hecha.

---

## Tarea 1: Lógica pura de ajustes + tests
**Archivos:**
- `src/domain/settings.js` (nuevo)
- `tests/settings.test.js` (nuevo)

**Qué implementar:**
1. `validateEmail(email)` — validación básica (contiene @, tiene dominio)
2. `formatTimeHHMM(date)` — Date → 'HH:MM' (24h, zero-padded)
3. `parseTimeHHMM(str)` — 'HH:MM' → Date (hoy), null si inválido
4. `mergeSettings(current, changes)` — merge inmutable, respeta estructura
5. `getEventLabel(eventKey)` — 3 claves → etiquetas legibles

**Tests (node --test):**
- 17 casos cubriendo validos/invalidos, edge cases (24:00, 00:00, merge parcial, claves desconocidas)

**Verificación:** `npm test` → todos los tests de `settings.test.js` pasan.

---

## Tarea 2: Componente toast + estilos
**Archivos:**
- `src/ui/toast.js` (nuevo)
- `src/styles/toast.css` (nuevo)

**Qué implementar:**
1. `showToast(message, type)` — type: 'info' | 'success' | 'error'
2. Crea elemento `<div class="toast toast-{type}" role="alert" aria-live="polite">`
3. Inserta en `#toast-container` (crear en `index.html` si no existe) o `document.body`
4. Animación slide-in desde abajo (CSS)
5. Auto-dismiss a 3000ms con fade-out
6. Limpia elemento del DOM tras animación

**Estilos CSS:**
- Posición fixed, bottom, left/right con gap, z-index alto
- Colores por tipo (info: azul, success: verde, error: rojo)
- Mínimo 44px alto, padding adecuado
- `prefers-reduced-motion`: sin animación
- Responsive: móvil ancho casi completo, escritorio ancho auto

**Verificación:** Browser manual — toast aparece, se ve bien, desaparece a 3s, accesible (screen reader lo anuncia).

---

## Tarea 3: Pantalla login + navegación + estilos
**Archivos:**
- `src/ui/login.js` (nuevo)
- `src/styles/login.css` (nuevo)
- `src/domain/navigation.js` (modificar)

**Qué implementar:**

**navigation.js:**
- Extender `parseHash(hash)` para reconocer:
  - `#/login` → `{ screen: 'login' }`
  - `#/ajustes` → `{ screen: 'settings' }`
  - Hash vacío o desconocido → `{ screen: 'login' }` (cambio: antes era 'conversations')

**login.js:**
- `renderLogin(state)` — retorna string HTML del formulario
- `bindLoginEvents(onLogin)` — delega submit en form#login-form
  - Previene default
  - Si email y password tienen valor (trim) → `onLogin()` (navega a conversaciones)
  - Si no → muestra #login-error (quita hidden)

**login.css:**
- Formulario centrado (max-width 400px), padding generoso
- Inputs: `font-size: 16px` (evita zoom iOS), altura ≥44px, ancho 100%
- Botón primario ancho completo en móvil, auto en escritorio
- Error: color rojo, margin-top, `hidden` attribute
- Link "¿Olvidaste...?" estilo secondary
- Responsive: 390px sin scroll horizontal, escritorio centrado
- Contraste ≥4.5:1

**Verificación:** Browser — abre `#/login` muestra formulario; submit vacío → error visible; submit con datos → navega a `#/conversaciones`; hash vacío → login; recarga en login → se mantiene.

---

## Tarea 4: Pantalla ajustes (componentes + integración screens)
**Archivos:**
- `src/ui/settings.js` (nuevo)
- `src/ui/screens.js` (modificar)

**Qué implementar:**

**settings.js:**
- `renderSettings(settings)` — compone 4 secciones, retorna HTML string
- `renderEmailSection(settings, onChange)` — input email + botón prueba
- `renderEventsSection(settings, onChange)` — 3 toggles con labels/descripciones
- `renderQuietHoursSection(settings, onChange)` — checkbox + 2 inputs time
- `renderPreviewSection()` — HTML estático de la vista previa (ver spec)

**screens.js:**
- `renderSettings(state)` — llama `service.getNotificationSettings()`, renderiza con `renderSettings`, vincula eventos:
  - Email blur/change → `saveSettings({ email })` → actualiza state → re-render sección
  - Toggle eventos change → `saveSettings({ events: [...] })` → actualiza state
  - Checkbox silencio + inputs time change → `saveSettings({ quietHours })` → actualiza state
  - Botón "Enviar correo de prueba" → `showToast(\`Correo de prueba enviado a {email} (simulado)\`, 'info')`

**Verificación:** Browser — navega a `#/ajustes` muestra 4 secciones con valores del mock; cambiar email → persiste (recarga y se ve); toggles eventos → cambian array en mock; checkbox silencio + times → persisten; botón prueba → toast aparece.

---

## Tarea 5: Estilos ajustes + integración app.js + tests navegación
**Archivos:**
- `src/styles/settings.css` (nuevo)
- `src/ui/app.js` (modificar)
- `tests/navigation.test.js` (modificar - extender)

**Qué implementar:**

**settings.css:**
- Secciones con spacing consistente, bordes sutiles, headers
- Toggles: switch nativo accesible (`input[type=checkbox][role=switch]` + label), tamaño ≥44px
- Inputs time: altura ≥44px, font-size 16px
- Vista previa: tarjeta con fondo sutil, border, padding, tipografía monospace para "cuerpo"
- Nota de privacidad: texto pequeño, color muted
- Responsive: móvil columna única, escritorio max-width ~600px centrado
- Sin scroll horizontal 360-430px, touch targets ≥44px, contraste ≥4.5:1

**app.js:**
- Estado `isLoggedIn` (boolean, inicia false)
- Estado `notificationSettings` (null inicial)
- Estado `toast` (null inicial)
- Router: al cambiar hash:
  - Si `!isLoggedIn` y destino ≠ 'login' → redirige a `#/login`
  - Login exitoso → `isLoggedIn = true`, navega a `#/conversaciones`
  - Carga settings al entrar a `#/ajustes`
  - Render toast si `state.toast` existe

**navigation.test.js (extender):**
- Tests para `parseHash('#/login')`, `parseHash('#/ajustes')`, hash vacío → login

**Verificación:** `npm test` → tests navegación pasan; Browser 360/390/1280px — ajustes sin scroll horizontal, todo ≥44px, contraste OK; flujo login → conversaciones → ajustes → recarga mantiene estado.

---

## Tarea 6: Revisión final y criterios de aceptación
**Archivos:** máx. 3 archivos de `src/styles` o `src/ui` (ajustes finos)

**Checklist criterios spec (1-10):**
1. ✅ Login: campos vacíos + submit → error
2. ✅ Login: credenciales cualquiera → navega a conversaciones
3. ✅ Ajustes: carga muestra email, 3 toggles, horario, preview
4. ✅ Ajustes: cambiar email + guardar → persiste
5. ✅ Ajustes: toggle evento → actualiza mock
6. ✅ Ajustes: horario silencio → persiste
7. ✅ Ajustes: botón prueba → toast simulado
8. ✅ Preview: sin datos sensibles (verificar contenido estático)
9. ✅ Navegación: hash vacío → login; login → conversaciones; nav → ajustes
10. ✅ 390px: sin scroll horizontal, ≥44px, contraste ≥4.5:1

**Comando final:** `npm test` → suite completa en verde.

---

## Dependencias entre tareas

```
Tarea 1 (domain/settings + tests)
    ↓
Tarea 2 (toast) ──────────────────┐
    ↓                             │
Tarea 3 (login + navigation)      │
    ↓                             ↓
Tarea 4 (settings UI + screens) ←─┘ (usa toast)
    ↓
Tarea 5 (settings CSS + app.js + nav tests)
    ↓
Tarea 6 (revisión final)
```

**Nota:** Tareas 2 y 3 pueden hacerse en paralelo tras Tarea 1 (no comparten archivos). Tarea 4 requiere Tarea 2 (toast) y Tarea 3 (navigation).