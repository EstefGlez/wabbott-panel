# Spec 007: Login y Ajustes (S1, S6)

> **Versión:** 1.0
> **Fecha:** 2026-10-22
> **Basado en:** `docs/borrador-ui.md` secciones S1 y S6, `docs/constitution.md`

---

## 1. Resumen

Esta spec cubre dos pantallas del panel de atención WhatsApp:

- **S1. Inicio de sesión**: Maqueta visual de autenticación (correo + contraseña, botón "Entrar"). Cualquier credencial entra (simulado). Mensaje de error de ejemplo.
- **S6. Ajustes de avisos** (`#/ajustes`): Configuración de correo de destino con botón "Enviar correo de prueba" (maqueta), interruptores para tres eventos de notificación, horario de silencio opcional (23:00-08:00), y vista previa del correo de ejemplo. Integrado con `mockService.js` usando `getNotificationSettings` y `saveNotificationSettings`.

**Alcance:** Solo interfaz con datos simulados. Sin autenticación real, sin envío real de correos, sin backend.

---

## 2. Contrato de datos (ref. `src/domain/contract.js`)

### NotificationSettings

```typescript
interface NotificationSettings {
  email: string;                    // Correo de destino
  events: string[];                 // Array con subset de NOTIFICATION_EVENTS
  quietHours?: {                    // Horario de silencio opcional
    enabled: boolean;
    from: string;                   // Formato HH:MM, ej. '23:00'
    to: string;                     // Formato HH:MM, ej. '08:00'
  };
}
```

### Constantes

- `NOTIFICATION_EVENTS = ['waiting_human', 'unanswered_15min', 'window_closing']` — Los tres eventos que pueden activarse/desactivarse.
- `DEFAULT_NOTIFICATION_SETTINGS` — Valores por defecto (ver mockService.js).

### User (maqueta)

```typescript
interface User {
  id: string;
  email: string;
  name: string;
}
```

---

## 3. Capa de servicio (ref. `src/services/mockService.js`)

Métodos existentes relevantes (ya implementados):

```js
getNotificationSettings() → NotificationSettings
saveNotificationSettings(changes: Partial<NotificationSettings>) → NotificationSettings
```

Estructura actual en `mockService.js`:
```js
notificationSettings: {
  email: 'admin@ejemplo.com',
  events: ['waiting_human', 'unanswered_15min', 'window_closing'],
  quietHours: { enabled: true, from: '23:00', to: '08:00' },
}
```

---

## 4. Pantallas y componentes

### S1. Login (`#/login`)

**Maqueta visual:**
- Campo "Correo" (`<input type="email" required>`).
- Campo "Contraseña" (`<input type="password" required>`).
- Botón "Entrar" (primario, ancho completo en móvil).
- Enlace/texto "¿Olvidaste tu contraseña?" (maqueta, no funcional).
- Mensaje de error de ejemplo (inicialmente oculto): "Credenciales inválidas. Intenta de nuevo."
- **Comportamiento:** Cualquier correo/contraseña navega a `#/conversaciones` (simula login exitoso). Si los campos están vacíos, muestra el mensaje de error.

**Estados:**
- Vacío: campos limpios, sin error.
- Error: campos con valores, mensaje visible.
- Cargando: botón deshabilitado con spinner (opcional, maqueta).

### S6. Ajustes (`#/ajustes`)

**Secciones:**

1. **Correo de destino**
   - Input email con valor actual.
   - Botón "Enviar correo de prueba" (maqueta): al pulsar muestra toast/aviso "Correo de prueba enviado a {email} (simulado)".
   - Validación: formato email básico.

2. **Eventos a avisar** (tres interruptores tipo switch/toggle)
   - "Nueva conversación esperando asesor" → `waiting_human`
   - "Cliente escribe y nadie responde en 15 min" → `unanswered_15min`
   - "Ventana por cerrar en conversaciones atendidas" → `window_closing`
   - Cada interruptor: label + descripción breve + toggle. Cambio → llama `saveNotificationSettings({ events: [...] })`.

3. **Horario de silencio (opcional)**
   - Checkbox "Activar horario de silencio".
   - Si activo: dos inputs `<input type="time">` para "Desde" y "Hasta" (valores por defecto 23:00 / 08:00).
   - Cambio → llama `saveNotificationSettings({ quietHours: { enabled, from, to } })`.

4. **Vista previa del correo**
   - Tarjeta con contenido de ejemplo (estático, no dinámico):
     ```
     Asunto: Nueva conversación esperando asesor — GH Multimarcas
     
     Hay una nueva conversación esperando asesor en GH Multimarcas (Ventas).
     Tiempo de espera: 4 min
     
     [Botón: Abrir panel]
     
     —
     Los avisos por correo no incluyen datos del cliente por privacidad.
     ```
   - Nota informativa visible: "Los avisos por correo no incluyen nombre, teléfono, dirección ni mensajes del cliente por privacidad."

