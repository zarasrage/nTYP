import { useEffect, useMemo, useState } from 'react'
import type { Alert, AlertType } from '../types/patient'
import { ALERT_TYPES } from '../types/patient'
import { ALERT_TYPE_META } from '../lib/alertMeta'
import { ArrowLeftIcon, CheckIcon } from './icons'

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
      <div className="flex flex-wrap gap-1.5 rounded-full bg-white/70 p-1.5 shadow-sm ring-1 ring-cream-200 sm:inline-flex">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === t.key
                ? 'bg-ink-900 text-cream-50 shadow-sm'
                : 'text-ink-700 hover:bg-cream-200/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!loading && filtered.length > 0 && !selectedGroup && (
        <p className="mt-4 text-sm font-medium text-ink-500">
          {totalPending === 0
            ? '¡Todo listo! No quedan alertas pendientes en esta vista.'
            : `${totalPending} pendiente${totalPending === 1 ? '' : 's'} de ${filtered.length}.`}
        </p>
      )}

      {loading ? (
        <p className="mt-8 text-sm text-ink-500">Cargando alertas…</p>
      ) : filtered.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-cream-200 bg-white/60 px-6 py-12 text-center">
          <p className="font-display text-lg text-ink-700">
            No hay alertas {tab === 'hoy' ? 'para hoy' : 'en esta vista'}
          </p>
          <p className="mt-1 text-sm text-ink-500">
            Disfruta el silencio mientras dure.
          </p>
        </div>
      ) : selectedGroup ? (
        <div className="mt-5 animate-rise-in">
          <button
            onClick={() => setSelectedType(null)}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-lime-700 hover:text-lime-800"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Volver a los tipos de alerta
          </button>
          <div className="mb-4 flex items-center gap-2.5">
            <span
              className={`grid h-9 w-9 place-items-center rounded-xl ${ALERT_TYPE_META[selectedGroup.type].solid}`}
            >
              {(() => {
                const Icon = ALERT_TYPE_META[selectedGroup.type].Icon
                return <Icon className="h-5 w-5 text-white" />
              })()}
            </span>
            <h3 className="font-display text-xl font-semibold text-ink-900">
              {ALERT_TYPE_META[selectedGroup.type].label}
            </h3>
          </div>
          <ul className="space-y-3">
            {selectedItems.map((alert) => (
              <li
                key={alert.id}
                className={`flex items-center gap-4 rounded-2xl border p-4 transition ${
                  alert.completed
                    ? 'border-cream-200 bg-white/50 opacity-60'
                    : 'border-cream-200 bg-white shadow-[0_6px_20px_-10px_rgba(36,31,22,0.25)]'
                }`}
              >
                <button
                  onClick={() => onToggleComplete(alert)}
                  aria-label={
                    alert.completed
                      ? 'Marcar como pendiente'
                      : 'Marcar como completada'
                  }
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    alert.completed
                      ? 'animate-pop border-lime-500 bg-lime-400 text-white'
                      : 'border-cream-200 text-transparent hover:border-lime-400'
                  }`}
                >
                  <CheckIcon className="h-4 w-4" />
                </button>

                <button
                  onClick={() => onSelectAlert(alert)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p
                    className={`font-semibold ${alert.completed ? 'text-ink-500 line-through' : 'text-ink-900'}`}
                  >
                    {alert.patient?.full_name ?? 'Paciente'}
                  </p>
                  <p className="text-sm text-ink-500">
                    {formatDate(alert.due_date)}
                    {alert.note ? ` — ${alert.note}` : ''}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {groups.map((group, i) => {
            const meta = ALERT_TYPE_META[group.type]
            return (
              <button
                key={group.type}
                onClick={() => setSelectedType(group.type)}
                style={{ animationDelay: `${i * 60}ms` }}
                className={`animate-rise-in flex aspect-square flex-col justify-between rounded-[28px] p-4 text-left shadow-[0_10px_28px_-14px_rgba(36,31,22,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-14px_rgba(36,31,22,0.45)] ${meta.soft} ${
                  group.pending === 0 ? 'opacity-60' : ''
                }`}
              >
                <span
                  className={`grid h-10 w-10 place-items-center rounded-2xl ${meta.solid}`}
                >
                  <meta.Icon className="h-5 w-5 text-white" />
                </span>
                <span className={`font-display text-5xl font-semibold leading-none ${meta.text}`}>
                  {group.count}
                </span>
                <span className="text-sm font-semibold text-ink-700">
                  {meta.label}
                  <span className="mt-0.5 block text-xs font-medium text-ink-500">
                    {group.pending === 0
                      ? 'Todas completadas'
                      : `${group.pending} pendiente${group.pending === 1 ? '' : 's'}`}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
