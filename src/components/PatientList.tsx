import { useMemo, useRef, useState } from 'react'
import type { Patient } from '../types/patient'
import { PencilIcon, PlusIcon, SearchIcon } from './icons'
import { diagnosisSummary } from '../lib/patientDisplay'

interface Props {
  patients: Patient[]
  loading: boolean
  onOpenAlerts: (patient: Patient) => void
  onEdit: (patient: Patient) => void
  onNew: () => void
  onManageDiagnoses: () => void
  onToggleHospitalized: (patient: Patient) => void
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

const REVEAL_WIDTH = 128
const OPEN_THRESHOLD = REVEAL_WIDTH / 2

function PatientRow({
  patient: p,
  tab,
  onOpenAlerts,
  onEdit,
  onToggleHospitalized,
  style,
}: {
  patient: Patient
  tab: Tab
  onOpenAlerts: (patient: Patient) => void
  onEdit: (patient: Patient) => void
  onToggleHospitalized: (patient: Patient) => void
  style?: React.CSSProperties
}) {
  const [dragX, setDragX] = useState(0)
  const openRef = useRef(false)
  const startXRef = useRef<number | null>(null)
  const draggingRef = useRef(false)
  const movedRef = useRef(false)
  const MOVE_THRESHOLD = 6

  function handlePointerDown(e: React.PointerEvent) {
    startXRef.current = e.clientX
    draggingRef.current = true
    movedRef.current = false
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingRef.current || startXRef.current === null) return
    const delta = e.clientX - startXRef.current
    if (Math.abs(delta) > MOVE_THRESHOLD) movedRef.current = true
    const base = openRef.current ? REVEAL_WIDTH : 0
    const next = Math.min(Math.max(base + delta, 0), REVEAL_WIDTH)
    setDragX(next)
  }

  function close() {
    openRef.current = false
    setDragX(0)
  }

  function endDrag() {
    if (!draggingRef.current) return
    draggingRef.current = false
    startXRef.current = null

    if (!movedRef.current) {
      // Simple tap: no meaningful drag happened.
      if (openRef.current) close()
      else onOpenAlerts(p)
      return
    }

    const shouldOpen = dragX > OPEN_THRESHOLD
    openRef.current = shouldOpen
    setDragX(shouldOpen ? REVEAL_WIDTH : 0)
  }

  return (
    <li
      style={style}
      className="animate-rise-in relative overflow-hidden rounded-2xl shadow-[0_6px_18px_-12px_rgba(36,31,22,0.3)]"
    >
      <div
        className={`absolute inset-y-0 left-0 flex w-32 items-center justify-center text-sm font-bold text-white ${
          p.hospitalized ? 'bg-lime-500' : 'bg-peach-500'
        }`}
      >
        <button
          onClick={() => {
            onToggleHospitalized(p)
            close()
          }}
          className="flex h-full w-full items-center justify-center px-2 text-center"
        >
          {p.hospitalized ? 'Dar de alta' : 'Hospitalizar'}
        </button>
      </div>

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: draggingRef.current ? 'none' : 'transform 0.2s ease-out',
        }}
        className="relative flex items-center gap-1 border border-cream-200 bg-white/95 pr-1.5 touch-pan-y"
      >
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpenAlerts(p)
            }
          }}
          className="flex flex-1 cursor-pointer items-center gap-3 px-3.5 py-3 text-left"
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
                p.age_at_accident !== null ? `${p.age_at_accident} años` : null,
                diagnosisSummary(p),
              ]
                .filter(Boolean)
                .join(' · ') || 'Sin datos adicionales'}
            </p>
          </div>
        </div>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onEdit(p)}
          aria-label={`Editar ${p.full_name}`}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-500 transition hover:bg-cream-200/70 hover:text-lime-700"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
      </div>
    </li>
  )
}

export function PatientList({
  patients,
  loading,
  onOpenAlerts,
  onEdit,
  onNew,
  onManageDiagnoses,
  onToggleHospitalized,
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

  const hospitalized = filtered.filter((p) => p.hospitalized)
  const ambulatory = filtered.filter((p) => !p.hospitalized)

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
        <div className="mt-6 space-y-2.5">
          {hospitalized.length > 0 && (
            <ul className="space-y-2.5">
              {hospitalized.map((p, i) => (
                <PatientRow
                  key={p.id}
                  patient={p}
                  tab={tab}
                  onOpenAlerts={onOpenAlerts}
                  onEdit={onEdit}
                  onToggleHospitalized={onToggleHospitalized}
                  style={{ animationDelay: `${i * 30}ms` }}
                />
              ))}
            </ul>
          )}

          {hospitalized.length > 0 && ambulatory.length > 0 && (
            <div className="flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-cream-200" />
              <span className="text-xs font-semibold text-ink-500">
                Ambulatorio
              </span>
              <span className="h-px flex-1 bg-cream-200" />
            </div>
          )}

          {ambulatory.length > 0 && (
            <ul className="space-y-2.5">
              {ambulatory.map((p, i) => (
                <PatientRow
                  key={p.id}
                  patient={p}
                  tab={tab}
                  onOpenAlerts={onOpenAlerts}
                  onEdit={onEdit}
                  onToggleHospitalized={onToggleHospitalized}
                  style={{ animationDelay: `${i * 30}ms` }}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
