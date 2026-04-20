import { useState, type ReactNode } from 'react'
import type { ProjectLink } from '../types/project'
import { isNetworkPath } from '../utils/projectLinkUtils'
import { Button } from './ui/Button'

interface LinkTargetListProps {
  emptyContent: ReactNode
  linkClassName: string
  links: ProjectLink[]
  listClassName: string
  rowClassName: string
  testIdPrefix: string
  valueClassName: string
}

export function LinkTargetList({
  emptyContent,
  linkClassName,
  links,
  listClassName,
  rowClassName,
  testIdPrefix,
  valueClassName,
}: LinkTargetListProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  async function handleCopy(url: string, index: number) {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      return
    }

    await navigator.clipboard.writeText(url)
    setCopiedIndex(index)
    window.setTimeout(() => {
      setCopiedIndex((current) => (current === index ? null : current))
    }, 1600)
  }

  if (links.length === 0) {
    return emptyContent
  }

  return (
    <div className={listClassName}>
      {links.map((link, index) => (
        <div className={rowClassName} key={`${link.label}-${link.url}-${index}`}>
          {isNetworkPath(link.url) ? (
            <span className={valueClassName} data-testid={`${testIdPrefix}-path-${index}`}>
              {link.label}
            </span>
          ) : (
            <a
              className={linkClassName}
              data-testid={`${testIdPrefix}-anchor-${index}`}
              href={link.url}
              rel="noreferrer"
              target="_blank"
            >
              {link.label}
            </a>
          )}
          <Button
            data-testid={`${testIdPrefix}-copy-${index}`}
            onClick={() => {
              void handleCopy(link.url, index)
            }}
            size="small"
            variant="secondary"
          >
            {copiedIndex === index ? 'コピー済み' : 'コピー'}
          </Button>
        </div>
      ))}
    </div>
  )
}
