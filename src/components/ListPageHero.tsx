import type { ReactNode } from 'react'
import { EntityIcon, type EntityIconKind } from './EntityIcon'
import { Panel } from './ui/Panel'
import pageStyles from '../styles/page.module.css'

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
  statsClassName: string
  statCardClassName: string
  statLabelClassName: string
  statValueClassName: string
  title: ReactNode
  headerClassName: string
}

export function ListPageHero({
  action,
  className,
  description,
  eyebrow,
  iconKind,
  stats,
  statsClassName,
  statCardClassName,
  statLabelClassName,
  statValueClassName,
  title,
  headerClassName,
}: ListPageHeroProps) {
  return (
    <Panel className={className} variant="hero">
      <div className={headerClassName}>
        <div className={pageStyles.heroHeading}>
          <EntityIcon className={pageStyles.heroIcon} kind={iconKind} />
          <div className={pageStyles.heroHeadingBody}>
            <p className={pageStyles.eyebrow}>{eyebrow}</p>
            <h1 className={pageStyles.title}>{title}</h1>
            <p className={pageStyles.description}>{description}</p>
          </div>
        </div>

        {action}
      </div>

      <div className={statsClassName}>
        {stats.map((stat, index) => (
          <div className={statCardClassName} key={`${stat.label}-${index}`}>
            <span className={statLabelClassName}>{stat.label}</span>
            <strong className={statValueClassName}>{stat.value}</strong>
          </div>
        ))}
      </div>
    </Panel>
  )
}
