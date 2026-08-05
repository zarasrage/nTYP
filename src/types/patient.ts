export type Sex = 'M' | 'F' | 'Otro'

export interface Patient {
  id: string
  created_at: string
  updated_at: string

  full_name: string
  document_id: string | null
  birth_date: string | null
  sex: Sex | null
  phone: string | null
  email: string | null
  address: string | null

  emergency_contact_name: string | null
  emergency_contact_phone: string | null

  blood_type: string | null
  allergies: string | null
  medical_notes: string | null

  in_followup: boolean
}

export type PatientInput = Omit<Patient, 'id' | 'created_at' | 'updated_at'>

export const emptyPatientInput: PatientInput = {
  full_name: '',
  document_id: '',
  birth_date: '',
  sex: null,
  phone: '',
  email: '',
  address: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  blood_type: '',
  allergies: '',
  medical_notes: '',
  in_followup: true,
}
