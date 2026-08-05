import { useMemo, useState } from 'react'
import type { Patient } from '../types/patient'

interface Props {
  patients: Patient[]
  loading: boolean
  onSelect: (patient: Patient) => void
  onNew: () => void
}

function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null
  const dob = new Date(birthDate)
  if (Number.isNaN(dob.getTime())) return null
  const diff = Date.now() - dob.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

export function PatientList({ patients, loading, onSelect, onNew }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return patients
    return patients.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        p.document_id?.toLowerCase().includes(q),
    )
  }, [patients, query])

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Buscar por nombre o RUT/documento…"
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
            : 'Sin resultados para tu búsqueda.'}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {filtered.map((p) => {
            const age = calcAge(p.birth_date)
            return (
              <li key={p.id}>
                <button
                  onClick={() => onSelect(p)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {p.full_name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {[
                        p.document_id,
                        age !== null ? `${age} años` : null,
                        p.phone,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Sin datos adicionales'}
                    </p>
                  </div>
                  <span className="text-slate-400">›</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
