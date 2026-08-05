import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Alert, AlertType, Patient } from '../types/patient'
import { ALERT_TYPES } from '../types/patient'
import { ALERT_TYPE_META } from '../lib/alertMeta'
import { inputClass } from '../lib/formStyles'
import { ArrowLeftIcon, CheckIcon, PencilIcon, PlusIcon, TrashIcon } from './icons'

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

const AVATAR_STYLES = [
  'bg-lime-100 text-lime-700',
  'bg-blossom-100 text-blossom-600',
  'bg-lavender-100 text-lavender-700',
  'bg-peach-100 text-peach-700',
]

function avatarStyle(name: string) {
  const sum = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_STYLES[sum % AVATAR_STYLES.length]
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
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-lime-700 hover:text-lime-800"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Volver a pacientes
      </button>

      <div className="flex items-start justify-between gap-3 rounded-3xl border border-cream-200 bg-white p-5 shadow-[0_10px_28px_-16px_rgba(36,31,22,0.35)]">
        <div className="flex items-start gap-3.5">
          <span
            className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl font-display text-2xl font-semibold ${avatarStyle(patient.full_name)}`}
          >
            {patient.full_name.trim().charAt(0).toUpperCase() || '?'}
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-900">
              {patient.full_name}
            </h2>
            <p className="mt-0.5 text-sm text-ink-500">
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
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  patient.in_followup
                    ? 'bg-lime-100 text-lime-700'
                    : 'bg-cream-200 text-ink-500'
                }`}
              >
                {patient.in_followup ? 'En seguimiento' : 'Fuera de seguimiento'}
              </span>
              {patient.hospitalized && (
                <span className="rounded-full bg-lavender-100 px-2.5 py-0.5 text-xs font-semibold text-lavender-700">
                  Hospitalizado
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onEdit}
          aria-label="Editar paciente"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cream-200 text-ink-500 transition hover:bg-cream-100 hover:text-lime-700"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
      </div>

      <h3 className="mb-3 mt-6 font-display text-xl font-semibold text-ink-900">
        Alertas
      </h3>

      {error && <p className="mb-3 text-sm text-blossom-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-ink-500">Cargando alertas…</p>
      ) : ordered.length === 0 ? (
        <p className="text-sm text-ink-500">Sin alertas registradas.</p>
      ) : (
        <ul className="space-y-3">
          {ordered.map((a) => {
            const meta = ALERT_TYPE_META[a.type]
            return (
              <li
                key={a.id}
                className={`flex items-center gap-4 rounded-2xl border p-4 transition ${
                  a.completed
                    ? 'border-cream-200 bg-white/50 opacity-60'
                    : 'border-cream-200 bg-white shadow-[0_6px_20px_-12px_rgba(36,31,22,0.3)]'
                }`}
              >
                <button
                  onClick={() => toggleCompleted(a)}
                  aria-label={
                    a.completed ? 'Marcar como pendiente' : 'Marcar como completada'
                  }
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    a.completed
                      ? 'animate-pop border-lime-500 bg-lime-400 text-white'
                      : 'border-cream-200 text-transparent hover:border-lime-400'
                  }`}
                >
                  <CheckIcon className="h-4 w-4" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white ${meta.solid}`}
                    >
                      <meta.Icon className="h-3.5 w-3.5" />
                      {meta.label}
                    </span>
                    <span
                      className={`text-sm font-medium ${a.completed ? 'text-ink-500 line-through' : 'text-ink-700'}`}
                    >
                      {formatDate(a.due_date)} · {relativeLabel(a.due_date)}
                    </span>
                  </div>
                  {a.note && (
                    <p
                      className={`mt-1 text-sm ${a.completed ? 'text-ink-500 line-through' : 'text-ink-500'}`}
                    >
                      {a.note}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeAlert(a.id)}
                  aria-label="Quitar alerta"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-500/70 transition hover:bg-blossom-100 hover:text-blossom-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-5 flex flex-col gap-3 rounded-3xl border-2 border-dashed border-cream-200 bg-white/60 p-4 sm:flex-row sm:items-end">
        <div>
          <label className="block text-xs font-semibold text-ink-500">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AlertType)}
            className={`${inputClass} mt-1 py-2`}
          >
            {ALERT_TYPES.map((t) => (
              <option key={t} value={t}>
                {ALERT_TYPE_META[t].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-500">Fecha</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={`${inputClass} mt-1 py-2`}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-ink-500">
            Nota (opcional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`${inputClass} mt-1 py-2`}
          />
        </div>
        <button
          type="button"
          onClick={addAlert}
          disabled={saving}
          className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-ink-900 px-4 py-2.5 text-sm font-semibold text-cream-50 shadow-sm transition hover:bg-ink-700 disabled:opacity-60"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Agregar alerta
        </button>
      </div>
    </div>
  )
}
