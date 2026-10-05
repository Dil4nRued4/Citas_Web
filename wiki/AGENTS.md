# Instrucciones para la Wiki de `citas-web`

Esta Wiki contiene conocimiento duradero y específico del frontend. La mantiene el agente frontend de **Codex**. Lee primero [`wiki/index.md`](wiki/index.md), luego consulta la [Wiki global](../../wiki/wiki/index.md) y la [Wiki API](../../citas-api/wiki/wiki/index.md) para contexto e integración.

## Capas

- `raw/`: fuentes locales curadas, inmutables; actualmente las fuentes de diseño/documentación se enlazan desde su ubicación original.
- `wiki/`: estado del cliente, stack real elegido, diseño aprobado, pantallas/estados, integración REST, decisiones y pruebas, solo cuando se verifiquen.
- `schema/`: reglas y operaciones de esta Wiki.
- Mantener `wiki/index.md` como catálogo e `wiki/log.md` append-only.
- Enlazar la Wiki global y la de API; reflejar cross-repo conclusiones de contrato en ambas páginas locales y pedir al orquestador que actualice la síntesis global.

## Evidencia y privacidad

Distinguir HECHO VERIFICADO, REQUISITO ESPECIFICADO, DECISIÓN APROBADA, PREFERENCIA y PREGUNTA ABIERTA. No asumir React o Angular antes de inspeccionar proyecto importado. Un diseño o requisito de pantalla no implica UI implementada.

No registrar `.env`, credenciales, tokens, información personal ni transcripciones. No modificar fuentes durante ingest. No inventar stack, componentes, pruebas ni contrato.

Después de cambios frontend sustanciales, actualizar las páginas locales y log; al cambiar contrato REST, coordinar verificación con backend y síntesis global.
