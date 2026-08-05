import type { DiagnosisCatalogItem, DiagnosisEntry, Laterality } from '../types/patient'
import { chipButtonClass, iconButtonClass, inputClass, labelClass } from '../lib/formStyles'
import { CloseIcon, PlusIcon } from './icons'

interface Props {
  title: string
  entries: DiagnosisEntry[]
  onChange: (entries: DiagnosisEntry[]) => void
  notes: string
  onNotesChange: (notes: string) => void
  catalog: DiagnosisCatalogItem[]
}

const LATERALITY_OPTIONS: Laterality[] = ['Der', 'Izq', 'Bilateral']

export function DiagnosisListEditor({
  title,
  entries,
  onChange,
  notes,
  onNotesChange,
  catalog,
}: Props) {
  function addEntry() {
    onChange([...entries, { diagnosis: '', laterality: null }])
  }

  function updateEntry(index: number, patch: Partial<DiagnosisEntry>) {
    onChange(entries.map((e, i) => (i === index ? { ...e, ...patch } : e)))
  }

  function removeEntry(index: number) {
    onChange(entries.filter((_, i) => i !== index))
  }

  return (
    <div className="rounded-3xl border border-cream-200 bg-white/70 p-4">
      <p className={labelClass}>{title}</p>

      <div className="mt-3 space-y-2">
        {entries.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <select
              value={entry.diagnosis}
              onChange={(e) => updateEntry(index, { diagnosis: e.target.value })}
              className={`${inputClass} flex-1`}
            >
              <option value="">Selecciona un diagnóstico…</option>
              {catalog.map((d) => (
                <option key={d.id} value={d.label}>
                  {d.label}
                </option>
              ))}
            </select>
            <select
              value={entry.laterality ?? ''}
              onChange={(e) =>
                updateEntry(index, {
                  laterality: (e.target.value || null) as Laterality | null,
                })
              }
              className={`${inputClass} w-32`}
            >
              <option value="">Lateralidad</option>
              {LATERALITY_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeEntry(index)}
              aria-label="Quitar diagnóstico"
              className={iconButtonClass}
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={addEntry} className={`${chipButtonClass} mt-3`}>
        <PlusIcon className="h-3.5 w-3.5" />
        Agregar diagnóstico
      </button>

      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Texto libre (opcional)"
        rows={2}
        className={`${inputClass} mt-3`}
      />
    </div>
  )
}
