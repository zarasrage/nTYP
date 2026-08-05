interface Props {
  value: boolean
  onChange: (value: boolean) => void
  trueLabel: string
  falseLabel: string
}

export function SegmentedToggle({ value, onChange, trueLabel, falseLabel }: Props) {
  return (
    <div className="inline-flex rounded-lg border border-slate-300 p-0.5 dark:border-slate-700">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
          !value
            ? 'bg-teal-700 text-white'
            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
        }`}
      >
        {falseLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
          value
            ? 'bg-teal-700 text-white'
            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
        }`}
      >
        {trueLabel}
      </button>
    </div>
  )
}
