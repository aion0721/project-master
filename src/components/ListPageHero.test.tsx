import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ListPageHero } from './ListPageHero'

describe('ListPageHero', () => {
  it('Heroを折りたたんで状態を保存できる', () => {
    const { unmount } = render(
      <ListPageHero
        collapsible
        description="一覧説明"
        eyebrow="Project Portfolio"
        iconKind="project"
        stats={[
          { label: '総案件数', value: 5 },
          { label: '進行中', value: 3 },
        ]}
        storageKey="project-master:test-hero"
        title="案件一覧"
      />,
    )

    expect(screen.getByText('一覧説明')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Heroをたたむ' })).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Heroをたたむ' }))

    expect(screen.queryByText('一覧説明')).not.toBeInTheDocument()
    expect(screen.queryByText('総案件数')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Heroを開く' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('案件一覧')).toBeInTheDocument()
    expect(window.localStorage.getItem('project-master:test-hero')).toBe('true')

    unmount()

    render(
      <ListPageHero
        collapsible
        description="一覧説明"
        eyebrow="Project Portfolio"
        iconKind="project"
        stats={[
          { label: '総案件数', value: 5 },
          { label: '進行中', value: 3 },
        ]}
        storageKey="project-master:test-hero"
        title="案件一覧"
      />,
    )

    expect(screen.queryByText('一覧説明')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Heroを開く' })).toBeInTheDocument()
  })
})
