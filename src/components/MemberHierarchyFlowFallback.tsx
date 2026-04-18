import styles from './MemberHierarchyFlowFallback.module.css'

interface MemberHierarchyFlowFallbackProps {
  message?: string
}

export function MemberHierarchyFlowFallback({
  message = '体制図を読み込み中です...',
}: MemberHierarchyFlowFallbackProps) {
  return (
    <div aria-live="polite" className={styles.root} role="status">
      <div aria-hidden="true" className={styles.preview}>
        <span className={styles.node} />
        <span className={styles.connector} />
        <span className={styles.node} />
      </div>
      <p className={styles.message}>{message}</p>
    </div>
  )
}
