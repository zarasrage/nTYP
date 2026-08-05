import { useMemo, useState } from 'react'
import type { Patient } from '../types/patient'

interface Props {
  patients: Patient[]
  loading: boolean
  onSelect: (patient: Patient) => void
  onNew: () => void
  onManageDiagnoses: () => void
}

type Tab = 'seguimiento' | 'todos'

export function PatientList({
  patients,
  loading,
  onSelect,
  onNew,
  onManageDiagnoses,
}: Props) {
  const [tab, setTab] = useState<Tab>('seguimiento')
  const [query, setQuery] = useState('')

  const inFollowupCount = useMemo(
    () => patients.filter((p) => p.in_followup).length,
    [patients],
  )

  const filtered = useMemo(() => {
    const byTab =
      tab === 'seguimiento' ? patients.filter((p) => p.in_followup) : patients

    const q = query.trim().toLowerCase()
    if (!q) return byTab
    return byTab.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        p.rut?.toLowerCase().includes(q),
    )
  }, [patients, tab, query])

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setTab('seguimiento')}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === 'seguimiento'
                ? 'border-teal-700 text-teal-700 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            En seguimiento ({inFollowupCount})
          </button>
          <button
            onClick={() => setTab('todos')}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              tab === 'todos'
                ? 'border-teal-700 text-teal-700 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Todos los pacientes ({patients.length})
          </button>
        </div>
        <button
          onClick={onManageDiagnoses}
          className="mb-2 text-xs text-slate-500 hover:text-teal-700 hover:underline dark:hover:text-teal-400"
        >
          Gestionar diagnósticos
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Buscar por nombre o RUT…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <button
          onClick={onNew}
          className="whitespace-nowrap rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          + Nuevo paciente
        </button>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-slate-500">Cargando pacientes…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">
          {patients.length === 0
            ? 'Aún no hay pacientes registrados.'
            : tab === 'seguimiento'
              ? 'No hay pacientes en seguimiento por ahora.'
              : 'Sin resultados para tu búsqueda.'}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {filtered.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => onSelect(p)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {p.full_name}
                    {p.hospitalized && (
                      <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-normal text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        Hospitalizado
                      </span>
                    )}
                    {tab === 'todos' && !p.in_followup && (
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Fuera de seguimiento
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">
                    {[
                      p.rut,
                      p.age_at_accident !== null
                        ? `${p.age_at_accident} años al accidente`
                        : null,
                      p.accident_date,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Sin datos adicionales'}
                  </p>
                </div>
                <span className="text-slate-400">›</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
