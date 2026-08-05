import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { PatientList } from './components/PatientList'
import { PatientForm } from './components/PatientForm'
import type { Patient, PatientInput } from './types/patient'

type View = { name: 'list' } | { name: 'new' } | { name: 'edit'; patient: Patient }

function App() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [view, setView] = useState<View>({ name: 'list' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPatients()
  }, [])

  async function loadPatients() {
    setLoadingPatients(true)
    setError(null)
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('full_name', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setPatients(data as Patient[])
    }
    setLoadingPatients(false)
  }

  async function handleSave(input: PatientInput) {
    setError(null)
    if (view.name === 'edit') {
      const { error } = await supabase
        .from('patients')
        .update(input)
        .eq('id', view.patient.id)
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
    setView({ name: 'list' })
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Registro de Pacientes
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {view.name === 'list' && (
          <PatientList
            patients={patients}
            loading={loadingPatients}
            onSelect={(patient) => setView({ name: 'edit', patient })}
            onNew={() => setView({ name: 'new' })}
          />
        )}

        {view.name === 'new' && (
          <>
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
              Nuevo paciente
            </h2>
            <PatientForm
              onSave={handleSave}
              onCancel={() => setView({ name: 'list' })}
            />
          </>
        )}

        {view.name === 'edit' && (
          <>
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">
              Editar paciente
            </h2>
            <PatientForm
              initial={view.patient}
              onSave={handleSave}
              onCancel={() => setView({ name: 'list' })}
            />
          </>
        )}
      </main>
    </div>
  )
}

export default App
