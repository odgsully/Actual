import { OneAxisSlider } from './OneAxisSlider'
import { TwoAxisGrid } from './TwoAxisGrid'
import { QuaternaryPicker } from './QuaternaryPicker'
import { BinaryControls } from './BinaryControls'
import type { RankingMode, QuaternaryLabels } from '@/types/app'

interface Props {
  mode: RankingMode
  quaternaryLabels?: QuaternaryLabels
  onScore: (score: number) => void
  onChoice: (choice: string) => void
  onSubmit: () => void
  disabled?: boolean
}

export function RankingControls({ mode, quaternaryLabels, onScore, onChoice, onSubmit, disabled }: Props) {
  switch (mode) {
    case 'one_axis':
      return <OneAxisSlider onScore={onScore} onSubmit={onSubmit} disabled={disabled} />
    case 'two_axis':
      return <TwoAxisGrid onScore={onScore} onSubmit={onSubmit} disabled={disabled} />
    case 'quaternary':
      return <QuaternaryPicker labels={quaternaryLabels} onChoice={onChoice} disabled={disabled} />
    case 'binary':
      return <BinaryControls onChoice={onChoice} disabled={disabled} />
  }
}
