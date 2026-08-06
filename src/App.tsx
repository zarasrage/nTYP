import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { PatientList } from './components/PatientList'
import { PatientForm } from './components/PatientForm'
import { PatientAlertsView } from './components/PatientAlertsView'
import { AlertsPanel } from './components/AlertsPanel'
import { DiagnosisAdmin } from './components/DiagnosisAdmin'
import type { Alert, Patient, PatientInput } from './types/patient'

type Section = 'alerts' | 'patients'
type PatientView =
  | { name: 'list' }
  | { name: 'new' }
  | { name: 'edit'; patient: Patient }
  | { name: 'patient-alerts'; patient: Patient }
  | { name: 'diagnoses' }

function App() {
  const [section, setSection] = useState<Section>('alerts')

  const [patients, setPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [patientView, setPatientView] = useState<PatientView>({ name: 'list' })

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loadingAlerts, setLoadingAlerts] = useState(true)

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPatients()
    loadAlerts()
  }, [])

  async function loadPatients() {
    setLoadingPatients(true)
    setError(null)
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('full_name', { ascending: true })

    if (error) setError(error.message)
    else setPatients(data as Patient[])
    setLoadingPatients(false)
  }

  async function loadAlerts() {
    setLoadingAlerts(true)
    const { data, error } = await supabase
      .from('alerts')
      .select('*, patient:patients(full_name)')
      .order('due_date', { ascending: true })

    if (error) setError(error.message)
    else setAlerts(data as unknown as Alert[])
    setLoadingAlerts(false)
  }

  async function handleSave(input: PatientInput) {
    setError(null)
    if (patientView.name === 'edit') {
      const { data, error } = await supabase
        .from('patients')
        .update(input)
        .eq('id', patientView.patient.id)
        .select()
        .single()
      if (error) {
        setError(error.message)
        return
      }
      await loadPatients()
      setPatientView({ name: 'patient-alerts', patient: data as Patient })
    } else {
      const { data, error } = await supabase
        .from('patients')
        .insert(input)
        .select()
        .single()
      if (error) {
        setError(error.message)
        return
      }
      await loadPatients()
      setPatientView({ name: 'patient-alerts', patient: data as Patient })
    }
  }

  async function handleToggleAlertComplete(alert: Alert) {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alert.id ? { ...a, completed: !a.completed } : a,
      ),
    )
    const { error } = await supabase
      .from('alerts')
      .update({ completed: !alert.completed })
      .eq('id', alert.id)
    if (error) {
      setError(error.message)
      await loadAlerts()
    }
  }

  async function handleToggleHospitalized(patient: Patient) {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patient.id ? { ...p, hospitalized: !p.hospitalized } : p,
      ),
    )
    const { error } = await supabase
      .from('patients')
      .update({ hospitalized: !patient.hospitalized })
      .eq('id', patient.id)
    if (error) {
      setError(error.message)
      await loadPatients()
    }
  }

  async function handleDeletePatient(patient: Patient) {
    setError(null)
    const { error } = await supabase.from('patients').delete().eq('id', patient.id)
    if (error) {
      setError(error.message)
      return
    }
    await loadPatients()
    await loadAlerts()
    setPatientView({ name: 'list' })
  }

  function handleSelectAlert(alert: Alert) {
    const patient = patients.find((p) => p.id === alert.patient_id)
    if (!patient) return
    setSection('patients')
    setPatientView({ name: 'patient-alerts', patient })
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="relative overflow-hidden rounded-b-[32px] bg-lime-400 px-4 pb-5 pt-6 shadow-[0_6px_0_0_rgba(0,0,0,0.04)] sm:px-6">
        <span className="confetti absolute right-3 top-2 h-2.5 w-2.5 bg-blossom-300" />
        <span className="confetti absolute left-3 top-2 h-2 w-2 bg-cream-50" />
        <span className="confetti absolute left-6 bottom-1.5 h-2 w-2 bg-lavender-400" />
        <span className="confetti absolute right-6 bottom-1.5 h-2.5 w-2.5 bg-peach-400" />

        <div className="relative mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/icons/icon-512.png"
              alt=""
              className="h-10 w-10 shrink-0 rounded-2xl shadow-sm"
            />
            <h1 className="font-display text-xl font-bold tracking-tight text-ink-900">
              Navegación
            </h1>
          </div>
          <nav className="flex gap-1 rounded-full bg-white/50 p-1">
            <button
              onClick={() => setSection('alerts')}
              className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${
                section === 'alerts'
                  ? 'bg-cream-50 text-lime-700 shadow-sm'
                  : 'text-ink-700 hover:text-ink-900'
              }`}
            >
              Alertas
            </button>
            <button
              onClick={() => {
                setSection('patients')
                setPatientView({ name: 'list' })
              }}
              className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${
                section === 'patients'
                  ? 'bg-cream-50 text-lime-700 shadow-sm'
                  : 'text-ink-700 hover:text-ink-900'
              }`}
            >
              Pacientes
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {error && (
          <div className="mb-4 rounded-2xl border border-blossom-200 bg-blossom-50 px-4 py-3 text-sm font-medium text-blossom-700">
            {error}
          </div>
        )}

        {section === 'alerts' && (
          <AlertsPanel
            alerts={alerts}
            loading={loadingAlerts}
            onSelectAlert={handleSelectAlert}
            onToggleComplete={handleToggleAlertComplete}
          />
        )}

        {section === 'patients' && patientView.name === 'list' && (
          <PatientList
            patients={patients}
            loading={loadingPatients}
            onOpenAlerts={(patient) =>
              setPatientView({ name: 'patient-alerts', patient })
            }
            onEdit={(patient) => setPatientView({ name: 'edit', patient })}
            onNew={() => setPatientView({ name: 'new' })}
            onManageDiagnoses={() => setPatientView({ name: 'diagnoses' })}
            onToggleHospitalized={handleToggleHospitalized}
          />
        )}

        {section === 'patients' && patientView.name === 'diagnoses' && (
          <DiagnosisAdmin onBack={() => setPatientView({ name: 'list' })} />
        )}

        {section === 'patients' && patientView.name === 'patient-alerts' && (
          <PatientAlertsView
            patient={patientView.patient}
            onBack={() => setPatientView({ name: 'list' })}
            onEdit={() =>
              setPatientView({ name: 'edit', patient: patientView.patient })
            }
          />
        )}

        {section === 'patients' && patientView.name === 'new' && (
          <>
            <h2 className="mb-5 font-display text-2xl font-semibold text-ink-900">
              Nuevo paciente
            </h2>
            <PatientForm
              onSave={handleSave}
              onCancel={() => setPatientView({ name: 'list' })}
            />
          </>
        )}

        {section === 'patients' && patientView.name === 'edit' && (
          <>
            <h2 className="mb-5 font-display text-2xl font-semibold text-ink-900">
              Editar paciente
            </h2>
            <PatientForm
              initial={patientView.patient}
              onSave={handleSave}
              onDelete={handleDeletePatient}
              onCancel={() =>
                setPatientView({
                  name: 'patient-alerts',
                  patient: patientView.patient,
                })
              }
            />
          </>
        )}
      </main>
    </div>
  )
}

export default App
