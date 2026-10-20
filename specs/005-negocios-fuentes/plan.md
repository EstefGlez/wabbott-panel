# Plan Spec 005: Negocios y Fuentes de Conocimiento

> **Metodología:** SDD (Spec → Plan → Tasks → Implement)
> **Stack:** HTML + CSS + JS (ES modules), sin frameworks, sin build.
> **Tests:** `node --test` en `tests/*.test.js`. Verificación visual en navegador a 360, 390, 1280px.

---

## 1. Arquitectura y responsabilidad de archivos

### Capa de dominio (`src/domain/`) — Lógica pura, sin DOM, testeable
| Archivo | Responsabilidad |
|---------|-----------------|
| `business.js` | `validateBusinessName(name, existingNames)`, `validateBusinessColor(color)`, `formatBusinessColor(color)`, `BUSINESS_COLOR_PALETTE` (array 8+ hex), `getBusinessInitial(name)` |
| `source.js` | `validateSourceInput(kind, data)`, `formatCharCount(n)`, `calculateContextBudget(sources, limit)`, `getSourceKindIcon(kind)`, `getSourceKindLabel(kind)`, `getStatusBadgeClass(status)`, `truncatePreview(text, max)` |
| `navigation.js` | (existente) Extender `parseHash` para `#/negocios`, `#/negocios/:id`, `#/negocios/:id/fuentes` |
| `contract.js` | (existente) Tipos y constantes (`CONTEXT_LIMIT`, `SOURCE_KINDS`, etc.) |

### Capa de servicio (`src/services/`) — Mock con estado
| Archivo | Responsabilidad |
|---------|-----------------|
| `mockService.js` | (existente) Extender con: `updateBusiness`, `deleteBusiness`, `addNumber`, `updateNumber`, `deleteNumber`, `updateSource`, `nextBusinessId`, `nextNumberId` |

### Capa de UI (`src/ui/`) — Componentes de pantalla
| Archivo | Responsabilidad |
|---------|-----------------|
| `businessList.js` | `renderBusinessList(state)` — tarjetas de negocios con color, nombre, contador, botón crear. |
| `businessDetail.js` | `renderBusinessDetail(state, businessId)` — header editable, lista números, botón agregar, enlace a fuentes. |
| `sourceList.js` | `renderSourceList(state, businessId)` — tabla/lista fuentes, indicador presupuesto, botón agregar. |
| `sourceModal.js` | `openSourceModal(businessId, onSubmit)` — modal 3 pestañas (Enlace, Archivo, Texto), validación, submit. |
| `businessModal.js` | `openBusinessModal(business?, onSubmit)` — modal crear/editar negocio (nombre, paleta colores). |
| `numberModal.js` | `openNumberModal(businessId, number?, onSubmit)` — modal agregar/editar número (nombre, teléfono). |
| `screens.js` | (existente) Añadir `renderBusinesses(state)`, `renderSources(state)` y delegación a componentes. |

### Estilos (`src/styles/`)
| Archivo | Responsabilidad |
|---------|-----------------|
| `business.css` | Estilos S4: tarjetas negocio, header detalle, lista números, modales, paleta colores, responsive. |
| `source.css` | Estilos S5: lista fuentes, badges, indicador presupuesto (barra), modal 3 pestañas, vista previa, estados vacío/error, responsive. |

### Tests (`tests/`)
| Archivo | Responsabilidad |
|---------|-----------------|
| `business.test.js` | Tests para `business.js` + mock service métodos negocio/número. |
| `source.test.js` | Tests para `source.js` + mock service métodos fuentes. |
| `navigation.test.js` | (existente) Extender tests para nuevas rutas. |

---

## 2. Desglose de tareas (máx. 3 archivos por tarea)

