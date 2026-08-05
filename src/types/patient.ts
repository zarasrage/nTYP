export type Sex = 'M' | 'F' | 'Otro'
export type Laterality = 'Der' | 'Izq' | 'Bilateral'

export interface DiagnosisEntry {
  diagnosis: string
  laterality: Laterality | null
}

export interface SurgeryEntry {
  date: string | null
  notes: string
}

export interface Patient {
  id: string
  created_at: string
  updated_at: string

  full_name: string
  rut: string | null
  sex: Sex | null
  age_at_accident: number | null
  accident_date: string | null

  initial_diagnoses: DiagnosisEntry[]
  initial_diagnoses_notes: string | null
  evolutive_diagnoses: DiagnosisEntry[]
  evolutive_diagnoses_notes: string | null

  surgeries: SurgeryEntry[]

  hospitalized: boolean
  in_followup: boolean
}

export type PatientInput = Omit<Patient, 'id' | 'created_at' | 'updated_at'>

export const emptyPatientInput: PatientInput = {
  full_name: '',
  rut: '',
  sex: null,
  age_at_accident: null,
  accident_date: '',
  initial_diagnoses: [],
  initial_diagnoses_notes: '',
  evolutive_diagnoses: [],
  evolutive_diagnoses_notes: '',
  surgeries: [],
  hospitalized: false,
  in_followup: true,
}

export interface DiagnosisCatalogItem {
  id: string
  label: string
  active: boolean
}

export type AlertType = 'seguimiento' | 'curacion' | 'control' | 'cultivos_biopsia'

export interface Alert {
  id: string
  created_at: string
  patient_id: string
  type: AlertType
  due_date: string
  note: string | null
  completed: boolean
  patient?: { full_name: string } | null
}

export type AlertInput = Omit<Alert, 'id' | 'created_at' | 'patient'>

export const ALERT_TYPE_META: Record<
  AlertType,
  { label: string; badge: string }
> = {
  seguimiento: {
    label: 'Alerta de seguimiento',
    badge: 'bg-teal-600',
  },
  curacion: {
    label: 'Alerta de curación',
    badge: 'bg-amber-500',
  },
  control: {
    label: 'Alerta de control',
    badge: 'bg-blue-600',
  },
  cultivos_biopsia: {
    label: 'Alerta de cultivos o biopsia',
    badge: 'bg-purple-600',
  },
}

export const ALERT_TYPES: AlertType[] = [
  'seguimiento',
  'curacion',
  'control',
  'cultivos_biopsia',
]
