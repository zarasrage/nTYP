# Registro de Pacientes (PWA)

App instalable (PWA) de un solo uso para registrar y editar fichas de
pacientes en seguimiento por traumatología, con base de datos en Supabase y
una función de IA que ayuda a prellenar nombre/RUT/sexo a partir de una foto
de documento. No tiene login: se abre directo al panel de alertas.

**Pantalla de inicio — Alertas**: cuadrados con las alertas (seguimiento,
curación, control, cultivos/biopsia) de cada paciente, con pestañas Hoy /
Semana / Mes / Históricas. Click en una alerta abre la ficha del paciente.
Las alertas pueden tener una hora opcional y avisar por notificación push 1
hora antes (ver [Notificaciones](#notificaciones)).

**Sección Pacientes**: pestañas "En seguimiento" y "Todos los pacientes".
Cada ficha tiene RUT, sexo, edad y fecha del accidente, diagnóstico inicial
y evolutivo (con lateralidad Der/Izq/Bilateral y texto libre), cirugías,
condición hospitalizado/ambulatorio, seguimiento sí/no, y sus alertas. El
selector de diagnósticos sale de un catálogo administrable desde "Gestionar
diagnósticos" (dentro de Pacientes), sin tocar código.

Stack: React + TypeScript + Vite, Tailwind CSS, `vite-plugin-pwa`, Supabase
(Postgres con RLS), función serverless en Netlify que llama a la API de
Claude (Anthropic) para leer la imagen.

## 1. Crear el proyecto en Supabase

1. Crea un proyecto en [app.supabase.com](https://app.supabase.com).
2. Ve a **SQL Editor** y ejecuta el contenido de [`supabase/schema.sql`](./supabase/schema.sql).
   Esto crea las tablas `patients`, `alerts` y `diagnosis_catalog` (con el
   catálogo inicial de diagnósticos ya cargado), el trigger de `updated_at`
   y las políticas de Row Level Security.
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
- `VITE_VAPID_PUBLIC_KEY` / `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` /
  `VAPID_SUBJECT`: para las notificaciones push (ver sección
  [Notificaciones](#notificaciones) más abajo).

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
   `ANTHROPIC_API_KEY`, `VITE_VAPID_PUBLIC_KEY`, `VAPID_PUBLIC_KEY`,
   `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).
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
Claude con visión que extraiga nombre, RUT y sexo desde un documento de
identidad, en JSON. Los campos detectados prellenan el formulario, pero
**siempre deben revisarse antes de guardar** — el modelo puede cometer
errores de lectura, especialmente con fotos de baja calidad.

## Notificaciones

Notificaciones push (Web Push) para avisar 1 hora antes de una alerta que
tenga hora asignada. Requiere iOS 16.4+ con la app instalada en la pantalla
de inicio (o cualquier navegador de escritorio/Android moderno). No tiene
costo ni requiere cuenta de Apple Developer: usa el protocolo estándar Web
Push, que Apple soporta gratis para apps instaladas como PWA.

**Cómo funciona:**

1. Cada alerta puede tener una hora opcional (`due_time`) además de la
   fecha. Si no tiene hora, no genera notificación.
2. Desde **Ajustes** (ícono de campana en el header) cada persona activa las
   notificaciones en su propio dispositivo. Eso pide permiso al navegador y
   guarda una suscripción push en la tabla `push_subscriptions`.
3. La función programada `netlify/functions/send-alert-notifications.ts`
   corre cada 5 minutos (Netlify Scheduled Functions), revisa qué alertas
   vencen dentro de la próxima hora y no han sido notificadas, y les envía
   un push a todos los dispositivos suscritos usando la librería `web-push`
   con las claves VAPID.
4. El service worker (`public/push-sw.js`) recibe el push y muestra la
   notificación del sistema, incluso con la app cerrada.

**Configurar las claves VAPID** (una sola vez, no tiene costo):

```bash
npx web-push generate-vapid-keys --json
```

Copia `publicKey` a `VITE_VAPID_PUBLIC_KEY` y `VAPID_PUBLIC_KEY` (mismo
valor en ambas), y `privateKey` a `VAPID_PRIVATE_KEY`. `VAPID_SUBJECT` es un
`mailto:` con un correo de contacto (lo exige el estándar, no envía
correos). Agrega las 4 variables en tu `.env` local y en Netlify (Site
settings → Environment variables).

Netlify Scheduled Functions y el volumen de envíos de este proyecto (dos
dispositivos, alertas puntuales) están muy por debajo de los límites del
plan gratuito de Netlify y Supabase.

## Estructura

```
src/
  components/
    AlertsPanel.tsx        panel de alertas (inicio)
    PatientList.tsx        lista de pacientes (En seguimiento / Todos)
    PatientForm.tsx        alta/edición de paciente
    PatientAlerts.tsx      alertas de un paciente
    DiagnosisListEditor.tsx  diagnóstico inicial/evolutivo (lista + lateralidad)
    SurgeriesEditor.tsx    lista de cirugías
    DiagnosisAdmin.tsx     administrar catálogo de diagnósticos
    NotificationSettings.tsx  activar/desactivar notificaciones push
    SegmentedToggle.tsx    toggle Sí/No / Hospitalizado-Ambulatorio
  lib/
    supabaseClient.ts  cliente de Supabase
    push.ts            suscripción/desuscripción a notificaciones push
  types/         tipos de Patient, Alert, catálogo
public/
  push-sw.js     maneja los eventos push / notificationclick del service worker
netlify/functions/
  extract-patient.ts            llama a la API de Claude para leer la foto
  send-alert-notifications.ts   función programada: envía notificaciones push
supabase/
  schema.sql     tablas patients, alerts, diagnosis_catalog, push_subscriptions + RLS
```

## Notas de seguridad

- La app no tiene autenticación: cualquiera con la URL desplegada y la anon
  key (pública en el bundle del cliente) puede leer y editar los datos de
  pacientes. Protege la URL con la contraseña de sitio de Netlify (ver paso
  4.5) o con otra capa de acceso si vas a exponerla en internet.
- La clave de Anthropic vive solo en el entorno de Netlify, nunca en el
  bundle del cliente.
