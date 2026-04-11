import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { MemberDetailPage } from './MemberDetailPage'

describe('MemberDetailPage', () => {
  it('renders member details with related projects and systems', async () => {
    mockProjectApi()

    renderWithProviders(<MemberDetailPage />, {
      initialEntries: ['/members/m4'],
      routePath: '/members/:memberId',
    })

    expect(await screen.findByRole('heading', { name: '高橋' })).toBeInTheDocument()
    expect(screen.getAllByText('インフラリーダー').length).toBeGreaterThan(0)
    expect(screen.getAllByText('基盤ライン').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'メンバー一覧' })).toHaveAttribute('href', '/members')
    expect(screen.getByRole('link', { name: '階層図' })).toHaveAttribute(
      'href',
      '/members/hierarchy?departmentName=%E3%82%A4%E3%83%B3%E3%83%95%E3%83%A9%E5%9F%BA%E7%9B%A4%E9%83%A8&memberId=m4',
    )

    const projectsSection = screen.getByRole('heading', { name: '関連案件' }).closest('section')
    expect(projectsSection).not.toBeNull()
    expect(screen.getByRole('link', { name: /会計刷新/ })).toHaveAttribute('href', '/projects/PRJ-001')
    expect(screen.getByRole('link', { name: /会計刷新/ })).toHaveTextContent('インフラ統括')

    expect(screen.getByRole('link', { name: /会計基盤/ })).toHaveAttribute(
      'href',
      '/systems/sys-accounting',
    )
    expect(screen.getByRole('link', { name: /会計基盤/ })).toHaveTextContent('運用統括')

    const relationshipSection = screen.getByRole('heading', { name: '上下関係' }).closest('section')
    expect(relationshipSection).not.toBeNull()
    expect(within(relationshipSection as HTMLElement).getByRole('link', { name: /田中/ })).toHaveAttribute(
      'href',
      '/members/m1',
    )
    expect(within(relationshipSection as HTMLElement).getByRole('link', { name: /伊藤/ })).toHaveAttribute(
      'href',
      '/members/m10',
    )

    const hierarchySection = screen.getByRole('heading', { name: '体制図' }).closest('section')
    expect(hierarchySection).not.toBeNull()
    expect(within(hierarchySection as HTMLElement).getByText('インフラ基盤部 のメンバーを表示し、高橋 を起点として強調しています。')).toBeInTheDocument()
    expect(within(hierarchySection as HTMLElement).getByRole('link', { name: '体制図ページで開く' })).toHaveAttribute(
      'href',
      '/members/hierarchy?departmentName=%E3%82%A4%E3%83%B3%E3%83%95%E3%83%A9%E5%9F%BA%E7%9B%A4%E9%83%A8&memberId=m4',
    )
    const hierarchyCanvas = within(hierarchySection as HTMLElement).getByTestId('member-detail-hierarchy')
    expect(within(hierarchyCanvas).getByText('高橋')).toBeInTheDocument()
    expect(within(hierarchyCanvas).getByText('小林')).toBeInTheDocument()
    expect(within(hierarchyCanvas).queryByText('伊藤')).not.toBeInTheDocument()
  })

  it('shows not found state for unknown member', async () => {
    mockProjectApi()

    renderWithProviders(<MemberDetailPage />, {
      initialEntries: ['/members/unknown'],
      routePath: '/members/:memberId',
    })

    expect(await screen.findByRole('heading', { name: '該当メンバーが見つかりません' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'メンバー一覧へ戻る' })).toHaveAttribute('href', '/members')
  })
})
