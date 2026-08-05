import { useMemo, useState } from 'react'
import type { Patient } from '../types/patient'
import { PencilIcon, PlusIcon, SearchIcon } from './icons'

interface Props {
  patients: Patient[]
  loading: boolean
  onOpenAlerts: (patient: Patient) => void
  onEdit: (patient: Patient) => void
  onNew: () => void
  onManageDiagnoses: () => void
}

type Tab = 'seguimiento' | 'todos'

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

export function PatientList({
  patients,
  loading,
  onOpenAlerts,
  onEdit,
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex gap-1.5 rounded-full bg-white/70 p-1.5 shadow-sm ring-1 ring-cream-200">
          <button
            onClick={() => setTab('seguimiento')}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === 'seguimiento'
                ? 'bg-ink-900 text-cream-50 shadow-sm'
                : 'text-ink-700 hover:bg-cream-200/70'
            }`}
          >
            En seguimiento ({inFollowupCount})
          </button>
          <button
            onClick={() => setTab('todos')}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === 'todos'
                ? 'bg-ink-900 text-cream-50 shadow-sm'
                : 'text-ink-700 hover:bg-cream-200/70'
            }`}
          >
            Todos ({patients.length})
          </button>
        </div>
        <button
          onClick={onManageDiagnoses}
          className="text-xs font-semibold text-blossom-600 hover:text-blossom-700 hover:underline"
        >
          Gestionar diagnósticos
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            type="search"
            placeholder="Buscar por nombre o RUT…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-full border border-cream-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink-900 shadow-sm outline-none placeholder:text-ink-500/70 focus:border-lime-400 focus:ring-2 focus:ring-lime-200"
          />
        </div>
        <button
          onClick={onNew}
          className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-cream-50 shadow-[0_10px_20px_-8px_rgba(36,31,22,0.5)] transition hover:-translate-y-0.5 hover:bg-ink-700"
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo paciente
        </button>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-ink-500">Cargando pacientes…</p>
      ) : filtered.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-cream-200 bg-white/60 px-6 py-12 text-center">
          <p className="font-display text-lg text-ink-700">
            {patients.length === 0
              ? 'Aún no hay pacientes registrados.'
              : tab === 'seguimiento'
                ? 'No hay pacientes en seguimiento por ahora.'
                : 'Sin resultados para tu búsqueda.'}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2.5">
          {filtered.map((p, i) => (
            <li
              key={p.id}
              style={{ animationDelay: `${i * 30}ms` }}
              className="animate-rise-in flex items-center gap-1 rounded-2xl border border-cream-200 bg-white/80 pr-1.5 shadow-[0_6px_18px_-12px_rgba(36,31,22,0.3)] transition hover:shadow-[0_10px_24px_-12px_rgba(36,31,22,0.35)]"
            >
              <button
                onClick={() => onOpenAlerts(p)}
                className="flex flex-1 items-center gap-3 px-3.5 py-3 text-left"
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-base font-semibold ${avatarStyle(p.full_name)}`}
                >
                  {p.full_name.trim().charAt(0).toUpperCase() || '?'}
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-1.5 font-semibold text-ink-900">
                    {p.full_name}
                    {p.hospitalized && (
                      <span className="rounded-full bg-lavender-100 px-2 py-0.5 text-xs font-medium text-lavender-700">
                        Hospitalizado
                      </span>
                    )}
                    {tab === 'todos' && !p.in_followup && (
                      <span className="rounded-full bg-cream-200 px-2 py-0.5 text-xs font-medium text-ink-500">
                        Fuera de seguimiento
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-ink-500">
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
              </button>
              <button
                onClick={() => onEdit(p)}
                aria-label={`Editar ${p.full_name}`}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-500 transition hover:bg-cream-200/70 hover:text-lime-700"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
