import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../test/mockProjectApi'
import { renderWithProviders } from '../test/renderWithProviders'
import { MemberHierarchyPage } from './MemberHierarchyPage'

describe('MemberHierarchyPage', () => {
  it('クエリの memberId を初期選択に使える', async () => {
    mockProjectApi()

    renderWithProviders(<MemberHierarchyPage />, {
      initialEntries: ['/members/hierarchy?memberId=m4'],
    })

    expect(await screen.findByRole('heading', { name: 'メンバー体制図' })).toBeInTheDocument()
    expect(screen.getByTestId('member-hierarchy-select')).toHaveValue('m4')
  })

  it('選択したメンバーの上下関係を表示できる', async () => {
    mockProjectApi()

    renderWithProviders(<MemberHierarchyPage />, {
      initialEntries: ['/members/hierarchy'],
    })

    await screen.findByRole('heading', { name: 'メンバー体制図' })

    fireEvent.change(screen.getByTestId('member-hierarchy-select'), {
      target: { value: 'm2' },
    })

    const hierarchyTree = screen.getByTestId('member-hierarchy-tree')

    expect(within(hierarchyTree).getByText('m1')).toBeInTheDocument()
    expect(within(hierarchyTree).getByText('m2')).toBeInTheDocument()
    expect(within(hierarchyTree).getByText('m3')).toBeInTheDocument()
    expect(within(hierarchyTree).getByText('選択中')).toBeInTheDocument()
  })
})
