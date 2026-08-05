import { useRef, useState, type FormEvent } from 'react'
import type { Patient, PatientInput } from '../types/patient'
import { emptyPatientInput } from '../types/patient'

interface Props {
  initial?: Patient
  onSave: (input: PatientInput) => Promise<void>
  onCancel: () => void
}

const fields: Array<{
  name: keyof PatientInput
  label: string
  type?: string
  full?: boolean
}> = [
  { name: 'full_name', label: 'Nombre completo', full: true },
  { name: 'document_id', label: 'RUT / documento de identidad' },
  { name: 'birth_date', label: 'Fecha de nacimiento', type: 'date' },
  { name: 'phone', label: 'Teléfono' },
  { name: 'email', label: 'Correo', type: 'email' },
  { name: 'address', label: 'Dirección', full: true },
  { name: 'emergency_contact_name', label: 'Contacto de emergencia' },
  {
    name: 'emergency_contact_phone',
    label: 'Teléfono de emergencia',
  },
  { name: 'blood_type', label: 'Grupo sanguíneo' },
  { name: 'allergies', label: 'Alergias', full: true },
  { name: 'medical_notes', label: 'Notas médicas', full: true },
]

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
          document_id: initial.document_id ?? '',
          birth_date: initial.birth_date ?? '',
          sex: initial.sex,
          phone: initial.phone ?? '',
          email: initial.email ?? '',
          address: initial.address ?? '',
          emergency_contact_name: initial.emergency_contact_name ?? '',
          emergency_contact_phone: initial.emergency_contact_phone ?? '',
          blood_type: initial.blood_type ?? '',
          allergies: initial.allergies ?? '',
          medical_notes: initial.medical_notes ?? '',
        }
      : emptyPatientInput,
  )
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
          Completar con foto (carnet, ficha o documento)
        </p>
        <p className="mt-1 text-xs text-teal-800/80 dark:text-teal-300/80">
          Toma o sube una foto del documento del paciente y se intentarán
          prellenar los campos automáticamente. Siempre revisa los datos
          antes de guardar.
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

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Sexo
        </label>
        <select
          value={form.sex ?? ''}
          onChange={(e) =>
            update('sex', (e.target.value || null) as PatientInput['sex'])
          }
          className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">Sin especificar</option>
          <option value="F">Femenino</option>
          <option value="M">Masculino</option>
          <option value="Otro">Otro</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.name} className={field.full ? 'sm:col-span-2' : ''}>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {field.label}
            </label>
            {field.name === 'allergies' || field.name === 'medical_notes' ? (
              <textarea
                value={(form[field.name] as string) ?? ''}
                onChange={(e) => update(field.name, e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            ) : (
              <input
                type={field.type ?? 'text'}
                required={field.name === 'full_name'}
                value={(form[field.name] as string) ?? ''}
                onChange={(e) => update(field.name, e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            )}
          </div>
        ))}
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
