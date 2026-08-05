type IconProps = { className?: string }

const base = 'stroke-current fill-none'

export function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <g className={base}>
        <circle cx="11" cy="11" r="6.5" />
        <path d="M20 20l-4.3-4.3" />
      </g>
    </svg>
  )
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={2.4} strokeLinecap="round">
      <g className={base}>
        <path d="M12 5v14M5 12h14" />
      </g>
    </svg>
  )
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      <g className={base}>
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </g>
    </svg>
  )
}

export function PencilIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round">
      <g className={base}>
        <path d="M4 20l.9-4.2L15.6 5.1a1.7 1.7 0 0 1 2.4 0l1 1a1.7 1.7 0 0 1 0 2.4L8.2 19.1 4 20Z" />
        <path d="M13.8 6.9l3.3 3.3" />
      </g>
    </svg>
  )
}

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <g className={base}>
        <path d="M19 12H5M11 6l-6 6 6 6" />
      </g>
    </svg>
  )
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={2.2} strokeLinecap="round">
      <g className={base}>
        <path d="M6 6l12 12M18 6L6 18" />
      </g>
    </svg>
  )
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <g className={base}>
        <path d="M5 7h14M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m2 0-.7 12.1a2 2 0 0 1-2 1.9H9.7a2 2 0 0 1-2-1.9L7 7" />
      </g>
    </svg>
  )
}

// --- Íconos de tipos de alerta ---

export function EyeLoupeIcon({ className }: IconProps) {
  // Alerta de seguimiento
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <g className={base}>
        <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
        <circle cx="12" cy="12" r="3" />
      </g>
    </svg>
  )
}

export function BandageIcon({ className }: IconProps) {
  // Alerta de curación
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <g className={base}>
        <rect x="3.5" y="8.5" width="17" height="7" rx="3.5" transform="rotate(-15 12 12)" />
        <path d="M9.3 9.6l1.7 6.3M13 8.6l1.7 6.3" />
      </g>
    </svg>
  )
}

export function ClipboardCheckIcon({ className }: IconProps) {
  // Alerta de control
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <g className={base}>
        <rect x="5" y="4.5" width="14" height="16" rx="2.2" />
        <path d="M9 4.5h6a1 1 0 0 1 1 1V7H8V5.5a1 1 0 0 1 1-1Z" />
        <path d="M8.7 13l2.1 2.1 4.2-4.2" />
      </g>
    </svg>
  )
}

export function TestTubeIcon({ className }: IconProps) {
  // Alerta de cultivos o biopsia
  return (
    <svg viewBox="0 0 24 24" className={className} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <g className={base}>
        <path d="M9.5 3.5h5" />
        <path d="M10.3 4v12.8a2.7 2.7 0 0 0 5.4 0V4" />
        <path d="M10.3 12.5h5.4" />
      </g>
    </svg>
  )
}
