import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { MemberHierarchyPage } from './MemberHierarchyPage'

describe('MemberHierarchyPage', () => {
  it('クエリの memberId を初期ハイライトに反映する', async () => {
    mockProjectApi()

    renderWithProviders(<MemberHierarchyPage />, {
      initialEntries: ['/members/hierarchy?memberId=m4'],
    })

    expect(await screen.findByRole('heading', { name: 'メンバー体制図' })).toBeInTheDocument()
    expect(screen.getByTestId('member-hierarchy-view-tree')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('部署を選択すると、その部署のメンバー体制を表示できます。')).toBeInTheDocument()
  })

  it('全部署ではフロー表示を停止する', async () => {
    mockProjectApi()

    renderWithProviders(<MemberHierarchyPage />, {
      initialEntries: ['/members/hierarchy?memberId=m2'],
    })

    await screen.findByRole('heading', { name: 'メンバー体制図' })

    expect(screen.getByTestId('member-hierarchy-view-flow')).toBeDisabled()
    expect(screen.getByTestId('member-hierarchy-view-tree')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('部署を選択すると、その部署のメンバー体制を表示できます。')).toBeInTheDocument()
  })

  it('部署指定がない場合は選択を促す', async () => {
    mockProjectApi()

    renderWithProviders(<MemberHierarchyPage />, {
      initialEntries: ['/members/hierarchy'],
    })

    await screen.findByRole('heading', { name: 'メンバー体制図' })
    expect(screen.getByText('部署を選択すると、その部署のメンバー体制を表示できます。')).toBeInTheDocument()
  })

  it('階層図ビューに切り替えると配下グループを表示できる', async () => {
    mockProjectApi()

    renderWithProviders(<MemberHierarchyPage />, {
      initialEntries: ['/members/hierarchy?departmentName=システム設計部&memberId=m2'],
    })

    await screen.findByRole('heading', { name: 'メンバー体制図' })

    fireEvent.click(screen.getByTestId('member-hierarchy-view-pyramid'))

    const hierarchyPyramid = screen.getByTestId('member-hierarchy-pyramid')

    expect(within(hierarchyPyramid).getByText('山本')).toBeInTheDocument()
    expect(within(hierarchyPyramid).getByText('選択中')).toBeInTheDocument()

    const descendantGroups = screen.getByTestId('member-hierarchy-descendant-groups')

    expect(within(descendantGroups).getByText('鈴木')).toBeInTheDocument()

    const suzukiGroup = screen.getByTestId('member-hierarchy-group-m3')

    expect(within(suzukiGroup).getByText('鈴木')).toBeInTheDocument()
  })

  it('部署を指定するとその部署のメンバー全員を表示する', async () => {
    mockProjectApi()

    renderWithProviders(<MemberHierarchyPage />, {
      initialEntries: ['/members/hierarchy?memberId=m1'],
    })

    await screen.findByRole('heading', { name: 'メンバー体制図' })

    fireEvent.focus(screen.getByTestId('member-hierarchy-department-select'))
    fireEvent.change(screen.getByTestId('member-hierarchy-department-select'), {
      target: { value: '品質保証部' },
    })
    fireEvent.keyDown(screen.getByTestId('member-hierarchy-department-select'), {
      key: 'Enter',
    })

    const hierarchyFlow = await screen.findByTestId('member-hierarchy-tree', {}, { timeout: 5000 })
    expect(within(hierarchyFlow).getAllByText('伊藤').length).toBeGreaterThan(0)
    expect(within(hierarchyFlow).getAllByText('渡辺').length).toBeGreaterThan(0)
    expect(within(hierarchyFlow).queryByText('田中')).not.toBeInTheDocument()
  })

  it('部署を指定するとフロー表示を有効化できる', async () => {
    mockProjectApi()

    renderWithProviders(<MemberHierarchyPage />, {
      initialEntries: ['/members/hierarchy'],
    })

    await screen.findByRole('heading', { name: 'メンバー体制図' })

    fireEvent.focus(screen.getByTestId('member-hierarchy-department-select'))
    fireEvent.change(screen.getByTestId('member-hierarchy-department-select'), {
      target: { value: 'PMO室' },
    })
    fireEvent.keyDown(screen.getByTestId('member-hierarchy-department-select'), {
      key: 'Enter',
    })

    await waitFor(() => {
      expect(screen.getByTestId('member-hierarchy-view-flow')).not.toBeDisabled()
    })

    const flowButton = screen.getByTestId('member-hierarchy-view-flow')

    fireEvent.click(flowButton)

    await waitFor(() => {
      expect(screen.queryByText('フロー表示を準備しています...')).not.toBeInTheDocument()
    }, { timeout: 10000 })

    const hierarchyFlow = screen.getByTestId('member-hierarchy-tree')
    expect(within(hierarchyFlow).getByText('中村')).toBeInTheDocument()
    expect(within(hierarchyFlow).getByText('PMO')).toBeInTheDocument()
  })
})
