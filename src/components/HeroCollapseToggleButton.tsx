import { Button } from './ui/Button'
import styles from './HeroCollapseToggleButton.module.css'

interface HeroCollapseToggleButtonProps {
  expanded: boolean
  dataTestId?: string
  onToggle: () => void
}

export function HeroCollapseToggleButton({
  expanded,
  dataTestId,
  onToggle,
}: HeroCollapseToggleButtonProps) {
  return (
    <Button
      aria-expanded={expanded}
      aria-label={expanded ? 'Heroをたたむ' : 'Heroを開く'}
      className={styles.button}
      data-testid={dataTestId}
      onClick={onToggle}
      size="small"
      title={expanded ? 'Heroをたたむ' : 'Heroを開く'}
      variant="secondary"
    >
      <span aria-hidden="true" className={styles.icon}>
        {expanded ? '⤡' : '⤢'}
      </span>
    </Button>
  )
}
