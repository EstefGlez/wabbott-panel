# Plan: Wabbott Panel (hoja de ruta)

Cada spec: `/sdd-spec` → aprobar → `/sdd-plan` → aprobar → `/sdd-tasks` → aprobar → `/sdd-implement`.
Máx. 10 tareas por spec. Si salen más, dividir.

## Fase 1: interfaz con datos simulados
- [ ] 0. Preparación: repo `wabbott-panel`, copiar `contexto.md`, `plan.md`, `docs/borrador-ui.md`; `/onboard`; `/sdd-constitution`.
- [ ] 1. Spec 001: reglas del dominio, datos simulados, capa de servicio y estructura base de la interfaz.
- [ ] 2. Spec 002: bandeja de conversaciones (S2). Depende de 001.
- [ ] 3. Spec 003: conversación (S3). Depende de 001.
- [ ] 4. Spec 004: negocios y números (S4). Depende de 001.
- [ ] 5. Spec 005: fuentes de conocimiento (S5). Depende de 001.
- [ ] 6. Spec 006: inicio de sesión y avisos por correo (S1, S6). Depende de 001.
- [ ] 7. Revisión de la interfaz completa con Héctor y aprobación.
- [ ] 8. Congelar el contrato de datos y anotar los cambios en `contexto.md`.

Las specs 002 a 006 son independientes entre sí. Se pueden hacer en cualquier orden.

## Fase 2: backend (solo después de aprobar la fase 1)
- [ ] Esquema de base de datos a partir del contrato de datos.
- [ ] Login y reglas de acceso por negocio.
- [ ] Servidor del bot: enviar mensaje y cambiar atención.
- [ ] Revisor externo: plazos, seguimiento de ventana y correos de aviso.
- [ ] Fuentes reales: extraer texto de enlace, PDF, .md y TXT.
- [ ] Tiempo real en la bandeja.
