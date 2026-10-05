# Estado de `citas-web`

## Hecho verificado

El 2026-10-04 se comprobó el workspace con `scripts/verify.ps1`: la última pasada Maven 26/26, build, typecheck, Vitest 9/9 y scanner local terminaron en PASS. verify falló con una aserción temporalmente rota y con un secreto ficticio, y pasó después de restaurar/eliminar. Este runner no es un hook Git; detalles en la [evidencia backend](../../../citas-api/wiki/wiki/evidencias-s3.md).

La aplicación React + TypeScript usa Vite y rutas `/login`, `/register`, `/admin`, `/professional`, `/patient` y `/dashboard` (ésta redirige según rol). Se añadió `PatientHome` para la ruta de paciente con saludo, búsqueda, catálogo, tarjetas de profesionales y navegación inferior. Build, typecheck y nueve tests frontend pasaron; uno recorre el booking simulado y confirma que “Mis citas” presenta el estado devuelto por la API. El selector y el formateo de fechas usan `America/Bogota`. El servicio Compose usa Node 24. El provider, contexto y hook están separados para Fast Refresh.

Se validaron visualmente Login a 1440×900 y Register en viewport móvil 390×844. Los bounds observados para login coinciden con las coordenadas de referencia principales. Durante diagnóstico posterior el navegador completó registro → login → dashboard protegido → regreso a login; no capturó errores de consola en la última pasada. La herramienta notificó `net::ERR_ABORTED` en POST logout pese a revocación confirmada en DB; estado Network pendiente de corroborar en browser no instrumentado.

## Stack adoptado

React 19, React Router DOM 7, Vite 8, TypeScript 6, `lucide-react` y `@fontsource/poppins`; consultar `package.json` y lockfile para versiones exactas. El proyecto se construyó con Node 22.20 disponible en este entorno; el objetivo de toolchain general del workspace sigue siendo Node 24.

La integración usa REST directo a `citas-api`, URL configurable por `VITE_API_URL`, sin Express/BFF. La API local respondió 401 sin credenciales en `/auth/me` y el browser redirigió `/admin` sin sesión a `/login`; no se completó flujo autenticado de citas. Esto no equivale a validar producción.

El perfil Compose `dev` ejecuta Vite con host `0.0.0.0` en el contenedor y publica el frontend en `localhost:5173`; la API está en el puerto separado `8080`. La página declara un favicon SVG servido por Vite.

La síntesis cross-repo está en [Wiki global](../../../wiki/wiki/index.md); la API tiene su [Wiki propia](../../../citas-api/wiki/wiki/index.md).

## Pendiente / incertidumbre

- Browser automation reportó `ERR_ABORTED` durante el POST de logout aunque el flujo regresó a login y el servidor registró revocación; confirmar status HTTP en Network de navegador no instrumentado.
- La evidencia es de Docker local y browser automatizado; no certifica despliegue ni compatibilidad entre navegadores.
- "Forgot Password ?" solo muestra aviso; no hay flujo de recuperación.
- Portal S3 ofrece búsqueda/slots/citas para PATIENT, CRUD de perfil/asignaciones para ADMIN y edición de bloques fechados para PROFESSIONAL. El horario semanal seeded se puede editar solo en código/seed; no existe UI de edición semanal. El test del booking usa API simulada y no reemplaza un E2E con API autenticada.
- El home de paciente se observó en browser con respuestas sintéticas, pero no se generó evidencia de imagen válida: los intentos posteriores capturaron un estado de carga y se descartaron. No se declara pixel-match ni revisión visual concluyente de 390 px/escritorio.
- UI admin requiere el ID de un usuario existente para crear su perfil profesional; el API no expone administración de cuentas.
- No hay CRUD frontend/backend de EPS, planes ni catálogo de especialidades.
- Tests de navegador E2E con API autenticada/seed todavía no ejecutados.
- Diseño fielmente implementado desde la especificación textual de la tarea; no se encontró archivo de exportación Figma/Stitch para comparación visual pixel a pixel.
