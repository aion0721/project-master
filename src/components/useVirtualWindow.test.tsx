import { render, screen } from '@testing-library/react'
import { useRef, type RefObject } from 'react'
import { describe, expect, it } from 'vitest'
import { useVirtualWindow } from './useVirtualWindow'

interface HarnessProps {
  itemCount: number
  scrollTop: number
}

function setElementMetrics(element: HTMLDivElement, scrollTop: number) {
  Object.defineProperty(element, 'clientHeight', {
    configurable: true,
    value: 144,
  })

  let currentScrollTop = scrollTop
  Object.defineProperty(element, 'scrollTop', {
    configurable: true,
    get: () => currentScrollTop,
    set: (value: number) => {
      currentScrollTop = value
    },
  })
}

function ResultView({
  containerRef,
  itemCount,
}: {
  containerRef: RefObject<HTMLDivElement | null>
  itemCount: number
}) {
  const { startIndex, endIndex, paddingTop, paddingBottom } = useVirtualWindow({
    containerRef,
    itemCount,
    getItemSize: () => 72,
    overscan: 2,
  })

  return (
    <output data-testid="window-state">
      {JSON.stringify({ startIndex, endIndex, paddingTop, paddingBottom })}
    </output>
  )
}

function Harness({ itemCount, scrollTop }: HarnessProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  return (
    <div
      ref={(node) => {
        if (node) {
          setElementMetrics(node, scrollTop)
        }
        containerRef.current = node
      }}
    >
      <ResultView containerRef={containerRef} itemCount={itemCount} />
    </div>
  )
}

describe('useVirtualWindow', () => {
  it('件数が減ったときに古いスクロール位置をクランプする', () => {
    const { rerender } = render(<Harness itemCount={30} scrollTop={900} />)

    rerender(<Harness itemCount={10} scrollTop={900} />)

    expect(screen.getByTestId('window-state')).toHaveTextContent(
      JSON.stringify({
        startIndex: 6,
        endIndex: 9,
        paddingTop: 432,
        paddingBottom: 0,
      }),
    )
  })
})
