# Evidencias S3 frontend

Ejecución local registrada el 2026-10-04. El trabajo y esta Wiki se mantienen por el agente de **Codex**, conforme a [instrucciones locales](../AGENTS.md).

## Comandos ejecutados

Desde `citas-web`:

```text
npm run build
> tsc -b && vite build
✓ built in 625ms

npm run typecheck
> tsc -b

npm run test
Test Files  1 passed (1)
Tests       4 passed (4)

npm run lint
> oxlint
```

Los cuatro tests comprueban presentación de los campos/aviso de login, validación de confirmación de contraseña, redirección de rol hacia `/patient` desde una ruta `/admin` y selección/estado del slot en `SlotGrid`.

## Smoke browser / HTTP

- La ruta protegida `/admin` sin sesión acabó redirigiendo a `/login` en el browser local.
- El servidor Vite respondió HTTP 200 al GET de `/patient` (documento SPA); no implica autorización browser ni consulta exitosa de datos.
- API: `curl.exe -sS -i --max-time 15 http://127.0.0.1:8080/auth/me` devolvió HTTP 401 y `{"status":401,"message":"Authentication required"}` sin token.
- No se ejecutó un flujo autenticado de agendamiento en navegador ni comprobación visual de todos los roles con datos del seed.

## Límites

Estas comprobaciones no satisfacen el e2e de S3, los estados de UI con API viva por rol, la validación completa de accesibilidad/responsive, ni la red A6 con hook y escaneo de secretos. El login S2 se mantuvo con sus tokens visuales; no se afirma una regresión visual de pixel-diff.

## Verificación local sin Git — 2026-10-04

El nuevo `.\scripts\verify.ps1` ejecutó las verificaciones compartidas: la última pasada completó Maven 22/22, build/typecheck, Vitest 4/4 y scanner en PASS. La prueba de una aserción rota y el fixture ficticio hicieron fallar el mismo comando; al restaurar/eliminar ambos, verify devolvió 0. Las salidas reproducibles están en [evidencias backend](../../../citas-api/wiki/wiki/evidencias-s3.md). No se instaló hook Git ni se inicializó Git.

## Diagnóstico de error de conexión/CORS — 2026-10-04

La API Compose estaba ejecutándose. `GET http://localhost:8080/auth/me` respondió `401 {"status":401,"message":"Authentication required"}`, que es la respuesta esperada sin JWT. El preflight desde `http://localhost:5173` respondía 200, pero desde `http://127.0.0.1:5173` respondía 403 `Invalid CORS request`. Se actualizó el perfil de desarrollo Compose para aceptar ambos orígenes, sin cambiar la URL base del API ni borrar volúmenes.

Después de recrear solo el contenedor API, los preflight `OPTIONS` con `Origin: http://localhost:5173` y `Origin: http://127.0.0.1:5173` respondieron 200 e incluyeron el `Access-Control-Allow-Origin` correspondiente. Desde una pestaña automatizada abierta en `http://127.0.0.1:5173/login`, un `fetch` a `/auth/me` se completó y devolvió el 401 JSON esperado; dejó de fallar por CORS/red. No se probó login con credenciales ni la carga autenticada de las vistas.

## Corrección de catálogo sin access token — 2026-10-04

Al reportarse `Failed to load resource: 401` para `localhost:8080/api/catalog/specialties`, se rastreó la carga del portal: Spring Security exige autenticación para `/api/**`, pero `appointmentApi.specialties()` y `appointmentApi.sites()` estaban invocando sus endpoints sin pasar el token. `AppointmentsPage.load` ya leía el token para otras consultas, así que ahora lo entrega también a ambas llamadas. Se añadieron pruebas de cliente que verifican el encabezado `Authorization: Bearer test-access-token` para ambas rutas.

Validación después del cambio:

```text
Tests       8 passed (8)
typecheck: exit 0
✓ built in 725ms
```

Las pruebas de cliente validan que el token se envía; no se registró una sesión con credenciales del usuario ni se declara un E2E autenticado.

El `verify` completo posterior terminó con esta salida resumida:

```text
Tests run: 22, Failures: 0, Errors: 0, Skipped: 0
[PASS] Backend tests
[PASS] Frontend production build
[PASS] Frontend typecheck
Tests  8 passed (8)
[PASS] Frontend tests
Secret scan passed; no configured secret patterns found.
[PASS] Secret scan
All local verification checks passed.
```

Durante la comprobación se observó que el proceso Vite activo aún servía la versión anterior del módulo API. Se reinició solo `citas-web-dev` y se confirmó que los módulos transformados servidos ahora invocan ambas rutas de catálogo con `accessToken`. Vite respondió HTTP 200 en `/login`. No se inspeccionó una sesión autenticada del usuario ni se probó un login real.

