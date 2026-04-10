import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { MemberHierarchyPage } from './MemberHierarchyPage'

describe('MemberHierarchyPage', () => {
  it('クエリの memberId を初期選択に反映する', async () => {
    mockProjectApi()

    renderWithProviders(<MemberHierarchyPage />, {
      initialEntries: ['/members/hierarchy?memberId=m4'],
    })

    expect(await screen.findByRole('heading', { name: 'メンバー体制図' })).toBeInTheDocument()
    expect(screen.getByTestId('member-hierarchy-select')).toHaveValue('m4')
  })

  it('デフォルトでフロー表示になっている', async () => {
    mockProjectApi()

    renderWithProviders(<MemberHierarchyPage />, {
      initialEntries: ['/members/hierarchy?memberId=m2'],
    })

    await screen.findByRole('heading', { name: 'メンバー体制図' })

    const hierarchyFlow = screen.getByTestId('member-hierarchy-tree')
    expect(within(hierarchyFlow).getByText('田中')).toBeInTheDocument()
    expect(within(hierarchyFlow).getByText('山本')).toBeInTheDocument()
    expect(within(hierarchyFlow).getByText('PM')).toBeInTheDocument()
  })

  it('ツリー表示で選択メンバーの関係を表示できる', async () => {
    mockProjectApi()

    renderWithProviders(<MemberHierarchyPage />, {
      initialEntries: ['/members/hierarchy'],
    })

    await screen.findByRole('heading', { name: 'メンバー体制図' })

    fireEvent.click(screen.getByTestId('member-hierarchy-view-tree'))
    fireEvent.change(screen.getByTestId('member-hierarchy-select'), {
      target: { value: 'm2' },
    })

    const hierarchyTree = screen.getByTestId('member-hierarchy-tree')

    expect(within(hierarchyTree).getAllByText('田中').length).toBeGreaterThan(0)
    expect(within(hierarchyTree).getAllByText('山本').length).toBeGreaterThan(0)
    expect(within(hierarchyTree).getAllByText('鈴木').length).toBeGreaterThan(0)
    expect(within(hierarchyTree).getByText('選択中')).toBeInTheDocument()
  })

  it('階層図ビューに切り替えると配下グループを表示できる', async () => {
    mockProjectApi()

    renderWithProviders(<MemberHierarchyPage />, {
      initialEntries: ['/members/hierarchy?memberId=m1'],
    })

    await screen.findByRole('heading', { name: 'メンバー体制図' })

    fireEvent.click(screen.getByTestId('member-hierarchy-view-pyramid'))

    const hierarchyPyramid = screen.getByTestId('member-hierarchy-pyramid')

    expect(within(hierarchyPyramid).getByText('田中')).toBeInTheDocument()
    expect(within(hierarchyPyramid).getByText('選択中')).toBeInTheDocument()

    const descendantGroups = screen.getByTestId('member-hierarchy-descendant-groups')

    expect(within(descendantGroups).getByText('山本')).toBeInTheDocument()
    expect(within(descendantGroups).getByText('高橋')).toBeInTheDocument()
    expect(within(descendantGroups).getByText('中村')).toBeInTheDocument()

    const takahashiGroup = screen.getByTestId('member-hierarchy-group-m4')
    const yamamotoGroup = screen.getByTestId('member-hierarchy-group-m2')

    expect(within(takahashiGroup).getByText('高橋')).toBeInTheDocument()
    expect(within(takahashiGroup).getByText('伊藤')).toBeInTheDocument()
    expect(within(takahashiGroup).getByText('小林')).toBeInTheDocument()
    expect(within(takahashiGroup).getByText('渡辺')).toBeInTheDocument()
    expect(within(yamamotoGroup).getByText('山本')).toBeInTheDocument()
    expect(within(yamamotoGroup).getByText('鈴木')).toBeInTheDocument()
    expect(within(yamamotoGroup).getByText('加藤')).toBeInTheDocument()
    expect(within(yamamotoGroup).getByText('木村')).toBeInTheDocument()
  })

  it('部署を指定するとその部署のメンバーだけを選択対象にする', async () => {
    mockProjectApi()

    renderWithProviders(<MemberHierarchyPage />, {
      initialEntries: ['/members/hierarchy?memberId=m1'],
    })

    await screen.findByRole('heading', { name: 'メンバー体制図' })

    fireEvent.change(screen.getByTestId('member-hierarchy-department-select'), {
      target: { value: '品質保証部' },
    })

    expect(screen.getByTestId('member-hierarchy-select')).toHaveValue('m10')
    expect(screen.getByRole('option', { name: '伊藤 (テストリーダー)' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '渡辺 (QAエンジニア)' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: '田中 (PM)' })).not.toBeInTheDocument()
  })
})
