# Registro de Pacientes (PWA)

App instalable (PWA) de un solo uso para registrar y editar fichas de
pacientes, con base de datos en Supabase y una función de IA que ayuda a
prellenar el formulario a partir de una foto (carnet, ficha, etc.). No tiene
login: se abre directo a la lista de pacientes.

La pantalla principal muestra por defecto los pacientes marcados como **"En
seguimiento"**; una segunda pestaña, **"Todos los pacientes"**, muestra el
listado completo, incluyendo a quienes ya no están en seguimiento activo.

Stack: React + TypeScript + Vite, Tailwind CSS, `vite-plugin-pwa`, Supabase
(Postgres con RLS), función serverless en Netlify que llama a la API de
Claude (Anthropic) para leer la imagen.

## 1. Crear el proyecto en Supabase

1. Crea un proyecto en [app.supabase.com](https://app.supabase.com).
2. Ve a **SQL Editor** y ejecuta el contenido de [`supabase/schema.sql`](./supabase/schema.sql).
   Esto crea la tabla `patients` (con el campo `in_followup`), un trigger de
   `updated_at` y las políticas de Row Level Security.
3. En **Project Settings > API**, copia el `Project URL` y el `anon public key`.

## 2. Variables de entorno

```bash
cp .env.example .env
```

Completa:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`: del paso anterior. Se usan
  en el cliente.
- `ANTHROPIC_API_KEY`: solo la usa la función serverless
  `netlify/functions/extract-patient.ts` para leer la foto del documento.
  Consíguela en [console.anthropic.com](https://console.anthropic.com/settings/keys).
  **Nunca** se expone al navegador.

## 3. Desarrollo local

```bash
npm install
npx netlify dev
```

`netlify dev` levanta Vite y las funciones serverless juntas (necesario para
poder probar "Usar foto" en local). Si solo necesitas la UI sin la función de
IA, `npm run dev` también funciona.

## 4. Deploy en Netlify

1. Sube el repositorio a GitHub (o el proveedor que uses) y conéctalo en
   [app.netlify.com](https://app.netlify.com) → "Add new site" → "Import an
   existing project".
2. Netlify detecta `netlify.toml` automáticamente (build command
   `npm run build`, publish `dist`, functions `netlify/functions`).
3. En **Site settings > Environment variables**, agrega las mismas variables
   del paso 2 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `ANTHROPIC_API_KEY`).
4. Deploy. La app queda instalable como PWA (ícono, `manifest.json` y
   service worker generados por `vite-plugin-pwa`).
5. **Recomendado**: como la app no tiene login, protege la URL con la
   contraseña de sitio de Netlify (Site settings → Sharing/Visitor access →
   "Password protection") para que solo tú puedas entrar a ver los datos de
   pacientes.

## Funcionalidad de foto

En el formulario de paciente, el botón **"Usar foto"** abre la cámara (o
selector de archivos) del dispositivo, envía la imagen a
`/.netlify/functions/extract-patient`, y esa función le pide a un modelo de
Claude con visión que extraiga nombre, documento, fecha de nacimiento, etc.
en JSON. Los campos detectados prellenan el formulario, pero **siempre deben
revisarse antes de guardar** — el modelo puede cometer errores de lectura,
especialmente con letra manuscrita o fotos de baja calidad.

## Estructura

```
src/
  components/    lista y formulario de pacientes
  lib/           cliente de Supabase
  types/         tipos de Patient
netlify/functions/
  extract-patient.ts   llama a la API de Claude para leer la foto
supabase/
  schema.sql     tabla patients + RLS
```

## Notas de seguridad

- La app no tiene autenticación: cualquiera con la URL desplegada y la anon
  key (pública en el bundle del cliente) puede leer y editar los datos de
  pacientes. Protege la URL con la contraseña de sitio de Netlify (ver paso
  4.5) o con otra capa de acceso si vas a exponerla en internet.
- La clave de Anthropic vive solo en el entorno de Netlify, nunca en el
  bundle del cliente.
