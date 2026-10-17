# Plan: Wabbott Panel (hoja de ruta)

Cada spec: `/sdd-spec` → aprobar → `/sdd-plan` → aprobar → `/sdd-tasks` → aprobar → `/sdd-implement`.
Máx. 10 tareas por spec. Si salen más, dividir.

## Fase 1: interfaz con datos simulados
- [ ] 0. Chore: cambiar al stack HTML/CSS/JS, nueva constitución y AGENTS.md. Rama `chore/stack-vanilla`.
- [ ] 1. Spec 001: reglas del dominio y datos simulados (RF-1 a RF-27). Spec y tareas ya escritas.
- [ ] 2. Spec 002: estructura base, diseño adaptable y navegación. Depende de 001.
- [ ] 3. Spec 003: bandeja de conversaciones (S2). Depende de 001 y 002.
- [ ] 4. Spec 004: conversación (S3). Depende de 001 y 002.
- [ ] 5. Spec 005: negocios y números (S4). Depende de 001 y 002.
- [ ] 6. Spec 006: fuentes de conocimiento (S5). Depende de 001 y 002.
- [ ] 7. Spec 007: inicio de sesión y avisos por correo (S1, S6). Depende de 001 y 002.
- [ ] 8. Revisión de la interfaz completa con Héctor y aprobación.
- [ ] 9. Congelar el contrato de datos y anotar los cambios en `contexto.md`.

Las specs 003 a 007 son independientes entre sí.

## Fase 2: backend (solo después de aprobar la fase 1)
- [ ] Esquema de base de datos a partir del contrato de datos.
- [ ] Login y reglas de acceso por negocio.
- [ ] Servidor del bot: enviar mensaje y cambiar atención.
- [ ] Revisor externo: plazos, seguimiento de ventana y correos de aviso.
- [ ] Fuentes reales: extraer texto de enlace, PDF, .md y TXT.
- [ ] Tiempo real en la bandeja.
