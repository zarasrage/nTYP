import { useEffect, useState } from 'react'
import {
  disableNotifications,
  enableNotifications,
  getCurrentSubscription,
  isPushSupported,
  isStandalone,
} from '../lib/push'
import { ArrowLeftIcon, BellIcon } from './icons'
import { SegmentedToggle } from './SegmentedToggle'

interface Props {
  onBack: () => void
}

type Status = 'checking' | 'unsupported' | 'not-installed' | 'ready'

export function NotificationSettings({ onBack }: Props) {
  const [status, setStatus] = useState<Status>('checking')
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function check() {
      if (!isPushSupported()) {
        setStatus('unsupported')
        return
      }
      if (!isStandalone()) {
        setStatus('not-installed')
        return
      }
      const subscription = await getCurrentSubscription()
      setEnabled(!!subscription)
      setStatus('ready')
    }
    check()
  }, [])

  async function handleToggle(next: boolean) {
    setBusy(true)
    setError(null)
    try {
      if (next) {
        await enableNotifications()
      } else {
        await disableNotifications()
      }
      setEnabled(next)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo actualizar el estado de las notificaciones.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-lime-700 hover:text-lime-800"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Volver
      </button>

      <h2 className="mb-1 font-display text-xl font-semibold text-ink-900">Ajustes</h2>
      <p className="mb-6 text-sm text-ink-500">
        Configuración de notificaciones para este dispositivo.
      </p>

      <div className="rounded-3xl border border-cream-200 bg-white/70 p-5">
        <div className="flex items-start gap-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-lime-100 text-lime-700">
            <BellIcon className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-ink-900">Notificaciones de alertas</p>
            <p className="mt-0.5 text-sm text-ink-500">
              Si una alerta tiene hora asignada, avisa 1 hora antes en este
              dispositivo.
            </p>
          </div>
        </div>

        <div className="mt-4">
          {status === 'checking' && (
            <p className="text-sm text-ink-500">Comprobando…</p>
          )}

          {status === 'unsupported' && (
            <p className="rounded-2xl bg-cream-100 px-4 py-3 text-sm text-ink-700">
              Este navegador no soporta notificaciones push.
            </p>
          )}

          {status === 'not-installed' && (
            <p className="rounded-2xl bg-cream-100 px-4 py-3 text-sm text-ink-700">
              Para activar notificaciones primero agrega esta app a la
              pantalla de inicio (compartir → "Añadir a pantalla de inicio")
              y ábrela desde ahí.
            </p>
          )}

          {status === 'ready' && (
            <>
              <SegmentedToggle
                value={enabled}
                onChange={handleToggle}
                falseLabel="Desactivadas"
                trueLabel="Activadas"
              />
              {busy && <p className="mt-2 text-sm text-ink-500">Actualizando…</p>}
              {error && <p className="mt-2 text-sm text-blossom-600">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
