import type { ReactNode } from 'react'
import pageStyles from '../styles/page.module.css'
import { Panel } from './ui/Panel'
import styles from './PageStatePanel.module.css'

interface PageStatePanelProps {
  action?: ReactNode
  className?: string
  description: ReactNode
  title: ReactNode
}

export function PageStatePanel({ action, className, description, title }: PageStatePanelProps) {
  return (
    <Panel className={className}>
      <h1 className={pageStyles.emptyStateTitle}>{title}</h1>
      <p className={pageStyles.emptyStateText}>{description}</p>
      {action ? <div className={styles.action}>{action}</div> : null}
    </Panel>
  )
}
