import type { AlertType } from '../types/patient'
import {
  BandageIcon,
  ClipboardCheckIcon,
  EyeLoupeIcon,
  TestTubeIcon,
} from '../components/icons'

export const ALERT_TYPE_META: Record<
  AlertType,
  {
    label: string
    Icon: (props: { className?: string }) => React.JSX.Element
    solid: string
    soft: string
    text: string
    ring: string
  }
> = {
  seguimiento: {
    label: 'Seguimiento',
    Icon: EyeLoupeIcon,
    solid: 'bg-lime-400',
    soft: 'bg-lime-100',
    text: 'text-lime-700',
    ring: 'ring-lime-300',
  },
  curacion: {
    label: 'Curación',
    Icon: BandageIcon,
    solid: 'bg-blossom-400',
    soft: 'bg-blossom-100',
    text: 'text-blossom-600',
    ring: 'ring-blossom-300',
  },
  control: {
    label: 'Control',
    Icon: ClipboardCheckIcon,
    solid: 'bg-lavender-400',
    soft: 'bg-lavender-100',
    text: 'text-lavender-700',
    ring: 'ring-lavender-200',
  },
  cultivos_biopsia: {
    label: 'Cultivos / biopsia',
    Icon: TestTubeIcon,
    solid: 'bg-peach-400',
    soft: 'bg-peach-100',
    text: 'text-peach-700',
    ring: 'ring-peach-200',
  },
}
