import type { ComponentProps, ReactNode } from 'react'
import pageStyles from '../styles/page.module.css'
import { ListPageContentSection } from './ListPageContentSection'
import { ListPageFilterSection } from './ListPageFilterSection'
import { ListPageHero } from './ListPageHero'

type ListPageHeroProps = ComponentProps<typeof ListPageHero>
type ListPageFilterSectionProps = ComponentProps<typeof ListPageFilterSection>
type ListPageContentSectionProps = ComponentProps<typeof ListPageContentSection>

interface ListPageScaffoldProps {
  children?: ReactNode
  className?: string
  contentProps?: Omit<ListPageContentSectionProps, 'children'>
  contentSection?: ReactNode
  filterProps?: ListPageFilterSectionProps
  filterSection?: ReactNode
  hero: ListPageHeroProps
}

export function ListPageScaffold({
  children,
  className,
  contentProps,
  contentSection,
  filterProps,
  filterSection,
  hero,
}: ListPageScaffoldProps) {
  return (
    <div className={[pageStyles.page, className].filter(Boolean).join(' ')}>
      <ListPageHero {...hero} />
      {filterSection ?? (filterProps ? <ListPageFilterSection {...filterProps} /> : null)}
      {contentSection ?? (contentProps ? <ListPageContentSection {...contentProps}>{children}</ListPageContentSection> : null)}
    </div>
  )
}
