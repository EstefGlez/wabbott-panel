# Wabbott Panel: guía para agentes

## Stack
HTML + CSS + JavaScript (módulos ES). Sin frameworks, sin TypeScript, sin Tailwind, sin compilación.
Móvil primero (390 px de referencia).

## Comandos
- Pruebas: `npm test` (usa `node --test`). Es el único comando que decide si una tarea está hecha.
- Ver la página: abrir `index.html` con Live Server de VS Code, o `npx serve .`. No abrir con `file://` porque los módulos no cargan.

## Reglas de código
- Módulos ES. En todos los imports se escribe la extensión `.js`.
- Funciones pequeñas y puras en `src/domain`. La hora actual entra como parámetro `now` (un `Date`). Nunca llamar a `new Date()` dentro de la lógica.
- Pruebas con `node:test` y `node:assert/strict`, en `tests/*.test.js`.
- Tipos del contrato de datos con comentarios JSDoc.
- Textos de clientes en pantalla: solo `textContent`. Nunca `innerHTML`.
- CSS: variables en `src/styles/tokens.css`, móvil primero, sin `!important`.
- Sin dependencias nuevas. Si hace falta una, preguntar antes.

## Estructura
```
index.html
src/
  domain/    lógica pura (sin DOM)
  mock/      datos ficticios
  services/  capa de servicio (mock ahora, backend después)
  ui/        pantallas y piezas
  styles/    CSS
tests/       pruebas con node --test
specs/       specs, plan y tareas por feature
docs/        constitución, borrador de interfaz, handoff
```

## Flujo
1. Leer `contexto.md`, `plan.md` y la spec de la tarea antes de empezar.
2. Hacer una tarea a la vez. Máximo 3 archivos por tarea.
3. Correr `npm test`. Si falla, no marcar la tarea como hecha.
4. No cambiar la spec ni las tareas. Si algo no cuadra, parar y reportarlo.
