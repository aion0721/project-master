import type { ReactNode } from 'react'
import { Panel } from './ui/Panel'
import styles from './ListPageContentSection.module.css'

interface ListPageEmptyState {
  description: ReactNode
  title: ReactNode
}

interface ListPageContentSectionProps {
  actions?: ReactNode
  children?: ReactNode
  className?: string
  description?: ReactNode
  emptyState?: ListPageEmptyState | null
  title?: ReactNode
}

export function ListPageContentSection({
  actions,
  children,
  className,
  description,
  emptyState,
  title,
}: ListPageContentSectionProps) {
  return (
    <Panel className={[styles.panel, className].filter(Boolean).join(' ')} variant="section">
      {title || description || actions ? (
        <div className={styles.header}>
          <div>
            {title ? <h2 className={styles.title}>{title}</h2> : null}
            {description ? <p className={styles.description}>{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}

      {emptyState ? (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyStateTitle}>{emptyState.title}</h3>
          <p className={styles.emptyStateText}>{emptyState.description}</p>
        </div>
      ) : (
        children
      )}
    </Panel>
  )
}
