import styles from './EntityIcon.module.css'

export type EntityIconKind = 'member' | 'project' | 'system'

interface EntityIconProps {
  kind: EntityIconKind
  className?: string
  alt?: string
}

export function EntityIcon({ kind, className, alt }: EntityIconProps) {
  return (
    <span
      aria-hidden={alt ? undefined : 'true'}
      className={[styles.iconShell, className].filter(Boolean).join(' ')}
    >
      <img alt={alt ?? ''} className={styles.iconImage} src={`${import.meta.env.BASE_URL}${kind}.svg`} />
    </span>
  )
}
