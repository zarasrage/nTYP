import { useMemo, useState } from 'react'
import type { Alert } from '../types/patient'
import { ALERT_TYPE_META } from '../types/patient'

interface Props {
  alerts: Alert[]
  loading: boolean
  onSelectAlert: (alert: Alert) => void
  onToggleComplete: (alert: Alert) => void
}

type Tab = 'hoy' | 'semana' | 'mes' | 'historicas'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function addDaysISO(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function endOfMonthISO() {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return d.toISOString().slice(0, 10)
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}-${m}-${y}`
}

export function AlertsPanel({
  alerts,
  loading,
  onSelectAlert,
  onToggleComplete,
}: Props) {
  const [tab, setTab] = useState<Tab>('hoy')

  const today = todayISO()
  const weekEnd = addDaysISO(7)
  const monthEnd = endOfMonthISO()

  const filtered = useMemo(() => {
    let list: Alert[]
    switch (tab) {
      case 'hoy':
        list = alerts.filter((a) => a.due_date === today)
        break
      case 'semana':
        list = alerts.filter((a) => a.due_date >= today && a.due_date <= weekEnd)
        break
      case 'mes':
        list = alerts.filter((a) => a.due_date >= today && a.due_date <= monthEnd)
        break
      case 'historicas':
        list = alerts.filter((a) => a.due_date < today)
        break
    }
    return [...list].sort((a, b) =>
      a.completed === b.completed ? 0 : a.completed ? 1 : -1,
    )
  }, [alerts, tab, today, weekEnd, monthEnd])

  const pendingCount = filtered.filter((a) => !a.completed).length

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'hoy', label: 'Hoy' },
    { key: 'semana', label: 'Semana' },
    { key: 'mes', label: 'Mes' },
    { key: 'historicas', label: 'Históricas' },
  ]

  return (
    <div>
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === t.key
                ? 'border-teal-700 text-teal-700 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="mt-3 text-sm text-slate-500">
          {pendingCount === 0
            ? '¡Todo listo! No quedan alertas pendientes en esta vista.'
            : `${pendingCount} pendiente${pendingCount === 1 ? '' : 's'} de ${filtered.length}.`}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-slate-500">Cargando alertas…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">
          No hay alertas {tab === 'hoy' ? 'para hoy' : `en esta vista`}.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {filtered.map((alert) => (
            <div
              key={alert.id}
              className={`relative flex aspect-square flex-col justify-between rounded-2xl p-4 text-white shadow-sm transition ${ALERT_TYPE_META[alert.type].badge} ${
                alert.completed ? 'opacity-40' : ''
              }`}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleComplete(alert)
                }}
                aria-label={
                  alert.completed
                    ? 'Marcar como pendiente'
                    : 'Marcar como completada'
                }
                className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 text-base transition ${
                  alert.completed ? 'bg-white text-teal-700' : 'text-transparent'
                }`}
              >
                ✓
              </button>

              <button
                onClick={() => onSelectAlert(alert)}
                className="flex flex-1 flex-col justify-between text-left"
              >
                <span className="pr-8 text-xs font-semibold uppercase tracking-wide opacity-90">
                  {ALERT_TYPE_META[alert.type].label}
                </span>
                <span
                  className={`line-clamp-3 text-base font-semibold ${alert.completed ? 'line-through' : ''}`}
                >
                  {alert.patient?.full_name ?? 'Paciente'}
                </span>
                <span className="text-sm opacity-90">
                  {formatDate(alert.due_date)}
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
