import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Panel.module.css'

type PanelElement = 'section' | 'div' | 'article'
type PanelVariant = 'hero' | 'section' | 'compact' | 'plain'

interface PanelProps extends HTMLAttributes<HTMLElement> {
  as?: PanelElement
  children: ReactNode
  className?: string
  variant?: PanelVariant
}

export function Panel({
  as = 'section',
  children,
  className,
  variant = 'section',
  ...rest
}: PanelProps) {
  const Tag = as

  return (
    <Tag className={[styles.base, styles[variant], className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Tag>
  )
}
