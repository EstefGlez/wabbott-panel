# Plan de la spec 002: Estructura base y navegación del panel

## Archivos y responsabilidades

### Lógica pura (domain)
- `src/domain/navigation.js` — Lógica pura de navegación (sin DOM)
  - Lista de destinos: `['conversaciones', 'negocios', 'ajustes']`
  - `parseHash(hash: string): string` — Convierte `#/ruta` en destino válido; por defecto 'conversaciones'
  - `isActive(currentHash: string, target: string): boolean` — Indica si un destino está activo

### Dibujo (ui)
- `index.html` — Estructura base: `<nav id="nav">`, `<main id="app">`, carga `src/ui/app.js`
- `src/ui/app.js` — Punto de entrada: estado único, enrutador hashchange, dibujo inicial
- `src/ui/nav.js` — Barra de navegación (barra inferior / lateral según breakpoint)
- `src/ui/screens.js` — Pantallas: Conversaciones, Negocios, Ajustes, Detalle conversación

### Estilos (styles)
- `src/styles/tokens.css` — Variables CSS (colores, espaciado, breakpoints, safe-area)
- `src/styles/base.css` — Reset, tipografía, focus-visible, contraste 4.5:1
- `src/styles/layout.css` — Layout responsive: móvil (<1024) barra inferior + 1 zona; escritorio (≥1024) barra lateral + 2 zonas en Conversaciones

---

## Funciones puras (src/domain/navigation.js)

```js
/** @returns {readonly string[]} */
export const DESTINATIONS = Object.freeze(['conversaciones', 'negocios', 'ajustes']);

/**
 * Convierte un hash de la URL (p.ej. '#/negocios') en un destino válido.
 * @param {string} hash — window.location.hash (incluye #)
 * @returns {string} Uno de DESTINATIONS
 */
export function parseHash(hash) { ... }

/**
 * Indica si el destino coincide con el hash actual.
 * @param {string} currentHash — window.location.hash
 * @param {string} target — Uno de DESTINATIONS
 * @returns {boolean}
 */
export function isActive(currentHash, target) { ... }
```

**Algoritmo `parseHash`**:
1. Quita `#` y `/` iniciales: `hash.replace(/^#\/?/, '')`
2. Si el resultado está en `DESTINATIONS`, devuélvelo
3. Si no, devuelve `'conversaciones'` (default RF-4)

**Algoritmo `isActive`**:
- `parseHash(currentHash) === target`

---

## Interfaz (estado único + dibujo por pantalla)

**Estado único** (`src/ui/app.js`):
```js
const state = { currentHash: window.location.hash };
```

**Funciones de dibujo** (una por pantalla, reciben `state`):
- `renderNav(state)` — Dibuja `<nav>` con enlaces a `#/conversaciones`, `#/negocios`, `#/ajustes`; marca activo con `aria-current="page"` + clase CSS
- `renderConversations(state)` — Título + "Próximamente" + zona detalle vacía
- `renderBusinesses(state)` — Título + "Próximamente"
- `renderSettings(state)` — Título + "Próximamente"
- `renderConversationDetail(state)` — Título + "Próximamente" (solo en escritorio dentro de Conversaciones)

**Enrutador** (en `app.js`):
- `window.addEventListener('hashchange', () => { state.currentHash = window.location.hash; renderAll(state); })`
- Carga inicial: `renderAll(state)`

**Navegación nativa**: Los destinos son enlaces `<a href="#/...">` nativos; el navegador cambia la dirección solo. No se usa `data-action` ni delegación de eventos en esta spec.
- `index.html` declara exactamente `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`. Sin `viewport-fit=cover`, `env(safe-area-inset-bottom)` vale 0 en iPhone.
- El DOM se construye con `createElement` y `textContent`. Nada de `innerHTML`.
- Alturas de pantalla completa con `dvh`, no `vh`. El contenido principal lleva padding inferior igual a la altura de la barra inferior más `env(safe-area-inset-bottom)`.

---

