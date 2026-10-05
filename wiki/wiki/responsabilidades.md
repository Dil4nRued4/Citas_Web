# Responsabilidades y flujo de diseño

El [prompt del agente frontend](../../../prompts/agents/PROMPT_AGENT_CITAS_WEB.md), las restricciones y el README asignan a `citas-web` la implementación exclusiva de la interfaz. La lógica de negocio y su autoridad corresponden a backend; el frontend consume `citas-api` directamente por REST.

## Flujo especificado

1. Detectar el stack real; no cambiar framework por preferencia del agente.
2. Prototipar con la Skill Stitch, obtener aprobación explícita y seguir el handoff a Google AI Studio.
3. Para este workspace, el stack seleccionado explícitamente es React + TypeScript/Vite; no sustituirlo por Angular.
4. Reconciliar implementación con diseño aprobado.
5. Implementar formularios, estados de UI, autorización de rutas, errores, accesibilidad y pruebas según HU/criterios aprobados.
6. Validar build/typecheck/tests existentes y aceptación.

El [estado actual](estado-del-repositorio.md) registra lo construido y las verificaciones. En esta sesión, el usuario proporcionó una especificación de diseño textual y eligió explícitamente React. No se encontró un archivo de diseño exportado de Figma/Stitch.

Para alcance de pantallas, estructura, tokens de diseño y estado del recorrido, consulta [UI de autenticación](auth-ui.md).

## Restricciones

- No Express ni BFF.
- No duplicar reglas de negocio en cliente como autoridad.
- URL API configurable por entorno; no hardcodear tokens/secretos.
- No editar backend desde el agente web. Cambios de contrato se elevan al orquestador.

La [Wiki global](../../../wiki/wiki/index.md) conserva acuerdos compartidos y la [Wiki API](../../../citas-api/wiki/wiki/index.md) documenta estado/contrato del servidor.
