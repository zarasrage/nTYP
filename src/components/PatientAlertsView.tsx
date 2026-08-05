import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Alert, AlertType, Patient } from '../types/patient'
import { ALERT_TYPE_META, ALERT_TYPES } from '../types/patient'

interface Props {
  patient: Patient
  onBack: () => void
  onEdit: () => void
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function relativeLabel(dueDate: string) {
  const today = todayISO()
  if (dueDate === today) return 'Hoy'
  const diffDays = Math.round(
    (new Date(dueDate + 'T00:00:00').getTime() -
      new Date(today + 'T00:00:00').getTime()) /
      (1000 * 60 * 60 * 24),
  )
  if (diffDays > 0) return `En ${diffDays} día${diffDays === 1 ? '' : 's'}`
  return `Hace ${-diffDays} día${diffDays === -1 ? '' : 's'}`
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}-${m}-${y}`
}

export function PatientAlertsView({ patient, onBack, onEdit }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [type, setType] = useState<AlertType>('seguimiento')
  const [dueDate, setDueDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('patient_id', patient.id)
      .order('due_date', { ascending: true })
    if (error) setError(error.message)
    else setAlerts(data as Alert[])
    setLoading(false)
  }, [patient.id])

  useEffect(() => {
    load()
  }, [load])

  async function addAlert() {
    if (!dueDate) return
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('alerts').insert({
      patient_id: patient.id,
      type,
      due_date: dueDate,
      note: note.trim() || null,
    })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setNote('')
    await load()
  }

  async function toggleCompleted(alert: Alert) {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alert.id ? { ...a, completed: !a.completed } : a,
      ),
    )
    const { error } = await supabase
      .from('alerts')
      .update({ completed: !alert.completed })
      .eq('id', alert.id)
    if (error) {
      setError(error.message)
      await load()
    }
  }

  async function removeAlert(id: string) {
    setError(null)
    const { error } = await supabase.from('alerts').delete().eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    await load()
  }

  const pending = alerts.filter((a) => !a.completed)
  const completed = alerts.filter((a) => a.completed)
  const ordered = [...pending, ...completed]

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-sm text-teal-700 hover:underline dark:text-teal-400"
      >
        ← Volver a pacientes
      </button>

      <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {patient.full_name}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {[
              patient.rut,
              patient.age_at_accident !== null
                ? `${patient.age_at_accident} años al accidente`
                : null,
              patient.accident_date,
            ]
              .filter(Boolean)
              .join(' · ') || 'Sin datos adicionales'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                patient.in_followup
                  ? 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {patient.in_followup ? 'En seguimiento' : 'Fuera de seguimiento'}
            </span>
            {patient.hospitalized && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Hospitalizado
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onEdit}
          aria-label="Editar paciente"
          className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ✎ Editar ficha
        </button>
      </div>

      <h3 className="mt-6 mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
        Alertas
      </h3>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando alertas…</p>
      ) : ordered.length === 0 ? (
        <p className="text-sm text-slate-500">Sin alertas registradas.</p>
      ) : (
        <ul className="space-y-3">
          {ordered.map((a) => (
            <li
              key={a.id}
              className={`flex items-center gap-4 rounded-2xl border p-4 transition ${
                a.completed
                  ? 'border-slate-200 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-900/50'
                  : 'border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <button
                onClick={() => toggleCompleted(a)}
                aria-label={
                  a.completed ? 'Marcar como pendiente' : 'Marcar como completada'
                }
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-base transition ${
                  a.completed
                    ? 'border-teal-600 bg-teal-600 text-white'
                    : 'border-slate-300 text-transparent hover:border-teal-500 dark:border-slate-600'
                }`}
              >
                ✓
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium text-white ${ALERT_TYPE_META[a.type].badge}`}
                  >
                    {ALERT_TYPE_META[a.type].label}
                  </span>
                  <span
                    className={`text-sm font-medium ${a.completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}
                  >
                    {formatDate(a.due_date)} · {relativeLabel(a.due_date)}
                  </span>
                </div>
                {a.note && (
                  <p
                    className={`mt-1 text-sm ${a.completed ? 'text-slate-400 line-through' : 'text-slate-500'}`}
                  >
                    {a.note}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeAlert(a.id)}
                aria-label="Quitar alerta"
                className="shrink-0 rounded-lg px-2 py-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 p-4 sm:flex-row sm:items-end dark:border-slate-700">
        <div>
          <label className="block text-xs font-medium text-slate-500">
            Tipo
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AlertType)}
            className="mt-1 rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {ALERT_TYPES.map((t) => (
              <option key={t} value={t}>
                {ALERT_TYPE_META[t].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">
            Fecha
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-500">
            Nota (opcional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <button
          type="button"
          onClick={addAlert}
          disabled={saving}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          + Agregar alerta
        </button>
      </div>
    </div>
  )
}
