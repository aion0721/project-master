import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from './ui/Button'
import { Panel } from './ui/Panel'
import styles from './ListPageFilterSection.module.css'

interface ListPageFilterSectionProps {
  body?: ReactNode
  className?: string
  collapsible?: boolean
  defaultExpanded?: boolean
  expanded?: boolean
  onToggleExpanded?: () => void
  showToggleButton?: boolean
  summary?: ReactNode
  topRow: ReactNode
  visible?: boolean
}

export function ListPageFilterSection({
  body,
  className,
  collapsible = false,
  defaultExpanded = false,
  expanded,
  onToggleExpanded,
  showToggleButton = true,
  summary,
  topRow,
  visible = true,
}: ListPageFilterSectionProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const [shouldRender, setShouldRender] = useState(visible)
  const [contentHeight, setContentHeight] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const isExpanded = expanded ?? internalExpanded
  const shouldShowToggle = collapsible && Boolean(body)
  const shouldShowBody = body && (!shouldShowToggle || isExpanded)
  const handleToggle = () => {
    if (onToggleExpanded) {
      onToggleExpanded()
      return
    }

    setInternalExpanded((current) => !current)
  }

  useEffect(() => {
    if (visible) {
      const frameId = requestAnimationFrame(() => {
        setShouldRender(true)
      })

      return () => {
        cancelAnimationFrame(frameId)
      }
    }
  }, [visible])

  useLayoutEffect(() => {
    if (!shouldRender || !contentRef.current) {
      return
    }

    const measure = () => {
      setContentHeight(contentRef.current?.scrollHeight ?? 0)
    }

    measure()

    if (typeof ResizeObserver === 'undefined') {
      return
    }

    const observer = new ResizeObserver(() => {
      measure()
    })

    observer.observe(contentRef.current)

    return () => {
      observer.disconnect()
    }
  }, [className, shouldRender, shouldShowBody, summary, topRow])

  if (!shouldRender) {
    return null
  }

  return (
    <div
      aria-hidden={!visible}
      className={visible ? `${styles.wrapper} ${styles.wrapperVisible}` : styles.wrapper}
      onTransitionEnd={() => {
        if (!visible) {
          setShouldRender(false)
        }
      }}
      style={{ maxHeight: visible ? `${contentHeight}px` : '0px' }}
    >
      <div className={styles.inner} ref={contentRef}>
        <Panel className={[styles.panel, className].filter(Boolean).join(' ')} variant="section">
          <div className={styles.topRow}>{topRow}</div>
          {summary || (shouldShowToggle && showToggleButton) ? (
            <div className={styles.summaryRow}>
              {summary ? <div className={styles.summaryContent}>{summary}</div> : <div />}
              {shouldShowToggle && showToggleButton ? (
                <Button
                  aria-expanded={isExpanded}
                  onClick={handleToggle}
                  size="small"
                  variant="secondary"
                >
                  {isExpanded ? '絞り込みを閉じる' : '絞り込みを開く'}
                </Button>
              ) : null}
            </div>
          ) : null}
          {shouldShowBody ? <div className={styles.body}>{body}</div> : null}
        </Panel>
      </div>
    </div>
  )
}