**Estados vacíos/error:**
- Sin configuración guardada: muestra valores por defecto del mock.

---

## 5. Navegación y rutas (hash-based)

| Pantalla | Hash | Parámetros |
|----------|------|------------|
| Login | `#/login` | — |
| Ajustes | `#/ajustes` | — |

**Reglas de navegación:**
- Al cargar la app con hash vacío o desconocido → redirige a `#/login` (no a conversaciones).
- Tras "login" exitoso → navega a `#/conversaciones`.
- Desde cualquier pantalla, click en "Ajustes" en la barra de navegación → `#/ajustes`.
- En `src/domain/navigation.js` extender `parseHash` para reconocer estas rutas.

---

## 6. Reglas de interacción

### Login
- Validación HTML5 nativa (`required`, `type="email"`).
- Submit del formulario: previene default, navega a `#/conversaciones`.
- Mensaje de error: se muestra si submit con campos vacíos.

### Ajustes
- **Correo:** Al perder foco (blur) o al pulsar "Guardar" (botón único para toda la pantalla), valida y guarda.
- **Eventos:** Cada toggle cambia el array `events` (agrega/quita el string del evento) y guarda inmediatamente.
- **Horario silencio:** Checkbox habilita/deshabilita los inputs time. Al cambiar inputs, guarda `quietHours`.
- **Vista previa:** Solo lectura, no interactiva.
- **Persistencia:** Cambios se guardan en `mockService` y persisten durante la sesión.

---

## 7. Accesibilidad y responsive

- **Móvil primero (390px):** formularios en columna, botones ≥44px, inputs con `font-size: 16px` para evitar zoom en iOS.
- **Escritorio (≥1024px):** formulario centrado con ancho máximo ~480px.
- **Contraste:** 4.5:1 mínimo en todos los textos.
- **Teclado:** Tab navega entre campos, Enter en login submite, Space/Enter en toggles.
- **ARIA:** `aria-label` en toggles, `role="alert"` en mensajes de error/toast, `aria-live="polite"` en vista previa.
- **Reducir movimiento:** `prefers-reduced-motion` desactiva animaciones de switches.
- **Autofill:** `autocomplete="email"` y `autocomplete="current-password"` en login.

---

## 8. Criterios de aceptación (ref. borrador-ui §9)

| # | Criterio |
|---|----------|
| 1 | Login: campos vacíos + submit → muestra error "Credenciales inválidas". |
| 2 | Login: cualquier credencial → navega a `#/conversaciones`. |
| 3 | Ajustes: carga muestra email, 3 toggles, horario silencio, vista previa. |
| 4 | Ajustes: cambiar email + guardar → persiste en mock y se ve al recargar. |
| 5 | Ajustes: toggle evento → actualiza array `events` en mock inmediatamente. |
| 6 | Ajustes: activar/desactivar horario silencio → persiste `quietHours`. |
| 7 | Ajustes: botón "Enviar correo de prueba" → muestra toast simulado. |
| 8 | Vista previa: no contiene nombre, teléfono, dirección ni mensajes del cliente. |
| 9 | Navegación: hash vacío → `#/login`; login → `#/conversaciones`; nav Ajustes → `#/ajustes`. |
| 10 | 390px sin scroll horizontal, botones/inputs ≥44px, contraste ≥4.5:1. |

---

## 9. Archivos a crear/modificar (resumen)

### Nuevos (domain)
- `src/domain/settings.js` — lógica pura: validación email, formateo hora, merge de settings.

### Nuevos (ui)
- `src/ui/login.js` — pantalla login (S1).
- `src/ui/settings.js` — pantalla ajustes (S6).
- `src/ui/toast.js` — componente toast/aviso reutilizable (para "correo de prueba enviado").

### Modificar
- `src/domain/navigation.js` — nuevas rutas `#/login`, `#/ajustes`.
- `src/ui/screens.js` — renderizado pantallas login y ajustes.
- `src/ui/app.js` — delegación eventos, lógica de navegación post-login.
- `src/styles/login.css` — estilos login.
- `src/styles/settings.css` — estilos ajustes.
- `index.html` — vincular nuevos CSS.

### Tests
- `tests/settings.test.js` — lógica dominio settings (validación email, merge, formateo hora).
- `tests/navigation.test.js` (extender) — rutas login y ajustes.

---

## 10. Fuera de alcance (esta spec)

- Autenticación real (JWT, sesiones, refresh tokens).
- Envío real de correos (SMTP, proveedores, plantillas).
- Recuperación de contraseña real.
- Roles de usuario / permisos.
- Notificaciones push / Web Push API.
- Múltiples destinatarios de correo.
- Programación avanzada de horarios (días laborables, zonas horarias).