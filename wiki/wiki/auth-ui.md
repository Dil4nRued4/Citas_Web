# Interfaz de autenticación

## Estado

React + TypeScript implementado. Los bounds medidos en el navegador para `/login` a viewport 1440×900 coinciden con la referencia:

| Elemento | Bounds observados |
|---|---|
| Panel izquierdo | x=0, y=0, 861×900 |
| Texto del panel | x≈150, y=144, ancho 460 |
| Área del formulario | x≈939, y=132, ancho 429 |
| Campo Email | x≈939, y=305, ancho 429 |
| Campo Password | x≈939, y=418, ancho 429 |
| Botón Login | x≈939, y=577, 429×53 |

En 390×844 el panel de bienvenida se oculta y Register cabe dentro de la pantalla. La evidencia es inspección del render del navegador; no existe captura Figma/Stitch fuente para comparación pixel diff.

## Estructura

- `src/App.tsx`: BrowserRouter y rutas.
- `src/auth/AuthProvider.tsx`: provider de sesión, restauración y refresh compartido.
- `src/auth/auth-context.ts`: contexto y tipo de sesión.
- `src/auth/useAuth.ts`: hook para consumir el contexto.
- `src/services/api.ts`: cliente REST centralizado, errores `ApiError`, almacenamiento de tokens.
- `src/components/AuthLayout.tsx`: layout de dos paneles reutilizable.
- `src/components/FormField.tsx`: input con icono y control de revelar contraseña.
- `src/components/ProtectedRoute.tsx`: control de sesión.
- `src/components/SlotGrid.tsx`: grilla accesible de horarios libres que delega selección al flujo de reserva.
- `src/pages/LoginPage.tsx`, `RegisterPage.tsx`: pantallas de sesión. `DashboardPage.tsx` permanece como componente S2, pero ya no está asignada a una ruta en `App.tsx`.
- `src/pages/AppointmentsPage.tsx` y `appointments.css`: portal de citas, con contenido diferenciado según el rol API.
- `src/auth.css`: estilos de autenticación responsive; `src/index.css`: base y tokens.

## Rutas

- `/login`: formulario Email/Password, Remember me, aviso para recuperación aún no implementada y enlace a `/register`.
- `/register`: Name, Email, Password y Confirm password; compara ambas contraseñas en cliente y tras registrar lleva a Login.
- `/admin`, `/professional`, `/patient`: vistas protegidas por rol; un rol diferente redirige a su propia ruta.
- `/dashboard` y `/`: tras autenticar, derivan al home correspondiente al rol; sin sesión, `/dashboard` redirige a Login y `/` vuelve al guard.

## Sesión y API

`VITE_API_URL` define el origen REST; si no se establece, cliente usa `http://localhost:8080`. `authApi` consume el contrato documentado por la [Wiki de backend](../../../citas-api/wiki/wiki/contrato-auth.md).

- El access token se envía como `Authorization: Bearer …`.
- Remember me seleccionado guarda el par access/refresh en `localStorage`; deseleccionado usa `sessionStorage`.
- Al abrir una sesión, se prueba `/auth/me`; ante 401 intenta rotar refresh y guardar los nuevos tokens. Varios intentos concurrentes de restauración comparten una llamada refresh.
- Logout llama `/auth/logout` y siempre borra la sesión local; si el servidor falla, la UI presenta el error.
- El registro no inicia sesión automáticamente; devuelve a Login con confirmación.
- Errores no-2xx muestran `message` del backend o el status HTTP.

El almacenamiento web es legible por JavaScript y por ello queda expuesto a XSS; esta decisión satisface el requisito de token enviado por cliente para el ejercicio, no sustituye una evaluación de seguridad de producción.

## Tokens visuales

- Fuente local empaquetada: Poppins weights 300, 400, 500, 600, 700 (`@fontsource/poppins`, latin y latin-ext).
- Canvas: `#FFFEFC`.
- Acento: `#FF432A`.
- Panel: `linear-gradient(135deg, rgba(255, 89, 0, .5), rgba(115, 115, 115, .5))`.
- Grid desktop: panel izquierdo 59.7917% (861 px de 1440), panel derecho el resto.
- Formulario desktop: 429 px; título 30/500; campos label 13/500, texto 16/400; botón 429×53, radio 32 px, sombra `0 4px 26px rgba(0,0,0,.25)`.
- A ≤760 px, layout pasa a panel único; panel gradiente se oculta.
- Tokens CSS compartidos: `--accent`, `--canvas`, `--brand-gradient`, `--primary-shadow` en `src/index.css`. El portal de citas conserva Poppins y utiliza tarjetas, badges con texto, grilla responsive y foco visible.

## Ejecutar / construir

Desde `citas-web`: `npm install`, `npm run dev`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run lint`. `npm run build` ejecuta `tsc -b` seguido de Vite. Configurar `VITE_API_URL` en el entorno o en un archivo local ignorado por Git; `.env.example` es solo plantilla.

## Integración verificada (2026-10-04)

Browser completó registro, login, llegada al dashboard protegido y regreso a login tras logout. No se capturaron errores de consola en la última ejecución. La herramienta reportó `net::ERR_ABORTED` en POST `/auth/logout`; la cuenta sí quedó con refresh revocado en DB, y el endpoint directo devuelve 204. No se puede confirmar si fue cancelación del browser/harness o respuesta interrumpida; verificar Network en navegador no instrumentado.

`src/services/api.ts` transforma `TypeError` de fetch en `ApiError` con mensaje que incluye el origen de API y sugiere revisar disponibilidad, red o CORS. Los errores HTTP conservan el mensaje JSON del backend.

## Límites

- «Forgot Password ?» solo enseña el aviso de que recuperación aún no está disponible.
- Los tests de UI son unitarios/componentes, no sustituyen una prueba browser de reserva autenticada.
- La evidencia es de ejecución local; no constituye validación de producción o compatibilidad entre navegadores. Véase [estado](estado-del-repositorio.md) y [integración](integracion-api.md).
