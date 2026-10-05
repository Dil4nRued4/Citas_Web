# Integración API

## Contrato objetivo

El PRD exige que el frontend consuma directamente la API REST/JSON de Spring Boot; las restricciones dicen sin Express/BFF y URL backend configurable por environment. El [prompt frontend](../../../prompts/agents/PROMPT_AGENT_CITAS_WEB.md) asigna la coordinación de cambios de contrato al orquestador.

## Estado verificado

Se creó un cliente HTTP compartido en `src/services/api.ts`, con URL base `VITE_API_URL` (por defecto `http://localhost:8080`), bearer token, parsing de errores JSON y mensajes de status. El contexto implementa login, registro, recuperación de sesión mediante refresh y logout. Si `fetch` lanza `TypeError` de red, `ApiError` muestra la URL API e indica revisar disponibilidad, conectividad o CORS, en lugar de dejar solo `Failed to fetch`. En Compose `dev`, CORS acepta el frontend con `localhost:5173` o `127.0.0.1:5173`; el origen debe agregarse explícitamente al configurar otro host/puerto. El selector y el formateo de las fechas/horas clínicas usan `America/Bogota`, independientemente de la zona horaria del dispositivo.

El archivo local `.env` de Vite define `VITE_API_URL`; la plantilla versionable está en `.env.example`. En Compose esta variable se entrega al proceso Vite. En builds Vite de producción, los valores `VITE_*` se sustituyen al compilar; no son configuración runtime del browser. El valor debe ser una URL visible desde el navegador (en desarrollo local, `http://localhost:8080`), no el hostname interno `citas-api-dev` de la red Docker. Si cambia entorno del servicio, reiniciar/recrear Vite para aplicar configuración.

Los endpoints y cuerpos concretos verificados están descritos en el [contrato backend](../../../citas-api/wiki/wiki/contrato-auth.md); la ejecución se hizo contra API/MySQL del Compose local.

Para ejecutar ambos servicios con Compose, desde la raíz use `docker compose --profile dev up -d`; abra `http://localhost:5173/login` y consulte `docker compose --profile dev logs -f citas-api-dev citas-web-dev`. El puerto 8080 es REST. La causa raíz inicial fue que contenedores antiguos ejecutaban `tail -f /dev/null`, sin servidor HTTP; al recrear la API también apareció validación fallida por `token_hash CHAR(64)` de Flyway frente a Hibernate `VARCHAR(64)`. Se corrigió alineando el mapeo JPA al esquema existente. Detalles y probes en [infraestructura global](../../../wiki/wiki/infraestructura-y-herramientas.md) y [contrato backend](../../../citas-api/wiki/wiki/contrato-auth.md).

Browser completó registro → login → dashboard protegido → regreso a login y no capturó errores de consola. La herramienta reportó `net::ERR_ABORTED` en POST logout, pero refresh quedó revocado en DB y una llamada directa del endpoint devuelve 204. No se puede determinar con evidencia actual si es cancelación de browser/harness o interrupción de respuesta; se documenta como incertidumbre. El frontend incluye `/favicon.svg`; el 404 previo de `favicon.ico` no explica el fallo de registro.

## Sincronización

Cuando se apruebe o cambie el contrato:

1. Verificar endpoints del backend en la [Wiki API](../../../citas-api/wiki/wiki/index.md) y código fuente.
2. Actualizar la implementación y esta página desde el repo web.
3. Enlazar el contrato y cambio desde ambas Wikis locales.
4. Actualizar la síntesis de la [Wiki global](../../../wiki/wiki/index.md) con fuente verificable.
5. Registrar pruebas de integración ejecutadas, sin atribuir evidencia no existente. El flujo se completó en browser automatizado; el evento Network de logout queda explícitamente pendiente de corroboración.

## S3 — integración implementada parcialmente

El servicio REST compartido de `src/services/api.ts` ahora expone tipos y llamadas para catálogo de especialidades/sedes, listado de profesionales, disponibilidad propia, slots, reserva, citas propias, decisión admin y CRUD de perfiles profesionales/disponibilidad. Los roles se obtienen del `User` devuelto por `/auth/me`; `ProtectedRoute` bloquea vistas ADMIN/PROFESSIONAL/PATIENT fuera de su rol. Todos los endpoints `/api/**`, incluidos `GET /api/catalog/specialties` y `GET /api/catalog/sites`, requieren sesión; las funciones del cliente reciben el access token y envían `Authorization: Bearer ...`.

La API se contrastó con el código Spring y las pruebas de integración dirigidas pasan. Los contratos endpoint por endpoint, roles, bloques fechados y horarios semanales están en [Wiki API, contrato de citas](../../../citas-api/wiki/wiki/contrato-citas.md). El horario recurrente local seeded es lunes–viernes, 07:00–16:00 Colombia para los ocho profesionales; el frontend consulta los slots por fecha/sede/especialidad. Tras una reserva exitosa, la vista vuelve a cargar `GET /api/appointments/mine` y la sección “Mis citas” renderiza la lista con estado. Tests frontend ahora recorren booking con API simulada y comprueban la cita `REQUESTED`; la prueba backend verifica `/mine` con una cita `APPROVED`. No se creó una cita real en browser. Vea [evidencias S3](evidencias-s3.md).

La vista de administración recibe IDs de usuarios existentes al crear perfil profesional. No existe endpoint de alta/gestión de cuentas ni CRUD del catálogo de especialidades/EPS/planes en el backend actual.
