# citas-web

Frontend React + TypeScript con Vite. Login/registro de S2 se conserva; el bloque S3 añade vistas iniciales según el rol para explorar/agendar consultas, administrar profesionales/solicitudes y definir disponibilidad.

No usar Express/BFF.

## Wiki del repositorio

`wiki/` contiene la Wiki local del frontend, mantenida por el agente frontend de Codex y enlazada con la [Wiki global](../wiki/) y la [Wiki de backend](../citas-api/wiki/). Lee primero `wiki/wiki/index.md`; documenta comportamiento solo después de verificarlo en el proyecto.

## Ejecutar localmente

Requiere Node.js compatible con Vite 8 (22.12+; el toolchain del workspace tiene como objetivo Node 24) y npm:

```powershell
npm install
npm run dev
npm run typecheck
npm run test
npm run lint
npm run build
```

Vite carga automáticamente `.env` desde `citas-web`; para crear el archivo local copia `.env.example` a `.env`. `VITE_API_URL` debe ser accesible desde el navegador y por defecto apunta a `http://localhost:8080`. `npm run build` ejecuta typecheck y build de producción.

Con el workspace raíz, `docker compose --profile dev up -d` inicia Vite en `http://localhost:5173`; abre `/login` en ese origen. El puerto `8080` es únicamente la API. El frontend sirve `/favicon.svg` como icono del sitio.

`npm run build` ejecuta `tsc -b` y el build Vite. `npm run test` ejecuta Vitest con React Testing Library; cubre los formularios Login/Register, la guarda de rol y selección de slot. La vista conectada a la API requiere una cuenta autenticada y, para mostrar disponibilidad, datos existentes; el flujo UI completo de reserva aún no cuenta con evidencia browser.
