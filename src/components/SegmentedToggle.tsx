interface Props {
  value: boolean
  onChange: (value: boolean) => void
  trueLabel: string
  falseLabel: string
}

export function SegmentedToggle({ value, onChange, trueLabel, falseLabel }: Props) {
  return (
    <div className="relative inline-flex rounded-full bg-cream-200/70 p-1">
      <span
        className={`absolute inset-y-1 w-1/2 rounded-full bg-ink-900 shadow-sm transition-transform duration-200 ease-out ${
          value ? 'translate-x-full' : 'translate-x-0'
        }`}
        style={{ width: 'calc(50% - 0.125rem)' }}
      />
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`relative z-10 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
          !value ? 'text-cream-50' : 'text-ink-700'
        }`}
      >
        {falseLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`relative z-10 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
          value ? 'text-cream-50' : 'text-ink-700'
        }`}
      >
        {trueLabel}
      </button>
    </div>
  )
}
