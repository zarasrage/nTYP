import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { PatientList } from './components/PatientList'
import { PatientForm } from './components/PatientForm'
import { AlertsPanel } from './components/AlertsPanel'
import { DiagnosisAdmin } from './components/DiagnosisAdmin'
import type { Alert, Patient, PatientInput } from './types/patient'

type Section = 'alerts' | 'patients'
type PatientView =
  | { name: 'list' }
  | { name: 'new' }
  | { name: 'edit'; patient: Patient }
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
      const { error } = await supabase
        .from('patients')
        .update(input)
        .eq('id', patientView.patient.id)
      if (error) {
        setError(error.message)
        return
      }
    } else {
      const { error } = await supabase.from('patients').insert(input)
      if (error) {
        setError(error.message)
        return
      }
    }
    await loadPatients()
    await loadAlerts()
    setPatientView({ name: 'list' })
  }

  function handleSelectAlert(alert: Alert) {
    const patient = patients.find((p) => p.id === alert.patient_id)
    if (!patient) return
    setSection('patients')
    setPatientView({ name: 'edit', patient })
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Registro de Pacientes
          </h1>
          <nav className="flex gap-1 rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
            <button
              onClick={() => setSection('alerts')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                section === 'alerts'
                  ? 'bg-teal-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              Alertas
            </button>
            <button
              onClick={() => {
                setSection('patients')
                setPatientView({ name: 'list' })
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                section === 'patients'
                  ? 'bg-teal-700 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              Pacientes
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {section === 'alerts' && (
          <AlertsPanel
            alerts={alerts}
            loading={loadingAlerts}
            onSelectAlert={handleSelectAlert}
          />
        )}

        {section === 'patients' && patientView.name === 'list' && (
          <PatientList
            patients={patients}
            loading={loadingPatients}
            onSelect={(patient) => setPatientView({ name: 'edit', patient })}
            onNew={() => setPatientView({ name: 'new' })}
            onManageDiagnoses={() => setPatientView({ name: 'diagnoses' })}
          />
        )}

        {section === 'patients' && patientView.name === 'diagnoses' && (
          <DiagnosisAdmin onBack={() => setPatientView({ name: 'list' })} />
        )}

        {section === 'patients' && patientView.name === 'new' && (
          <>
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
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
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
              Editar paciente
            </h2>
            <PatientForm
              initial={patientView.patient}
              onSave={handleSave}
              onCancel={() => {
                setPatientView({ name: 'list' })
                loadAlerts()
              }}
            />
          </>
        )}
      </main>
    </div>
  )
}

export default App
