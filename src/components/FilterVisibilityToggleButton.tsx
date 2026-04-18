import { Button } from './ui/Button'

interface FilterVisibilityToggleButtonProps {
  hideLabel?: string
  isVisible: boolean
  onToggle: () => void
  showLabel?: string
}

export function FilterVisibilityToggleButton({
  hideLabel = '絞り込みを非表示',
  isVisible,
  onToggle,
  showLabel = '絞り込みを表示',
}: FilterVisibilityToggleButtonProps) {
  return (
    <Button aria-expanded={isVisible} onClick={onToggle} size="small" variant="secondary">
      {isVisible ? hideLabel : showLabel}
    </Button>
  )
}
