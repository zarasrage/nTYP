import { useMemo, useState } from 'react'
import type { Alert } from '../types/patient'
import { ALERT_TYPE_META } from '../types/patient'

interface Props {
  alerts: Alert[]
  loading: boolean
  onSelectAlert: (alert: Alert) => void
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

export function AlertsPanel({ alerts, loading, onSelectAlert }: Props) {
  const [tab, setTab] = useState<Tab>('hoy')

  const today = todayISO()
  const weekEnd = addDaysISO(7)
  const monthEnd = endOfMonthISO()

  const filtered = useMemo(() => {
    switch (tab) {
      case 'hoy':
        return alerts.filter((a) => a.due_date === today)
      case 'semana':
        return alerts.filter((a) => a.due_date >= today && a.due_date <= weekEnd)
      case 'mes':
        return alerts.filter((a) => a.due_date >= today && a.due_date <= monthEnd)
      case 'historicas':
        return alerts.filter((a) => a.due_date < today)
    }
  }, [alerts, tab, today, weekEnd, monthEnd])

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

      {loading ? (
        <p className="mt-8 text-sm text-slate-500">Cargando alertas…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">
          No hay alertas {tab === 'hoy' ? 'para hoy' : `en esta vista`}.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((alert) => (
            <button
              key={alert.id}
              onClick={() => onSelectAlert(alert)}
              className={`flex aspect-square flex-col justify-between rounded-xl p-3 text-left text-white shadow-sm transition hover:brightness-110 ${ALERT_TYPE_META[alert.type].badge}`}
            >
              <span className="text-xs font-semibold uppercase tracking-wide opacity-90">
                {ALERT_TYPE_META[alert.type].label}
              </span>
              <span className="line-clamp-3 text-sm font-medium">
                {alert.patient?.full_name ?? 'Paciente'}
              </span>
              <span className="text-xs opacity-90">
                {formatDate(alert.due_date)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
