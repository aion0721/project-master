import type { ReactNode } from 'react'
import { EntityIcon, type EntityIconKind } from './EntityIcon'
import { Panel } from './ui/Panel'
import styles from './ListPageHero.module.css'

interface ListPageHeroStat {
  label: string
  value: ReactNode
}

interface ListPageHeroProps {
  action?: ReactNode
  className?: string
  description: ReactNode
  eyebrow: string
  iconKind: EntityIconKind
  stats: ListPageHeroStat[]
  title: ReactNode
}

export function ListPageHero({
  action,
  className,
  description,
  eyebrow,
  iconKind,
  stats,
  title,
}: ListPageHeroProps) {
  return (
    <Panel className={className} variant="hero">
      <div className={styles.header}>
        <div className={styles.heading}>
          <EntityIcon className={styles.icon} kind={iconKind} />
          <div className={styles.headingBody}>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.description}>{description}</p>
          </div>
        </div>

        {action}
      </div>

      <div className={styles.stats}>
        {stats.map((stat, index) => (
          <div className={styles.statCard} key={`${stat.label}-${index}`}>
            <span className={styles.statLabel}>{stat.label}</span>
            <strong className={styles.statValue}>{stat.value}</strong>
          </div>
        ))}
      </div>
    </Panel>
  )
}