| Tarea | Archivos (máx. 3) | Descripción |
|-------|-------------------|-------------|
| **1. Dominio: Negocios y Fuentes** | `src/domain/business.js` (nuevo)<br>`src/domain/source.js` (nuevo)<br>`tests/business.test.js` (nuevo)<br>`tests/source.test.js` (nuevo) | Lógica pura + tests. Validaciones, formateo, paleta colores, presupuesto, iconos/badges. **4 archivos** → dividir en 1a y 1b si estricto. |
| **2. Servicio: Extender mockService** | `src/services/mockService.js` (modificar)<br>`tests/business.test.js` (extender)<br>`tests/source.test.js` (extender) | Añadir métodos CRUD para Business, PhoneNumber, KnowledgeSource. Tests de integración mock. |
| **3. Navegación y App** | `src/domain/navigation.js` (modificar)<br>`src/ui/app.js` (modificar)<br>`tests/navigation.test.js` (extender) | Nuevas rutas hash, delegación eventos, carga datos iniciales para S4/S5. |
| **4. UI: Lista y Detalle de Negocios** | `src/ui/businessList.js` (nuevo)<br>`src/ui/businessDetail.js` (nuevo)<br>`src/styles/business.css` (nuevo) | Pantalla S4 principal y detalle. Renderizado, eventos, responsive. |
| **5. UI: Modales Negocio y Número** | `src/ui/businessModal.js` (nuevo)<br>`src/ui/numberModal.js` (nuevo)<br>`src/styles/business.css` (extender) | Modales crear/editar negocio y número. Validación, paleta colores, formateo teléfono. |
| **6. UI: Lista de Fuentes + Indicador** | `src/ui/sourceList.js` (nuevo)<br>`src/styles/source.css` (nuevo)<br>`tests/source.test.js` (extender UI si aplica) | Pantalla S5: tabla fuentes, badges, switch activo, indicador presupuesto, botón agregar, estados vacío/error. |
| **7. UI: Modal Agregar Fuente (3 pestañas)** | `src/ui/sourceModal.js` (nuevo)<br>`src/styles/source.css` (extender)<br>`tests/source.test.js` (extender) | Modal con tabs: Enlace, Archivo, Texto. Validación por pestaña, simulación procesamiento, preview. |
| **8. Integración: Pantallas y Estilos Globales** | `src/ui/screens.js` (modificar)<br>`index.html` (modificar)<br>`src/styles/business.css` / `source.css` (ajustes finales) | Conectar `renderBusinesses`/`renderSources` en `screens.js`, vincular CSS en `index.html`, ajustes responsive cruzados. |
| **9. Revisión Final y Criterios** | `tests/*.test.js` (verificar todo pasa)<br>`src/ui/app.js` (ajustes finales)<br>— | `npm test` pasa. Checklist visual 360/390/1280px. Criterios aceptación 7, 8, 10, 12 + navegación hash + CRUD mock. |

> **Nota:** Tarea 1 tiene 4 archivos lógicos (2 domain + 2 test). Se puede ejecutar como una sola tarea porque domain y test van pareados, o dividir en **1a: business domain+test** y **1b: source domain+test**.

---

## 3. Dependencias entre tareas

```
Tarea 1 (Dominio) ──────────────────────┐
                                        ├─→ Tarea 2 (Servicio)
Tarea 3 (Navegación) ───────────────────┘
                                                    │
                        ┌─────────────────────────┼─────────────────────────┐
                        ▼                         ▼                         ▼
                  Tarea 4 (UI Negocios)     Tarea 6 (UI Fuentes Lista)  Tarea 5 (Modales)
                        │                         │                         │
                        └─────────────────────────┼─────────────────────────┘
                                                    ▼
                                            Tarea 7 (Modal Fuentes)
                                                    │
                                                    ▼
                                            Tarea 8 (Integración)
                                                    │
                                                    ▼
                                            Tarea 9 (Revisión Final)
```

- Tareas 4, 5, 6, 7 pueden desarrollarse en paralelo tras 1-3.
- Tarea 8 requiere 4, 5, 6, 7 completadas.
- Tarea 9 es final.

