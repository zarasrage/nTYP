import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { DiagnosisCatalogItem } from '../types/patient'
import { inputClass } from '../lib/formStyles'
import { ArrowLeftIcon, PlusIcon } from './icons'

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
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-lime-700 hover:text-lime-800"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Volver a pacientes
      </button>

      <h2 className="mb-1 font-display text-xl font-semibold text-ink-900">
        Gestionar diagnósticos
      </h2>
      <p className="mb-4 text-sm text-ink-500">
        Diagnósticos disponibles en el selector del formulario de paciente.
        Desactivar uno no borra los registros de pacientes que ya lo usan.
      </p>

      {error && <p className="mb-3 text-sm text-blossom-600">{error}</p>}

      <div className="flex gap-2">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Nuevo diagnóstico…"
          className={`${inputClass} flex-1`}
        />
        <button
          onClick={addDiagnosis}
          disabled={saving}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-ink-900 px-4 py-2.5 text-sm font-semibold text-cream-50 shadow-sm transition hover:bg-ink-700 disabled:opacity-60"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Agregar
        </button>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-ink-500">Cargando…</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-2xl border border-cream-200 bg-white/70 px-4 py-3"
            >
              <span
                className={
                  item.active ? 'font-medium text-ink-900' : 'text-ink-500 line-through'
                }
              >
                {item.label}
              </span>
              <button
                onClick={() => toggleActive(item)}
                className="text-sm font-semibold text-blossom-600 hover:text-blossom-700 hover:underline"
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
