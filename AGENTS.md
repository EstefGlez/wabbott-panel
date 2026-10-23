# Wabbott Panel: guía para agentes

## Stack
- **Panel (`src/`)**: HTML + CSS + JavaScript (módulos ES). Sin frameworks, sin TypeScript, sin Tailwind, sin compilación. Móvil primero (390 px de referencia).
- **Servidor (`server/`, fase 2)**: Node.js + Express, módulos ES, con su propio `package.json`. Solo las dependencias que la spec de la tarea apruebe.
- **Base de datos**: Supabase (Postgres). Los cambios se hacen solo con migraciones SQL en `migrations/`.

## Comandos
- Pruebas del panel: `npm test` (usa `node --test`).
- Pruebas del servidor (cuando exista `server/`): `npm test --prefix server`.
- Una tarea solo está hecha si pasan las pruebas de lo que tocó (y las del panel, siempre).
- Ver el panel: abrir `index.html` con Live Server de VS Code, o `npx serve .`. No abrir con `file://` porque los módulos no cargan.

## Reglas de código (panel)
- Módulos ES. En todos los imports se escribe la extensión `.js`.
- Funciones pequeñas y puras en `src/domain`. La hora actual entra como parámetro `now` (un `Date`). Nunca llamar a `new Date()` dentro de la lógica.
- Pruebas con `node:test` y `node:assert/strict`, en `tests/*.test.js`.
- Tipos del contrato de datos con comentarios JSDoc.
- Textos de clientes en pantalla: solo `textContent`. Nunca `innerHTML`, `outerHTML` ni `insertAdjacentHTML`.
- CSS: variables en `src/styles/tokens.css`, móvil primero, sin `!important`.
- En `src/`: cero dependencias. Si hace falta una, parar y preguntar.

## Reglas de código (servidor y base de datos)
- Módulos ES. Importar las reglas de `src/domain`; no copiarlas.
- Todo dato que llega del cliente se valida con un esquema antes de tocar la base. Nunca confiar en lo que valida el navegador.
- Toda consulta se limita a los negocios del usuario con sesión (evita IDOR). Cada endpoint lleva una prueba de que otro negocio recibe 404.
- Nunca devolver ni registrar secretos, tokens, teléfonos completos ni el texto de los mensajes. Los errores al cliente son genéricos.
- Los secretos viven solo en variables de entorno. `.env.example` lleva nombres sin valores.
- Migraciones: numeradas, aditivas e idempotentes. Se prueban primero en el proyecto de pruebas.
- Un agente nunca ejecuta SQL contra producción ni borra datos: lo corre la persona.
- Si una tarea exige una dependencia que la spec no aprobó, parar y reportarlo.

## Estructura
```
index.html
src/
  domain/    lógica pura (sin DOM)
  mock/      datos ficticios
  services/  capa de servicio (mock y, en fase 2, apiService)
  ui/        pantallas y piezas
  styles/    CSS
server/      servidor Express (fase 2)
migrations/  SQL numerado; la base la comparte el bot
tests/       pruebas con node --test
specs/       specs, plan y tareas por feature (la 008 vive en el repo del bot)
docs/        constitución, borrador de interfaz, handoff
```

## Flujo
1. Leer `contexto.md`, `plan.md`, `docs/constitution.md` y la spec de la tarea antes de empezar.
2. Hacer una tarea a la vez. Máximo 3 archivos por tarea.
3. Correr las pruebas. Si fallan, no marcar la tarea como hecha.
4. No cambiar la spec ni las tareas. Si algo no cuadra, parar y reportarlo.