---

## 4. Estimación de esfuerzo

| Tarea | Complejidad | Archivos | Esfuerzo estimado |
|-------|-------------|----------|-------------------|
| 1. Dominio | Media | 4 | 2-3h |
| 2. Servicio | Media | 3 | 1-2h |
| 3. Navegación/App | Baja | 3 | 1h |
| 4. UI Negocios | Alta | 3 | 3-4h |
| 5. Modales | Media | 3 | 2-3h |
| 6. UI Fuentes Lista | Alta | 3 | 3-4h |
| 7. Modal Fuentes | Alta | 3 | 3-4h |
| 8. Integración | Baja | 3 | 1-2h |
| 9. Revisión | Media | 2 | 1-2h |
| **Total** | | **~27** | **17-25h** |

---

## 5. Criterios de aceptación por tarea

| Tarea | Criterios clave |
|-------|-----------------|
| 1 | `npm test` pasa tests nuevos (validaciones, formateo, paleta, presupuesto). 232+ tests existentes no rotos. |
| 2 | `npm test` pasa. Mock service CRUD funciona: crear/editar/eliminar negocio, número, fuente. |
| 3 | `npm test` pasa. Hash `#/negocios`, `#/negocios/biz-gh`, `#/negocios/biz-gh/fuentes` parsean correctamente. App carga datos al navegar. |
| 4 | Browser 390px: lista negocios scroll vertical, tarjetas completas. 1280px: grid 2-3 columnas. Detalle negocio: header editable, lista números, botones ≥44px. |
| 5 | Modales: crear/editar negocio valida nombre único, color paleta. Crear/editar número valida teléfono E.164. `<dialog>` nativo, focus trap, ESC cierra. |
| 6 | Browser: tabla fuentes responsive (stack en móvil). Badges estado con colores. Switch activo recalcula indicador en tiempo real. Indicador: verde/ámbar/rojo + texto. Estado vacío y error renderizan. |
| 7 | Modal 3 pestañas funcionales. Validación por tipo. Simulación processing→ready con timeout. Preview muestra 500 chars. Submit agrega a lista y actualiza indicador. |
| 8 | Navegación fluida entre S2, S4, S5. Sin errores consola. CSS cargado sin conflictos. |
| 9 | `npm test` ✅ (258+ tests). Checklist visual completo ✅. Criterios 7, 8, 10, 12, navegación, CRUD mock ✅. |

---

## 6. Notas de implementación

- **Hora actual**: En domain recibir `now` como parámetro (patrón `window.js`). En UI pasar `new Date()`.
- **Inmutabilidad**: Usar `structuredClone` en mock service para estado.
- **IDs**: Contadores `nextBusinessId`, `nextNumberId`, `nextSourceId` (ya existe).
- **Colores negocio**: Paleta fija 8+ colores en `domain/business.js` con contraste verificado. Selector visual con círculo + inicial.
- **Formateo teléfono**: En lista mostrar legible `+52 55 5555 0101`; en detalle completo. Usar `domain/phone.js` si hay utilidad.
- **Simulación procesamiento fuente**: `setTimeout` 1500ms → `status: 'ready'`, `charCount` aleatorio 1000-15000, `previewText` truncado. Para error: 10% probabilidad `status: 'error'`, `errorMessage`.
- **Indicador presupuesto**: Recalcular en `renderSourceList` sumando `charCount` de `enabled: true`. Mostrar barra `<progress>` o `div` con width %.
- **Accesibilidad modales**: `<dialog>` con `form method="dialog"`, `autofocus` en primer input, `aria-labelledby`.
- **Touch targets**: `min-height: 44px`, `min-width: 44px` en botones/iconos clicables.
- **Safe area**: `padding-bottom: env(safe-area-inset-bottom)` en modales y fixed bottom.