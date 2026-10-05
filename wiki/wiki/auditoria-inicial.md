# Auditoría inicial frontend S3/S4

**Fecha:** 2026-10-04 · **Mantenida por:** agente de Codex.

## Evidencia de línea base

Comandos ejecutados desde la raíz:

```text
npm --prefix citas-web run build
✓ built in 1.08s
npm --prefix citas-web run typecheck
tsc -b
npm --prefix citas-web run test
Test Files  1 passed (1)
Tests       4 passed (4)
npm --prefix citas-web run lint
oxlint
```

Los cuatro tests existentes son tests unitarios/componentes. No validan el viaje completo por la API ni equivalen a E2E.

La página compartida del browser estaba en `/login`, con texto de acceso heredado S2 y botón `Forgot Password ?`. `GET /login` respondió HTTP 200. El histórico de la página retuvo un `net::ERR_ABORTED` de una solicitud anterior `POST /auth/logout`; la línea base no reejecutó logout y no elimina esa incertidumbre.

## Estado de interfaz observado

Existe `AppointmentsPage` en React, cliente HTTP centralizado, provider de autenticación, rutas por rol y `SlotGrid`. La pantalla común por rol cubre partes de exploración/reserva, gestión de bloques y decisiones admin. No es el home médico de referencia: no se observó saludo/home con búsqueda, carrusel de especialidades, navegación inferior y tarjetas tipo Figma. Tampoco hay rutas/pantallas funcionales de recuperación, historial/cancelación/reprogramación o agenda/cierre. El CSS responsive actual no constituye por sí mismo una verificación visual a 390 px.

## Vacíos

- No hay suite browser autenticada para paciente/admin/profesional en esta línea base.
- No se verificó accesibilidad integral, consola limpia ni escritorio + 390×844.
- No se halló `verify` o scanner en scripts/package.json.
- No se copian capturas al wiki como evidencia de esta auditoría; la pestaña abierta solo mostró la vista de login.

La síntesis compartida y la comparación con el PRD están en la [auditoría global](../../../wiki/wiki/auditoria-inicial-mvp.md); la evidencia S3 previa vive en [evidencias frontend](evidencias-s3.md).
