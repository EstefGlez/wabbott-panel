# Constitución del Proyecto Wabbott Panel

1. **Spec-first**: todo cambio nace de `/sdd-spec` → `/sdd-plan` → `/sdd-tasks` → `/sdd-implement`. Nada se implementa sin spec aprobada.
2. **Stack simple**: HTML, CSS y JavaScript con módulos ES. Sin frameworks, sin TypeScript, sin Tailwind y sin paso de compilación. Cero dependencias de ejecución. Las herramientas de desarrollo son solo las de Node (`node --test`) y las que se aprueben por escrito.
3. **Arquitectura con fronteras**: la lógica pura vive en `src/domain` (sin DOM; la hora actual entra siempre como parámetro). Los datos ficticios viven en `src/mock`. La interfaz solo lee y escribe datos a través de `src/services`. La interfaz vive en `src/ui`.
4. **Tests**: la lógica pura y el servicio simulado se prueban con `node --test` (`npm test`). La interfaz se valida en navegador a 360, 390 y 1280 px. Una tarea no está hecha si `npm test` falla.
5. **Datos y seguridad**: solo datos ficticios. Ningún secreto, token ni dato real en el navegador. Los textos de clientes se insertan con `textContent`, nunca como HTML.
6. **Idioma**: textos de interfaz en español de México; nombres de variables, funciones y archivos en inglés.
