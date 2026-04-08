import { useState, type ReactNode } from 'react'
import { Button } from './ui/Button'
import { Panel } from './ui/Panel'
import styles from './ListPageFilterSection.module.css'

interface ListPageFilterSectionProps {
  body?: ReactNode
  className?: string
  collapsible?: boolean
  defaultExpanded?: boolean
  expanded?: boolean
  onToggleExpanded?: () => void
  showToggleButton?: boolean
  summary?: ReactNode
  topRow: ReactNode
}

export function ListPageFilterSection({
  body,
  className,
  collapsible = false,
  defaultExpanded = false,
  expanded,
  onToggleExpanded,
  showToggleButton = true,
  summary,
  topRow,
}: ListPageFilterSectionProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const isExpanded = expanded ?? internalExpanded
  const shouldShowToggle = collapsible && Boolean(body)
  const shouldShowBody = body && (!shouldShowToggle || isExpanded)
  const handleToggle = () => {
    if (onToggleExpanded) {
      onToggleExpanded()
      return
    }

    setInternalExpanded((current) => !current)
  }

  return (
    <Panel className={[styles.panel, className].filter(Boolean).join(' ')} variant="section">
      <div className={styles.topRow}>{topRow}</div>
      {summary || (shouldShowToggle && showToggleButton) ? (
        <div className={styles.summaryRow}>
          {summary ? <div className={styles.summaryContent}>{summary}</div> : <div />}
          {shouldShowToggle && showToggleButton ? (
            <Button
              aria-expanded={isExpanded}
              onClick={handleToggle}
              size="small"
              variant="secondary"
            >
              {isExpanded ? '絞り込みを閉じる' : '絞り込みを開く'}
            </Button>
          ) : null}
        </div>
      ) : null}
      {shouldShowBody ? <div className={styles.body}>{body}</div> : null}
    </Panel>
  )
}
