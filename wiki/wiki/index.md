# Índice de la Wiki de `citas-web`

Wiki propia del frontend, mantenida por su agente Codex y enlazada con la [Wiki global del workspace](../../../wiki/wiki/index.md) y la [Wiki de `citas-api`](../../../citas-api/wiki/wiki/index.md).

## Frontend

- [Estado del repositorio](estado-del-repositorio.md) — stack y resultado de validación.
- [Auditoría inicial S3/S4](auditoria-inicial.md) — línea base frontend y límites observados.
- [Responsabilidades y flujo de diseño](responsabilidades.md) — requisitos del cliente, Stitch/AI Studio y límites de implementación.
- [UI de autenticación](auth-ui.md) — estructura, rutas, sesión, tokens visuales y resultados de render.
- [Integración API](integracion-api.md) — reglas de integración objetivo y estado del contrato.
- [Evidencias S3](evidencias-s3.md) — pruebas frontend ejecutadas y límites verificados.
- [Log local](log.md) — registro append-only.

## Gobierno y referencias

- [Operación de Wiki](../schema/operacion.md)
- [Instrucciones Codex](../AGENTS.md)
- [Fuentes curadas](../raw/README.md)
- [Wiki global](../../../wiki/wiki/index.md)
- [Wiki backend](../../../citas-api/wiki/wiki/index.md)
- [README frontend](../../README.md)
- [PRD](../../../PRD.md)
- [Restricciones técnicas](../../../RESTRICCIONES_TECNICAS.md)
- [Prompt agente frontend](../../../prompts/agents/PROMPT_AGENT_CITAS_WEB.md)
- [Skill de diseño Stitch](../../../skills/stitch-design-to-frontend/skills/stitch-design-to-frontend/SKILL.md)

## Vacíos actuales

- El flujo se completó con Docker local/browser automatizado; browser notificó `ERR_ABORTED` en logout a pesar de la revocación persistida y un 204 en prueba directa. Falta corroborar Network con navegador no instrumentado.
- Recuperación de contraseña no está implementada; «Forgot Password ?» conserva su aviso S2.
- Flujo S3 de citas implementado parcialmente en la vista común `AppointmentsPage`, con rutas protegidas por rol; e2e autenticado aún pendiente.
- No hay archivo fuente de diseño Figma/Stitch para comparación pixel a pixel.
- No hay fuentes de diseño copiadas a `raw/`.
