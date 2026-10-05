# Log de la Wiki frontend

Registro append-only. No constituye evidencia de que se hayan ejecutado builds, pruebas o aplicaciones.

## [2026-10-04] implement | Horario recurrente y “Mis citas”

- El frontend fija selector y formato de horas a `America/Bogota`; el test agregado recorre booking simulado y confirma estado en “Mis citas”.
- `verify` pasó con backend 26/26, build/typecheck, frontend 9/9 y secret scan.
- No se hizo reserva real en browser. Véanse [integración API](integracion-api.md) y [evidencias](evidencias-s3.md).

## [2026-10-04] diagnose | `net::ERR_FAILED` reportado en login

- Se comprobó desde la pestaña PATIENT que API en `localhost:8080` y CORS para el origen `http://127.0.0.1:5173` respondían en el momento del diagnóstico; el POST de probe con body `{}` devolvió 400 por falta de email, no por conexión.
- El `net::ERR_FAILED` original no se reprodujo y no se usaron credenciales del usuario; la causa queda abierta. El comando `docker` no estaba disponible en PowerShell para inspeccionar contenedores.
- Evidencia y límites: [evidencias S3](evidencias-s3.md).

## [2026-10-04] verify | Selector de horarios con seed local

- Con sesión PATIENT se consultó el catálogo live y el selector mostró horarios libres para Mateo después de elegir especialidad, sede y fecha.
- `.\scripts\verify.ps1` pasó con backend 22/22, frontend 8/8, build/typecheck y secret scan; `SEED_ON_START=false`.
- No se confirmó ni creó una cita. El e2e completo de booking sigue pendiente. Detalles en [evidencias frontend](evidencias-s3.md) y [backend](../../../citas-api/wiki/wiki/evidencias-s3.md).

## [2026-10-04] verify | Perfiles seed visibles para paciente

- Backend cargó una vez el seed local autorizado y dejó desactivado `SEED_ON_START`.
- Desde la sesión PATIENT se consultó la API: ocho profesionales, horarios libres para los seis nombres requeridos y home actualizado después de recargar.
- No se creó cita ni se afirma recorrido completo de booking; detalles en [evidencias frontend](evidencias-s3.md) y [backend](../../../citas-api/wiki/wiki/evidencias-s3.md).

## [2026-10-04] audit | Línea base GOAL MVP

- `npm --prefix citas-web run build`, `typecheck`, `test` y `lint` finalizaron con código cero; cuatro tests frontend pasaron.
- Browser compartido mostraba Login S2, no se ejecutó reserva autenticada. Su historial incluye un logout previo `ERR_ABORTED`, aún sin revalidar.
- Confirmados portal S3 parcial y ausencia de pantallas/servicios S4 y del home médico nuevo.
- Añadida [auditoría inicial frontend](auditoria-inicial.md) y referencias a la Wiki global.

## [2026-10-04] test | Runner local sin Git

- El runner compartido ejecutó build/typecheck, Vitest (4/4) y scanner PASS después de Maven 21/21.
- verify se detuvo por test intencionalmente roto (exit 1); el escenario de fixture ficticio también falló en el scanner de verify; después de restaurar/eliminar, una ejecución completa pasó.
- Sin flujo browser de citas autenticado; no se marca A4/S3 Done por esta verificación.

## [2026-10-04] test | Verificación tras Red→Green de disponibilidad

- Después de la corrección backend para slots de 60 minutos, `verify` completo pasó: 22 backend, build/typecheck, 4 tests frontend y secret scan.
- No se cambiaron estilos ni pantallas en este bloque; la experiencia autenticada sigue sin probar.

## [2026-10-04] ingest | Estado inicial de frontend

- Revisados README, prompt frontend, restricciones y estructura del repo.
- Confirmado estado de plantilla; no se encontró framework elegido, aplicación ni diseño aprobado/importado.
- Registrado flujo de diseño e integración como requisito, no como funcionalidad existente.
- Enlazada esta Wiki con la global y la Wiki de API; fuentes permanecen en su ubicación original.

## [2026-10-04] learn | Selección React para sesión 2

- El usuario eligió React para cumplir el objetivo de registro/login y UI de la sesión; la Wiki previa dejaba React/Angular sin decidir.
- Se usará Vite según la instrucción explícita del usuario, salvo incompatibilidad descubierta al inicializar.
- Diseño de login descrito por el usuario: canvas 1440×900, proporción de panel aproximada 60/40, fondo y gradiente especificados, Poppins, formulario con inputs subrayados; el registro reutilizará el lenguaje visual.
- No se encontró un archivo de diseño exportado de Figma/Stitch; la especificación de la solicitud es la referencia disponible.
- Este registro precede a la implementación; no afirma que haya pantallas ni flujo funcional.

## [2026-10-04] ingest | Frontend de autenticación implementado

- Inicializado React + TypeScript con Vite 8; estructura, rutas login/register/dashboard, contexto, cliente REST y campos reutilizables implementados.
- Poppins queda empaquetado localmente; iconos Lucide, layouts responsive y tokens visuales detallados en `auth-ui.md`.
- `npm run build` pasó después de corregir TS1294 en `ApiError`; `npm run lint` pasó.
- Inspección browser: login a 1440×900 con panel 861×900, formulario x≈939/y=132/429 px, email y=305, password y=418 y botón y=577/429×53; register a 390×844 oculta panel y cabe en viewport.
- No se ejecutaron pruebas de integración/e2e contra API; Java/Maven siguen ausentes en PATH.
- Se documentó que Forgot Password es solo un aviso y que tokens del ejercicio se guardan en Web Storage según Remember me.

## [2026-10-04] lint | Separación para Fast Refresh

