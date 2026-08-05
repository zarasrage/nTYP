import { useEffect, useMemo, useState } from 'react'
import type { Alert, AlertType } from '../types/patient'
import { ALERT_TYPE_META, ALERT_TYPES } from '../types/patient'

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
  const [selectedType, setSelectedType] = useState<AlertType | null>(null)

  useEffect(() => {
    setSelectedType(null)
  }, [tab])

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

  const groups = useMemo(() => {
    return ALERT_TYPES.map((type) => {
      const items = filtered.filter((a) => a.type === type)
      return {
        type,
        items,
        count: items.length,
        pending: items.filter((a) => !a.completed).length,
      }
    }).filter((g) => g.count > 0)
  }, [filtered])

  const totalPending = filtered.filter((a) => !a.completed).length

  const selectedGroup = groups.find((g) => g.type === selectedType) ?? null
  const selectedItems = selectedGroup
    ? [...selectedGroup.items].sort((a, b) =>
        a.completed === b.completed ? 0 : a.completed ? 1 : -1,
      )
    : []

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

      {!loading && filtered.length > 0 && !selectedGroup && (
        <p className="mt-3 text-sm text-slate-500">
          {totalPending === 0
            ? '¡Todo listo! No quedan alertas pendientes en esta vista.'
            : `${totalPending} pendiente${totalPending === 1 ? '' : 's'} de ${filtered.length}.`}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-slate-500">Cargando alertas…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">
          No hay alertas {tab === 'hoy' ? 'para hoy' : `en esta vista`}.
        </p>
      ) : selectedGroup ? (
        <div className="mt-4">
          <button
            onClick={() => setSelectedType(null)}
            className="mb-3 text-sm text-teal-700 hover:underline dark:text-teal-400"
          >
            ← Volver a los tipos de alerta
          </button>
          <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
            {ALERT_TYPE_META[selectedGroup.type].label}
          </h3>
          <ul className="space-y-3">
            {selectedItems.map((alert) => (
              <li
                key={alert.id}
                className={`flex items-center gap-4 rounded-2xl border p-4 transition ${
                  alert.completed
                    ? 'border-slate-200 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-900/50'
                    : 'border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <button
                  onClick={() => onToggleComplete(alert)}
                  aria-label={
                    alert.completed
                      ? 'Marcar como pendiente'
                      : 'Marcar como completada'
                  }
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-base transition ${
                    alert.completed
                      ? 'border-teal-600 bg-teal-600 text-white'
                      : 'border-slate-300 text-transparent hover:border-teal-500 dark:border-slate-600'
                  }`}
                >
                  ✓
                </button>

                <button
                  onClick={() => onSelectAlert(alert)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p
                    className={`font-medium ${alert.completed ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-slate-100'}`}
                  >
                    {alert.patient?.full_name ?? 'Paciente'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDate(alert.due_date)}
                    {alert.note ? ` — ${alert.note}` : ''}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {groups.map((group) => (
            <button
              key={group.type}
              onClick={() => setSelectedType(group.type)}
              className={`flex aspect-square flex-col justify-between rounded-2xl p-4 text-left text-white shadow-sm transition hover:brightness-110 ${ALERT_TYPE_META[group.type].badge} ${
                group.pending === 0 ? 'opacity-50' : ''
              }`}
            >
              <span className="text-sm font-semibold uppercase tracking-wide opacity-90">
                {ALERT_TYPE_META[group.type].label}
              </span>
              <span className="text-5xl font-bold leading-none">
                {group.count}
              </span>
              <span className="text-sm opacity-90">
                {group.pending === 0
                  ? 'Todas completadas'
                  : `${group.pending} pendiente${group.pending === 1 ? '' : 's'}`}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