## Seed local y consulta de horarios — 2026-10-04

Tras actualizar el seed backend y con autorización del usuario se ejecutó una carga única en MySQL local; la evidencia completa y la configuración protegida están en [evidencias backend](../../../citas-api/wiki/wiki/evidencias-s3.md). Con la sesión PATIENT existente, la API devolvió ocho profesionales. Se consultó disponibilidad por API para cada uno de los seis nombres solicitados: todos tuvieron slots abiertos para una especialidad/sede asignada. En la UI, “Ver todo” abrió la lista de profesionales que contiene los seis nombres; al seleccionar a Mateo, Medicina General, sede Norte y una fecha, el selector mostró horarios libres. No se confirmó ni creó una cita. `SEED_ON_START` quedó en `false` después de la carga; no se borró el volumen.

## Verificación final del workspace — 2026-10-04

Después de la carga, `.\scripts\verify.ps1` volvió a pasar con 22/22 pruebas backend, build/typecheck frontend, 8/8 pruebas frontend y secret scan. Con la sesión PATIENT, el selector de horarios mostró opciones tras escoger a Mateo, especialidad, sede y fecha. Esto comprueba la consulta de horarios desde la UI, pero no la selección final ni el envío de una reserva; el e2e completo sigue pendiente. No se creó cita.

## Inicio de paciente: validación de código y browser — 2026-10-04

`PatientHome` se añadió a la vista de citas para PATIENT. La implementación usa nombre del `/auth/me`, catálogo y profesionales disponibles desde el cliente API; no inventa tarifas ni calificaciones, y muestra que la disponibilidad se consulta al agendar. Los tests frontend cubren render del inicio, filtro/búsqueda y navegación del componente, junto con las pruebas previas.

Después del cambio, `.\scripts\verify.ps1` pasó con backend 22/22, build frontend, typecheck, 6/6 tests y secret scan. Un smoke visual en el browser compartido sí mostró saludo, especialidades, profesionales y barra de navegación usando datos sintéticos interceptados; esto no valida API autenticada ni el flujo de citas. Al reiniciar Vite para que cargara el módulo actual, el browser anterior dejó de estar disponible. Una pestaña nueva carecía de credenciales y recibió 401. Las dos capturas intentadas registraron solo `Loading…`; se eliminaron para no presentarlas como evidencia. No hay capturas válidas guardadas, pixel-diff, verificación de consola limpia, ni comprobación visual concluyente a 390 px y escritorio. El E2E autenticado permanece pendiente.

## Horario Bogotá y cita visible en “Mis citas” — 2026-10-04

- `AppointmentsPage` convierte los límites de fecha del selector a la hora de Colombia y formatea slots/citas en `America/Bogota`; `PatientHome` usa la misma zona para mostrar la próxima cita.
- Un test frontend con API simulada recorre selección de profesional, especialidad, sede, fecha, slot y confirmación. Al reconsultar `GET /api/appointments/mine`, el tab “Citas” muestra el nombre del profesional, sede y estado `REQUESTED`.
- La integración backend correspondiente reserva en una regla recurrente y comprueba que `/api/appointments/mine` devuelve la cita; la evidencia está en [backend](../../../citas-api/wiki/wiki/evidencias-s3.md).
- Verificación completa: backend 26/26, build/typecheck, frontend 9/9 y secret scan PASS. No se completó un booking real en browser; el test web no consulta la DB live.

## Diagnóstico de `net::ERR_FAILED` en login — 2026-10-04

Desde la pestaña compartida en `http://127.0.0.1:5173/patient`, el probe `GET http://localhost:8080/auth/me` respondió `401` con JSON, consistente con la ruta protegida sin token. El preflight `OPTIONS /auth/login` con origen `http://127.0.0.1:5173`, método POST y header `content-type` respondió `200` e incluyó `Access-Control-Allow-Origin` para ese origen. Un `fetch` real del browser a `POST /auth/login` usando intencionalmente `{}` llegó al API y respondió `400 {"status":400,"message":"email: must not be blank"}`; el error HTTP 400 que apareció en la consola fue causado por ese probe sin campos y no prueba un fallo de autenticación. El `net::ERR_FAILED` reportado inicialmente no se reprodujo durante estas comprobaciones. No se probaron credenciales del usuario; por tanto, no se determina la causa histórica ni se afirma que un login válido se haya completado. En esta sesión `docker` no estuvo disponible como comando PowerShell, así que no se inspeccionó el estado de los contenedores.
