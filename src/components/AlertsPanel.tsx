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

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const WEEKDAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

function getWorkWeekDays(): string[] {
  const now = new Date()
  const mondayOffset = (now.getDay() + 6) % 7 // 0 = lunes
  const monday = new Date(now)
  monday.setDate(now.getDate() - mondayOffset)

  const days: string[] = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(toISO(d))
  }
  return days
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}-${m}-${y}`
}

function formatTime(time: string) {
  return time.slice(0, 5)
}

function formatDateLong(iso: string) {
  const [y, m, d] = iso.split('-')
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ]
  return `${Number(d)} de ${months[Number(m) - 1]} de ${y}`
}

interface CalendarCell {
  date: string
  day: number
}

function getMonthCells(): (CalendarCell | null)[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (firstDay.getDay() + 6) % 7 // 0 = lunes

  const cells: (CalendarCell | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      day: d,
    })
  }
  return cells
}

function AlertRow({
  alert,
  onSelectAlert,
  onToggleComplete,
}: {
  alert: Alert
  onSelectAlert: (alert: Alert) => void
  onToggleComplete: (alert: Alert) => void
}) {
  const meta = ALERT_TYPE_META[alert.type]
  return (
    <li
      className={`flex items-center gap-4 rounded-2xl border p-4 transition ${
        alert.completed
          ? 'border-cream-200 bg-white/50 opacity-60'
          : 'border-cream-200 bg-white shadow-[0_6px_20px_-10px_rgba(36,31,22,0.25)]'
      }`}
    >
      <button
        onClick={() => onToggleComplete(alert)}
        aria-label={alert.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition ${
          alert.completed
            ? 'animate-pop border-lime-500 bg-lime-400 text-white'
            : 'border-cream-200 text-transparent hover:border-lime-400'
        }`}
      >
        <CheckIcon className="h-4 w-4" />
      </button>

      <button onClick={() => onSelectAlert(alert)} className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold text-white ${meta.solid}`}
          >
            <meta.Icon className="h-3 w-3" />
            {meta.label}
          </span>
          <p
            className={`font-semibold ${alert.completed ? 'text-ink-500 line-through' : 'text-ink-900'}`}
          >
            {alert.patient?.full_name ?? 'Paciente'}
          </p>
        </div>
        <p className="mt-1 text-sm text-ink-500">
          {formatDate(alert.due_date)}
          {alert.due_time ? ` · ${formatTime(alert.due_time)}` : ''}
          {alert.note ? ` — ${alert.note}` : ''}
        </p>
      </button>
    </li>
  )
}

export function AlertsPanel({
  alerts,
  loading,
  onSelectAlert,
  onToggleComplete,
}: Props) {
  const [tab, setTab] = useState<Tab>('hoy')
  const [selectedType, setSelectedType] = useState<AlertType | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [weekSelection, setWeekSelection] = useState<{ date: string; type: AlertType } | null>(
    null,
  )

  useEffect(() => {
    setSelectedType(null)
    setSelectedDate(null)
    setWeekSelection(null)
  }, [tab])

  const today = todayISO()

  const filtered = useMemo(() => {
    switch (tab) {
      case 'hoy':
        return alerts.filter((a) => a.due_date === today)
      case 'semana':
      case 'mes':
        return []
      case 'historicas':
        return alerts.filter((a) => a.due_date < today)
    }
  }, [alerts, tab, today])

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

  const monthCells = useMemo(() => getMonthCells(), [])
  const weekDays = useMemo(() => getWorkWeekDays(), [])
  const alertsByDate = useMemo(() => {
    const map = new Map<string, Alert[]>()
    for (const a of alerts) {
      const list = map.get(a.due_date)
      if (list) list.push(a)
      else map.set(a.due_date, [a])
    }
    return map
  }, [alerts])

  const dayAlerts = selectedDate
    ? [...(alertsByDate.get(selectedDate) ?? [])].sort((a, b) =>
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

      {tab === 'semana' ? (
        weekSelection ? (
          <div className="mt-5 animate-rise-in">
            <button
              onClick={() => setWeekSelection(null)}
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-lime-700 hover:text-lime-800"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Volver a la semana
            </button>
            <div className="mb-4 flex items-center gap-2.5">
              <span
                className={`grid h-9 w-9 place-items-center rounded-xl ${ALERT_TYPE_META[weekSelection.type].solid}`}
              >
                {(() => {
                  const Icon = ALERT_TYPE_META[weekSelection.type].Icon
                  return <Icon className="h-5 w-5 text-white" />
                })()}
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold text-ink-900">
                  {ALERT_TYPE_META[weekSelection.type].label}
                </h3>
                <p className="text-sm text-ink-500">{formatDate(weekSelection.date)}</p>
              </div>
            </div>
            <ul className="space-y-3">
              {(alertsByDate.get(weekSelection.date) ?? [])
                .filter((a) => a.type === weekSelection.type)
                .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))
                .map((alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    onSelectAlert={onSelectAlert}
                    onToggleComplete={onToggleComplete}
                  />
                ))}
            </ul>
          </div>
        ) : (
          <div className="mt-5 animate-rise-in">
            {weekDays.every((d) => (alertsByDate.get(d) ?? []).length === 0) ? (
              <div className="rounded-3xl border border-dashed border-cream-200 bg-white/60 px-6 py-12 text-center">
                <p className="font-display text-lg text-ink-700">
                  No hay alertas esta semana
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  Disfruta el silencio mientras dure.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-cream-200 rounded-3xl border border-cream-200 bg-white/60">
                {weekDays.map((date, i) => {
                  const items = alertsByDate.get(date) ?? []
                  const dayGroups = ALERT_TYPES.map((type) => ({
                    type,
                    items: items.filter((a) => a.type === type),
                  })).filter((g) => g.items.length > 0)
                  const isToday = date === today
                  return (
                    <div key={date} className="p-4">
                      <div className="mb-3 flex items-baseline gap-2">
                        <h4
                          className={`font-display text-lg font-semibold ${isToday ? 'text-lime-700' : 'text-ink-900'}`}
                        >
                          {WEEKDAY_NAMES[i]}
                        </h4>
                        <span className="text-sm text-ink-500">{formatDate(date)}</span>
                        {isToday && (
                          <span className="rounded-full bg-lime-100 px-2 py-0.5 text-xs font-semibold text-lime-700">
                            Hoy
                          </span>
                        )}
                      </div>
                      {dayGroups.length === 0 ? (
                        <p className="text-sm text-ink-500">Sin alertas.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2.5">
                          {dayGroups.map((g) => {
                            const meta = ALERT_TYPE_META[g.type]
                            return (
                              <button
                                key={g.type}
                                onClick={() => setWeekSelection({ date, type: g.type })}
                                className={`flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-2xl transition hover:-translate-y-0.5 ${meta.soft}`}
                              >
                                <meta.Icon className={`h-4 w-4 ${meta.text}`} />
                                <span className={`font-display text-xl font-bold leading-none ${meta.text}`}>
                                  {g.items.length}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      ) : tab === 'mes' ? (
        selectedDate ? (
          <div className="mt-5 animate-rise-in">
            <button
              onClick={() => setSelectedDate(null)}
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-lime-700 hover:text-lime-800"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Volver al calendario
            </button>
            <h3 className="mb-4 font-display text-xl font-semibold capitalize text-ink-900">
              {formatDateLong(selectedDate)}
            </h3>
            {dayAlerts.length === 0 ? (
              <p className="text-sm text-ink-500">Sin alertas ese día.</p>
            ) : (
              <ul className="space-y-3">
                {dayAlerts.map((alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    onSelectAlert={onSelectAlert}
                    onToggleComplete={onToggleComplete}
                  />
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="mt-5 animate-rise-in">
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-ink-500 sm:gap-2">
              {WEEKDAY_LABELS.map((label, i) => (
                <span key={i}>{label}</span>
              ))}
            </div>
            <div className="mt-1.5 grid grid-cols-7 gap-1.5 sm:gap-2">
              {monthCells.map((cell, i) => {
                if (!cell) return <div key={`empty-${i}`} />
                const dayItems = alertsByDate.get(cell.date) ?? []
                const count = dayItems.length
                const types = [...new Set(dayItems.map((a) => a.type))]
                const isToday = cell.date === today

                return (
                  <button
                    key={cell.date}
                    onClick={() => count > 0 && setSelectedDate(cell.date)}
                    disabled={count === 0}
                    className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl border p-1 transition ${
                      count > 0
                        ? 'border-cream-200 bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md'
                        : 'border-transparent'
                    } ${isToday ? 'ring-2 ring-lime-400' : ''}`}
                  >
                    <span className="text-[10px] font-semibold text-ink-500">
                      {cell.day}
                    </span>
                    {count > 0 && (
                      <>
                        <span className="font-display text-lg font-bold leading-none text-ink-900">
                          {count}
                        </span>
                        <span className="flex gap-0.5">
                          {types.map((t) => (
                            <span
                              key={t}
                              className={`h-1.5 w-1.5 rounded-[2px] ${ALERT_TYPE_META[t].solid}`}
                            />
                          ))}
                        </span>
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      ) : (
        <>
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
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    onSelectAlert={onSelectAlert}
                    onToggleComplete={onToggleComplete}
                  />
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
                    <span className={`grid h-10 w-10 place-items-center rounded-2xl ${meta.solid}`}>
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
        </>
      )}
    </div>
  )
}
