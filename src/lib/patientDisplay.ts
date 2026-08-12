import type { Patient } from '../types/patient'

export function toTitleCase(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function diagnosisSummary(patient: Patient): string | null {
  const entry = patient.evolutive_diagnoses[0] ?? patient.initial_diagnoses[0]
  if (!entry || !entry.diagnosis) return null
  return entry.laterality ? `${entry.diagnosis} (${entry.laterality})` : entry.diagnosis
}
