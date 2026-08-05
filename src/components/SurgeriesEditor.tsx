import type { SurgeryEntry } from '../types/patient'

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
    <div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Cirugías
      </p>

      <div className="mt-2 space-y-2">
        {entries.map((entry, index) => (
          <div key={index} className="flex items-start gap-2">
            <input
              type="date"
              value={entry.date ?? ''}
              onChange={(e) => updateEntry(index, { date: e.target.value })}
              className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <input
              type="text"
              value={entry.notes}
              onChange={(e) => updateEntry(index, { notes: e.target.value })}
              placeholder="Detalle de la cirugía"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={() => removeEntry(index)}
              aria-label="Quitar cirugía"
              className="rounded-lg px-2 py-2 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addEntry}
        className="mt-2 rounded-lg border border-teal-700 px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50 dark:border-teal-600 dark:text-teal-400 dark:hover:bg-teal-950/40"
      >
        + Agregar cirugía
      </button>
    </div>
  )
}
