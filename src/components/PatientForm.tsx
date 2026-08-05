import { useEffect, useRef, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { DiagnosisCatalogItem, Patient, PatientInput } from '../types/patient'
import { emptyPatientInput } from '../types/patient'
import { SegmentedToggle } from './SegmentedToggle'
import { DiagnosisListEditor } from './DiagnosisListEditor'
import { SurgeriesEditor } from './SurgeriesEditor'

interface Props {
  initial?: Patient
  onSave: (input: PatientInput) => Promise<void>
  onCancel: () => void
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function PatientForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<PatientInput>(
    initial
      ? {
          full_name: initial.full_name,
          rut: initial.rut ?? '',
          sex: initial.sex,
          age_at_accident: initial.age_at_accident,
          accident_date: initial.accident_date ?? '',
          initial_diagnoses: initial.initial_diagnoses,
          initial_diagnoses_notes: initial.initial_diagnoses_notes ?? '',
          evolutive_diagnoses: initial.evolutive_diagnoses,
          evolutive_diagnoses_notes: initial.evolutive_diagnoses_notes ?? '',
          surgeries: initial.surgeries,
          hospitalized: initial.hospitalized,
          in_followup: initial.in_followup,
        }
      : emptyPatientInput,
  )
  const [catalog, setCatalog] = useState<DiagnosisCatalogItem[]>([])
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase
      .from('diagnosis_catalog')
      .select('*')
      .eq('active', true)
      .order('label', { ascending: true })
      .then(({ data }) => setCatalog((data as DiagnosisCatalogItem[]) ?? []))
  }, [])

  function update<K extends keyof PatientInput>(key: K, value: PatientInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    setScanError(null)
    try {
      const base64 = await fileToBase64(file)
      const res = await fetch('/.netlify/functions/extract-patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mediaType: file.type }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Error ${res.status}`)
      }
      const extracted = (await res.json()) as Partial<PatientInput>
      setForm((f) => ({
        ...f,
        ...Object.fromEntries(
          Object.entries(extracted).filter(([, v]) => v !== null && v !== ''),
        ),
      }))
    } catch (err) {
      setScanError(
        err instanceof Error
          ? err.message
          : 'No se pudo leer la imagen. Completa los datos manualmente.',
      )
    } finally {
      setScanning(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-dashed border-teal-300 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-950/40">
        <p className="text-sm font-medium text-teal-900 dark:text-teal-200">
          Completar con foto (carnet u otro documento)
        </p>
        <p className="mt-1 text-xs text-teal-800/80 dark:text-teal-300/80">
          Toma o sube una foto y se intentarán prellenar nombre, RUT y sexo.
          Siempre revisa los datos antes de guardar.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
            className="hidden"
            id="photo-input"
          />
          <label
            htmlFor="photo-input"
            className="cursor-pointer rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            {scanning ? 'Analizando foto…' : 'Usar foto'}
          </label>
          {scanError && <p className="text-sm text-red-600">{scanError}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Nombre completo
          </label>
          <input
            type="text"
            required
            value={form.full_name}
            onChange={(e) => update('full_name', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            RUT
          </label>
          <input
            type="text"
            value={form.rut ?? ''}
            onChange={(e) => update('rut', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Sexo
          </label>
          <select
            value={form.sex ?? ''}
            onChange={(e) =>
              update('sex', (e.target.value || null) as PatientInput['sex'])
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Sin especificar</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Edad (al accidente)
          </label>
          <input
            type="number"
            min={0}
            value={form.age_at_accident ?? ''}
            onChange={(e) =>
              update(
                'age_at_accident',
                e.target.value === '' ? null : Number(e.target.value),
              )
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Fecha accidente
          </label>
          <input
            type="date"
            value={form.accident_date ?? ''}
            onChange={(e) => update('accident_date', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      <DiagnosisListEditor
        title="Diagnóstico inicial"
        entries={form.initial_diagnoses}
        onChange={(entries) => update('initial_diagnoses', entries)}
        notes={form.initial_diagnoses_notes ?? ''}
        onNotesChange={(notes) => update('initial_diagnoses_notes', notes)}
        catalog={catalog}
      />

      <DiagnosisListEditor
        title="Diagnósticos evolutivos"
        entries={form.evolutive_diagnoses}
        onChange={(entries) => update('evolutive_diagnoses', entries)}
        notes={form.evolutive_diagnoses_notes ?? ''}
        onNotesChange={(notes) => update('evolutive_diagnoses_notes', notes)}
        catalog={catalog}
      />

      <SurgeriesEditor
        entries={form.surgeries}
        onChange={(entries) => update('surgeries', entries)}
      />

      <div className="flex flex-wrap gap-6">
        <div>
          <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
            Condición
          </p>
          <SegmentedToggle
            value={form.hospitalized}
            onChange={(v) => update('hospitalized', v)}
            falseLabel="Ambulatorio"
            trueLabel="Hospitalizado"
          />
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">
            Seguimiento
          </p>
          <SegmentedToggle
            value={form.in_followup}
            onChange={(v) => update('in_followup', v)}
            falseLabel="No"
            trueLabel="Sí"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {saving ? 'Guardando…' : 'Guardar paciente'}
        </button>
      </div>
    </form>
  )
}
