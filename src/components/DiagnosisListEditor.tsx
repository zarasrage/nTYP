import type { DiagnosisCatalogItem, DiagnosisEntry, Laterality } from '../types/patient'

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
    <div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {title}
      </p>

      <div className="mt-2 space-y-2">
        {entries.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <select
              value={entry.diagnosis}
              onChange={(e) => updateEntry(index, { diagnosis: e.target.value })}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
              className="w-32 rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
        + Agregar diagnóstico
      </button>

      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Texto libre (opcional)"
        rows={2}
        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
    </div>
  )
}
