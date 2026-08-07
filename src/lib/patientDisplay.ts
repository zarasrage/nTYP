import type { Patient } from '../types/patient'

export function diagnosisSummary(patient: Patient): string | null {
  const entry = patient.evolutive_diagnoses[0] ?? patient.initial_diagnoses[0]
  if (!entry || !entry.diagnosis) return null
  return entry.laterality ? `${entry.diagnosis} (${entry.laterality})` : entry.diagnosis
}