## Decisiones con alternativa descartada

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| Hash routing (`#/ruta`) | History API (`/ruta`) | Funciona en hosting estático sin configuración de servidor; recarga conserva destino (RF-5) sin backend |
| Lógica pura en `domain/` | Lógica mezclada en `ui/` | Testeable con `npm test` sin DOM; separación de responsabilidades |
| Estado único en `app.js` | Estado disperso | Predecible; una sola fuente de verdad para el hash actual |
| Enlaces nativos `<a href="#/...">` | `data-action` + delegación | Cero listeners; el navegador gestiona historial y recarga nativamente |
| Breakpoint 1024px en CSS | Media query en JS | CSS nativo; sin reflow en JS; responsive declarativo |
| `env(safe-area-inset-bottom)` | `padding-bottom: constant` | Estándar moderno; funciona en iOS Safari sin hacks |

---

## Estrategia de tests

**Archivo**: `tests/navigation.test.js`

**Casos (RF-1, RF-3, RF-4, RF-5)**:
1. `parseHash('#/conversaciones')` → `'conversaciones'`
2. `parseHash('#/negocios')` → `'negocios'`
3. `parseHash('#/ajustes')` → `'ajustes'`
4. `parseHash('#/')` → `'conversaciones'` (default RF-4)
5. `parseHash('#/desconocido')` → `'conversaciones'` (default RF-4)
6. `parseHash('')` → `'conversaciones'` (default RF-4)
7. `isActive('#/negocios', 'negocios')` → `true`
8. `isActive('#/conversaciones', 'negocios')` → `false`
9. `DESTINATIONS` tiene longitud 3 y orden correcto (RF-1)
10. `parseHash(null)` → `'conversaciones'`
11. `parseHash(undefined)` → `'conversaciones'`
12. `parseHash('#negocios')` → `'negocios'`
13. `parseHash('#/negocios/')` → `'conversaciones'` (estricto)
14. `parseHash('#/NEGOCIOS')` → `'conversaciones'`
15. `isActive('#/inventado', 'conversaciones')` → `true`

**Cobertura**: 100% de `src/domain/navigation.js`

---

## Tareas (máx. 3 archivos por tarea, verificables individualmente)

| # | Descripción | Archivos | RF | Verificación |
|---|---|---|---|---|
| 1 | Lógica de navegación y pruebas | `src/domain/navigation.js`, `tests/navigation.test.js` | RF-1,3,4,5 | `npm test` |
| 2 | Shell y barra de navegación sin estilos | `index.html`, `src/ui/nav.js`, `src/ui/app.js` | RF-1,2,3,4,5,12 | Sin estilos: cada enlace cambia la dirección y aria-current; dirección desconocida marca Conversaciones; F5 conserva el destino |
| 3 | Pantallas casi vacías | `src/ui/screens.js`, `src/ui/app.js` | RF-15,16,17,18,19 | Cada destino muestra su título y "Próximamente" |
| 4 | Variables de diseño y estilos base | `src/styles/tokens.css`, `src/styles/base.css`, `index.html` | RF-13,14 | Foco visible con Tab; contraste mayor o igual a 4.5 en el selector de color de DevTools |
| 5 | Diseño móvil: barra inferior | `src/styles/layout.css`, `index.html` | RF-6,9,10,11 | 360, 390 y 430 px: barra abajo, una zona, sin desplazamiento horizontal, elementos de al menos 44 px |
| 6 | Diseño escritorio: barra lateral y dos zonas | `src/styles/layout.css` | RF-7 | 1023 px móvil, 1024 y 1280 px escritorio; dos zonas solo en Conversaciones |
| 7 | Indicador de destino activo | `src/styles/layout.css` | RF-2 | El activo se distingue sin color (visión acromática en DevTools) |
| 8 | Revisión final | máximo 3 archivos de `src/styles` | todos | Recorrer toda la lista; `npm test` |

---

## Qué RF cubre cada parte

| Parte | RF cubiertos |
|---|---|
| `navigation.js` + tests | RF-1, RF-3, RF-4, RF-5 |
| `index.html` + `tokens.css` | RF-9, RF-10, RF-11, RF-13 |
| `base.css` | RF-12, RF-13, RF-14 |
| `layout.css` | RF-6, RF-7, RF-9, RF-11 |
| `nav.js` | RF-1, RF-2, RF-12, RF-14, RF-15 |
| `screens.js` | RF-16, RF-17, RF-18, RF-19 |
| `app.js` | RF-3, RF-5 |
| Integración + verificación manual | Todos (criterios de finalización) |