import { useEffect, useState, type ReactNode } from 'react'
import { EntityIcon, type EntityIconKind } from './EntityIcon'
import { HeroCollapseToggleButton } from './HeroCollapseToggleButton'
import { Panel } from './ui/Panel'
import styles from './ListPageHero.module.css'

interface ListPageHeroStat {
  label: string
  value: ReactNode
}

interface ListPageHeroProps {
  action?: ReactNode
  children?: ReactNode
  className?: string
  collapsible?: boolean
  collapseToggleTestId?: string
  description: ReactNode
  descriptionSupplement?: ReactNode
  eyebrow: string
  iconAlt?: string
  iconKind: EntityIconKind
  leadingContent?: ReactNode
  storageKey?: string
  stats: ListPageHeroStat[]
  title: ReactNode
}

export function ListPageHero({
  action,
  children,
  className,
  collapsible = false,
  collapseToggleTestId,
  description,
  descriptionSupplement,
  eyebrow,
  iconAlt,
  iconKind,
  leadingContent,
  storageKey,
  stats,
  title,
}: ListPageHeroProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (!collapsible || typeof window === 'undefined' || !storageKey) {
      return false
    }

    return window.localStorage.getItem(storageKey) === 'true'
  })

  useEffect(() => {
    if (!collapsible || typeof window === 'undefined' || !storageKey) {
      return
    }

    window.localStorage.setItem(storageKey, String(isCollapsed))
  }, [collapsible, isCollapsed, storageKey])

  return (
    <Panel
      className={[styles.panel, className, isCollapsed ? styles.collapsed : ''].filter(Boolean).join(' ')}
      variant="hero"
    >
      <div className={styles.main}>
        {leadingContent ? <div className={styles.leadingContent}>{leadingContent}</div> : null}

        <div className={styles.header}>
          <div className={styles.heading}>
            <EntityIcon alt={iconAlt} className={styles.icon} kind={iconKind} />
            <div className={styles.headingBody}>
              <p className={styles.eyebrow}>{eyebrow}</p>
              <h1 className={styles.title}>{title}</h1>
              {!isCollapsed ? <p className={styles.description}>{description}</p> : null}
              {!isCollapsed && descriptionSupplement ? (
                <div className={styles.descriptionSupplement}>{descriptionSupplement}</div>
              ) : null}
            </div>
          </div>

          {action || collapsible ? (
            <div className={styles.actions}>
              {action}
              {collapsible ? (
              <HeroCollapseToggleButton
                dataTestId={collapseToggleTestId}
                expanded={!isCollapsed}
                onToggle={() => setIsCollapsed((current) => !current)}
              />
            ) : null}
          </div>
          ) : null}
        </div>
      </div>

      {!isCollapsed && stats.length > 0 ? (
        <div className={styles.stats}>
          {stats.map((stat, index) => (
            <div className={styles.statCard} key={`${stat.label}-${index}`}>
              <span className={styles.statLabel}>{stat.label}</span>
              <strong className={styles.statValue}>{stat.value}</strong>
            </div>
          ))}
        </div>
      ) : null}

      {!isCollapsed && children ? <div className={styles.body}>{children}</div> : null}
    </Panel>
  )
}
