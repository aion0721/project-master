import styles from './EntityIcon.module.css'

export type EntityIconKind = 'member' | 'project' | 'system'

interface EntityIconProps {
  kind: EntityIconKind
  className?: string
}

export function EntityIcon({ kind, className }: EntityIconProps) {
  return (
    <span aria-hidden="true" className={[styles.iconShell, className].filter(Boolean).join(' ')}>
      <img alt="" className={styles.iconImage} src={`${import.meta.env.BASE_URL}${kind}.svg`} />
    </span>
  )
}
