import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Alert, AlertType } from '../types/patient'
import { ALERT_TYPE_META, ALERT_TYPES } from '../types/patient'

interface Props {
  patientId: string
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function PatientAlerts({ patientId }: Props) {
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
      .eq('patient_id', patientId)
      .order('due_date', { ascending: true })
    if (error) setError(error.message)
    else setAlerts(data as Alert[])
    setLoading(false)
  }, [patientId])

  useEffect(() => {
    load()
  }, [load])

  async function addAlert() {
    if (!dueDate) return
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('alerts').insert({
      patient_id: patientId,
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

  async function removeAlert(id: string) {
    setError(null)
    const { error } = await supabase.from('alerts').delete().eq('id', id)
    if (error) {
      setError(error.message)
      return
    }
    await load()
  }

  return (
    <div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Alertas
      </p>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="mt-2 text-sm text-slate-500">Cargando alertas…</p>
      ) : alerts.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Sin alertas registradas.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {alerts.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ${ALERT_TYPE_META[a.type].badge}`}
                >
                  {ALERT_TYPE_META[a.type].label}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {a.due_date}
                </span>
                {a.note && (
                  <span className="text-sm text-slate-500">— {a.note}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeAlert(a.id)}
                aria-label="Quitar alerta"
                className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-col gap-2 rounded-lg border border-dashed border-slate-300 p-3 sm:flex-row sm:items-end dark:border-slate-700">
        <div>
          <label className="block text-xs font-medium text-slate-500">
            Tipo
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AlertType)}
            className="mt-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
            className="mt-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <button
          type="button"
          onClick={addAlert}
          disabled={saving}
          className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          + Agregar alerta
        </button>
      </div>
    </div>
  )
}