- Durante la inspección del servidor Vite se observó que el módulo de contexto exportaba un componente y un hook, lo que invalida Fast Refresh y provoca recargas completas en cambios de desarrollo.
- Se separará el provider, el contexto y el hook en módulos con responsabilidades distintas; la validación de build/lint se repetirá después del ajuste.

## [2026-10-04] lint | Validación tras separar auth

- Separados `AuthProvider`, `AuthContext` y `useAuth` en módulos distintos.
- `npm run build`, `npm run lint` y diagnósticos del editor pasan tras el ajuste.
- Vite volvió a arrancar sin advertencia al inicio; el navegador recibió HTTP 200 en `/login` y `/dashboard` sin sesión redirigió a `/login`.
- No se volvió a modificar un módulo durante el servidor para forzar un evento HMR; el comportamiento al guardar no se probó directamente.

## [2026-10-04] lint | Verificación final del frontend

- Repetidos `npm run build --prefix .\\citas-web` y `npm run lint --prefix .\\citas-web`; ambos finalizaron correctamente.
- La ejecución no prueba el backend ni el flujo end-to-end, que siguen bloqueados por la ausencia de Java, Maven y Docker en PATH.

## [2026-10-04] lint | Favicon y arranque en Compose

- Compose perfil `dev` ahora ejecuta `npm ci` y Vite en `0.0.0.0:5173`, con volumen aislado de dependencias Linux.
- Añadido favicon SVG y enlace en `index.html`; actualizado README e integración API para separar el origen web (5173) del API (8080).
- El arranque con Docker y el flujo e2e permanecen sin verificar; Docker CLI no está disponible en PATH.

## [2026-10-04] lint | Plantilla de entorno Vite

- Añadido `.env.example` local con `VITE_API_URL` para el origen API accesible desde browser; README ahora indica crear `.env` a partir de la plantilla.
- Verificado sin mostrar valores que el `.env` local apunta a `localhost:8080`, igual que la configuración de Compose para browser.
- Build/lint previos continúan siendo la última validación de código; el API no se pudo probar.

## [2026-10-04] lint | Corrección y prueba e2e en Docker (agente Codex)

- Se mejoró el manejo de fallos `TypeError` de fetch: la UI informa que no logra conectar al origen `VITE_API_URL` y recomienda revisar servicio, red o CORS, en lugar de mostrar solo `Failed to fetch`.
- Se completó en browser registro → login → dashboard protegido → regreso a login. No se capturaron errores de consola; `npm run build` y `npm run lint` pasaron.
- Browser automation notificó `net::ERR_ABORTED` en POST logout; refresh de la cuenta de prueba quedó revocado en DB y el endpoint directo responde 204. Se registra la discrepancia como incertidumbre pendiente de revisar en Network de browser no instrumentado.
- URL API en el browser es `http://localhost:8080`; `VITE_API_URL` se aplica al proceso Vite en Compose y en builds Vite de producción se sustituye al compilar.

## [2026-10-04] implement | Portal de citas S3 (agente Codex)

- Añadidas rutas por rol y portal de paciente para filtrar profesionales, consultar slots y reservar; portal ADMIN para profesionales/asignaciones y decisiones; portal PROFESSIONAL para CRUD de bloques propios.
- Se amplió el tipo de sesión con el rol de `/auth/me` y se centralizaron tokens visuales manteniendo la pantalla de login existente.
- El servicio API frontend ahora describe catálogos, profesionales, availability, booking, citas y decisiones. Contrato contrastado con la Wiki API; falta el recorrido autenticado e2e.
- Añadidos Vitest/Testing Library y tests de formularios Login/Register, guarda de rol y SlotGrid.
- `npm run build`, `npm run typecheck`, `npm run test` (4 tests) y `npm run lint` pasan.
- El browser sin sesión redirigió `/admin` a `/login`; esto no prueba operaciones con datos del seed. No se declara A4/A6 completo; detalles en [evidencias S3](evidencias-s3.md).

## [2026-10-04] test | Home de paciente y verify

- Añadido `PatientHome` con datos del cliente API existente; no se inventan tarifas/calificaciones ausentes del contrato.
- El verify posterior pasó con build/typecheck y tests frontend 6/6, backend 22/22 y scanner.
- Se confirmó y reinició Vite que servía un `App.tsx` viejo. El home apareció en browser con respuestas sintéticas, no en una sesión real de API/seed.
- Capturas de prueba en estado `Loading…` eliminadas; no se afirma evidencia visual 390 px/escritorio ni E2E completo.

## [2026-10-04] fix | CORS para loopback frontend

- Diagnóstico: API estaba arriba (`/auth/me` anónimo devolvió 401 esperado), pero CORS preflight desde `127.0.0.1:5173` devolvía 403; `localhost:5173` sí recibía 200.
- Compose dev ahora añade `http://127.0.0.1:5173` a los orígenes configurados, además del host localhost habitual.
- Se recreó solo el servicio API. El preflight ahora da 200 desde ambos orígenes y el navegador recibe el 401 de autenticación esperado en `/auth/me`, no un error de red/CORS; no se eliminaron volúmenes.

## [2026-10-04] fix | Token en solicitudes de catálogo

- Corregido `AppointmentsPage.load`: `GET /api/catalog/specialties` y `GET /api/catalog/sites` ahora reciben el access token de la sesión.
- Añadidas pruebas del cliente para verificar el header Bearer en las dos solicitudes.
- Tests frontend 8/8, typecheck y build pasaron; la ejecución completa de `verify` queda registrada en la evidencia del frontend/backend.
- `verify` completo pasó: backend 22/22, build/typecheck frontend, tests 8/8 y secret scan. El proceso Vite servía un módulo viejo; se reinició el servicio web y se comprobó que los módulos actuales pasen `accessToken` a ambas llamadas de catálogo.
