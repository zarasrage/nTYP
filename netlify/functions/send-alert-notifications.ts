import { schedule } from '@netlify/functions'
import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const NOTIFY_WINDOW_MS = 60 * 60 * 1000 // avisar 1 hora antes

const ALERT_LABELS: Record<string, string> = {
  seguimiento: 'Seguimiento',
  curacion: 'Curación',
  control: 'Control',
  cultivos_biopsia: 'Cultivos / biopsia',
}

interface AlertRow {
  id: string
  type: string
  due_date: string
  due_time: string
  note: string | null
  patient: { full_name: string } | null
}

interface SubscriptionRow {
  endpoint: string
  p256dh: string
  auth: string
}

function chileDateString(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(date)
}

function chileOffsetMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago',
    timeZoneName: 'shortOffset',
  }).formatToParts(date)
  const tzName = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT-4'
  const match = tzName.match(/GMT([+-]\d+)/)
  const hours = match ? Number(match[1]) : -4
  return hours * 60
}

function chileDateTimeToUTC(dueDate: string, dueTime: string): Date {
  const naiveUTC = new Date(`${dueDate}T${dueTime}Z`)
  const offsetMin = chileOffsetMinutes(naiveUTC)
  return new Date(naiveUTC.getTime() - offsetMin * 60_000)
}

const alertNotificationHandler: Handler = async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT

  if (!supabaseUrl || !supabaseKey || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    console.error('send-alert-notifications: faltan variables de entorno.')
    return { statusCode: 500, body: JSON.stringify({ error: 'Faltan variables de entorno.' }) }
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
  const supabase = createClient(supabaseUrl, supabaseKey)

  const now = new Date()
  const today = chileDateString(now)
  const tomorrow = chileDateString(new Date(now.getTime() + 24 * 60 * 60 * 1000))

  const { data: alerts, error: alertsError } = await supabase
    .from('alerts')
    .select('id, type, due_date, due_time, note, patient:patients(full_name)')
    .in('due_date', [today, tomorrow])
    .not('due_time', 'is', null)
    .eq('completed', false)
    .is('notified_at', null)

  if (alertsError) {
    console.error('send-alert-notifications: error al leer alertas', alertsError)
    return { statusCode: 500, body: JSON.stringify({ error: alertsError.message }) }
  }

  const dueAlerts = ((alerts ?? []) as unknown as AlertRow[]).filter((alert) => {
    const dueAt = chileDateTimeToUTC(alert.due_date, alert.due_time).getTime()
    const remaining = dueAt - now.getTime()
    return remaining > 0 && remaining <= NOTIFY_WINDOW_MS
  })

  if (dueAlerts.length === 0) {
    return { statusCode: 200, body: JSON.stringify({ sent: 0 }) }
  }

  const { data: subscriptions, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')

  if (subsError) {
    console.error('send-alert-notifications: error al leer suscripciones', subsError)
    return { statusCode: 500, body: JSON.stringify({ error: subsError.message }) }
  }

  let sent = 0

  for (const alert of dueAlerts) {
    const label = ALERT_LABELS[alert.type] ?? alert.type
    const payload = JSON.stringify({
      title: `${label} — ${alert.patient?.full_name ?? 'Paciente'}`,
      body: `Hoy a las ${alert.due_time.slice(0, 5)}${alert.note ? ` · ${alert.note}` : ''}`,
      url: '/',
    })

    for (const sub of (subscriptions ?? []) as SubscriptionRow[]) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
        sent += 1
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        } else {
          console.error('send-alert-notifications: error al enviar push', err)
        }
      }
    }

    await supabase
      .from('alerts')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', alert.id)
  }

  return { statusCode: 200, body: JSON.stringify({ sent }) }
}

export const handler = schedule('*/5 * * * *', alertNotificationHandler)
