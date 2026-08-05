import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { DiagnosisCatalogItem } from '../types/patient'

interface Props {
  onBack: () => void
}

export function DiagnosisAdmin({ onBack }: Props) {
  const [items, setItems] = useState<DiagnosisCatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newLabel, setNewLabel] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('diagnosis_catalog')
      .select('*')
      .order('label', { ascending: true })
    if (error) setError(error.message)
    else setItems(data as DiagnosisCatalogItem[])
    setLoading(false)
  }

  async function addDiagnosis() {
    const label = newLabel.trim()
    if (!label) return
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('diagnosis_catalog').insert({ label })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setNewLabel('')
    await load()
  }

  async function toggleActive(item: DiagnosisCatalogItem) {
    setError(null)
    const { error } = await supabase
      .from('diagnosis_catalog')
      .update({ active: !item.active })
      .eq('id', item.id)
    if (error) {
      setError(error.message)
      return
    }
    await load()
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 text-sm text-teal-700 hover:underline dark:text-teal-400"
      >
        ← Volver a pacientes
      </button>

      <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-slate-100">
        Gestionar diagnósticos
      </h2>
      <p className="mb-4 text-sm text-slate-500">
        Diagnósticos disponibles en el selector del formulario de paciente.
        Desactivar uno no borra los registros de pacientes que ya lo usan.
      </p>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Nuevo diagnóstico…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <button
          onClick={addDiagnosis}
          disabled={saving}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          + Agregar
        </button>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Cargando…</p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <span
                className={
                  item.active
                    ? 'text-slate-900 dark:text-slate-100'
                    : 'text-slate-400 line-through dark:text-slate-600'
                }
              >
                {item.label}
              </span>
              <button
                onClick={() => toggleActive(item)}
                className="text-sm text-teal-700 hover:underline dark:text-teal-400"
              >
                {item.active ? 'Desactivar' : 'Reactivar'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
