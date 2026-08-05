import type { SurgeryEntry } from '../types/patient'
import { chipButtonClass, iconButtonClass, inputClass, labelClass } from '../lib/formStyles'
import { CloseIcon, PlusIcon } from './icons'

interface Props {
  entries: SurgeryEntry[]
  onChange: (entries: SurgeryEntry[]) => void
}

export function SurgeriesEditor({ entries, onChange }: Props) {
  function addEntry() {
    onChange([...entries, { date: '', notes: '' }])
  }

  function updateEntry(index: number, patch: Partial<SurgeryEntry>) {
    onChange(entries.map((e, i) => (i === index ? { ...e, ...patch } : e)))
  }

  function removeEntry(index: number) {
    onChange(entries.filter((_, i) => i !== index))
  }

  return (
    <div className="rounded-3xl border border-cream-200 bg-white/70 p-4">
      <p className={labelClass}>Cirugías</p>

      <div className="mt-3 space-y-2">
        {entries.map((entry, index) => (
          <div key={index} className="flex items-start gap-2">
            <input
              type="date"
              value={entry.date ?? ''}
              onChange={(e) => updateEntry(index, { date: e.target.value })}
              className={`${inputClass} w-40`}
            />
            <input
              type="text"
              value={entry.notes}
              onChange={(e) => updateEntry(index, { notes: e.target.value })}
              placeholder="Detalle de la cirugía"
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={() => removeEntry(index)}
              aria-label="Quitar cirugía"
              className={iconButtonClass}
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={addEntry} className={`${chipButtonClass} mt-3`}>
        <PlusIcon className="h-3.5 w-3.5" />
        Agregar cirugía
      </button>
    </div>
  )
}
