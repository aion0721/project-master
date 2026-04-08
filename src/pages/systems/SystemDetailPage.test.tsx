import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { SystemDetailPage } from './SystemDetailPage'

function renderPage() {
  return renderWithProviders(<SystemDetailPage />, {
    initialEntries: ['/systems/sys-accounting'],
    routePath: '/systems/:systemId',
  })
}

describe('SystemDetailPage', () => {
  it('システム詳細と体制を表示する', async () => {
    mockProjectApi()

    renderPage()

    expect(await screen.findByRole('heading', { name: '会計基盤' })).toBeInTheDocument()
    expect(screen.getByText('m1 / 田中')).toBeInTheDocument()
    expect(screen.getByText('PRJ-001 / 基幹会計刷新')).toBeInTheDocument()
    expect(screen.getByTestId('system-link-anchor-0')).toHaveAttribute(
      'href',
      'https://example.com/systems/sys-accounting/wiki',
    )
    expect(screen.getByText('業務窓口')).toBeInTheDocument()
    expect(screen.getByText('基盤担当')).toBeInTheDocument()
    expect(screen.getByText(/プロトコル:\s*HTTPS/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '関連図を開く' })).toHaveAttribute('href', '/systems/diagram')
  })

  it('関連リンクを編集保存できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: '会計基盤' })

    const linksSection = screen.getByRole('heading', { name: '関連リンク' }).closest('section')
    expect(linksSection).not.toBeNull()
    fireEvent.click(within(linksSection!).getByRole('button', { name: '編集' }))
    fireEvent.change(await screen.findByTestId('system-link-label-0'), {
      target: { value: '運用Runbook' },
    })
    fireEvent.change(screen.getByTestId('system-link-url-0'), {
      target: { value: 'https://example.com/systems/sys-accounting/runbook' },
    })
    fireEvent.click(screen.getByRole('button', { name: '追加' }))
    fireEvent.change(await screen.findByTestId('system-link-label-1'), {
      target: { value: '障害対応メモ' },
    })
    fireEvent.change(screen.getByTestId('system-link-url-1'), {
      target: { value: 'https://example.com/systems/sys-accounting/incident' },
    })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => {
      const systemCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/systems/sys-accounting') && init?.method === 'PATCH'
      })

      expect(systemCall).toBeDefined()
      const body = JSON.parse(String(systemCall?.[1]?.body))
      expect(body.systemLinks).toEqual([
        {
          label: '運用Runbook',
          url: 'https://example.com/systems/sys-accounting/runbook',
        },
        {
          label: '障害対応メモ',
          url: 'https://example.com/systems/sys-accounting/incident',
        },
      ])
    })
  })

  it('システム基本情報を編集保存できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: '会計基盤' })

    const overviewSection = screen.getByRole('heading', { name: '概要' }).closest('section')
    expect(overviewSection).not.toBeNull()
    fireEvent.click(within(overviewSection!).getByRole('button', { name: '編集' }))
    fireEvent.change(screen.getByTestId('system-detail-name-input'), {
      target: { value: '会計基盤統合' },
    })
    fireEvent.change(screen.getByTestId('system-detail-category-input'), {
      target: { value: '共通基盤' },
    })
    fireEvent.change(screen.getByTestId('system-detail-owner-select'), {
      target: { value: 'm6' },
    })
    fireEvent.change(screen.getByTestId('system-detail-note-input'), {
      target: { value: '月次締め処理と周辺IFを統合管理する。' },
    })
    fireEvent.click(screen.getByRole('button', { name: '保存' }))

    await waitFor(() => {
      const systemCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/systems/sys-accounting') && init?.method === 'PATCH'
      })

      expect(systemCall).toBeDefined()
      const body = JSON.parse(String(systemCall?.[1]?.body))
      expect(body).toEqual(
        expect.objectContaining({
          name: '会計基盤統合',
          category: '共通基盤',
          ownerMemberId: 'm6',
          note: '月次締め処理と周辺IFを統合管理する。',
        }),
      )
    })

    await waitFor(() => {
      const structureCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/systems/sys-accounting/structure') && init?.method === 'PATCH'
      })

      expect(structureCall).toBeDefined()
      const body = JSON.parse(String(structureCall?.[1]?.body))
      expect(body.ownerMemberId).toBe('m6')
    })

    expect(await screen.findByText('m6 / 中村')).toBeInTheDocument()
  })

  it('所管部署を専用セクションから編集保存できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: '会計基盤' })

    const departmentSection = screen.getByRole('heading', { name: '所管部署' }).closest('section')
    expect(departmentSection).not.toBeNull()

    fireEvent.click(within(departmentSection!).getByRole('button', { name: '編集' }))
    fireEvent.click(screen.getByTestId('system-detail-department-事業推進部'))
    fireEvent.click(screen.getByTestId('system-detail-department-PMO室'))
    fireEvent.click(within(departmentSection!).getByRole('button', { name: '保存' }))

    await waitFor(() => {
      const systemCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/systems/sys-accounting') && init?.method === 'PATCH'
      })

      expect(systemCall).toBeDefined()
      const body = JSON.parse(String(systemCall?.[1]?.body))
      expect(body.departmentNames).toEqual(['システム設計部', 'PMO室'])
    })

    expect(await screen.findByText('システム設計部 / PMO室')).toBeInTheDocument()
  })

  it('システム体制を編集保存できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: '会計基盤' })
    await screen.findByText('基盤担当')

    fireEvent.click(screen.getByTestId('system-structure-edit-toggle'))
    await waitFor(() => {
      expect(screen.getByTestId('system-structure-owner-select')).toBeInTheDocument()
    })
    fireEvent.change(screen.getByTestId('system-structure-owner-select'), {
      target: { value: 'm6' },
    })
    fireEvent.click(screen.getByRole('button', { name: '追加' }))
    fireEvent.change(screen.getByTestId('system-structure-responsibility-4'), {
      target: { value: '監視担当' },
    })
    fireEvent.change(screen.getByTestId('system-structure-member-4'), {
      target: { value: 'm10' },
    })
    fireEvent.change(screen.getByTestId('system-structure-reports-to-4'), {
      target: { value: 'm4' },
    })
    fireEvent.click(screen.getByTestId('system-structure-save-button'))

    await waitFor(() => {
      const structureCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/systems/sys-accounting/structure') && init?.method === 'PATCH'
      })

      expect(structureCall).toBeDefined()
      const body = JSON.parse(String(structureCall?.[1]?.body))
      expect(body.ownerMemberId).toBe('m6')
      expect(body.assignments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            memberId: 'm10',
            responsibility: '監視担当',
            reportsToMemberId: 'm4',
          }),
        ]),
      )
    })
  })

  it('関連システムを追加できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: '会計基盤' })

    fireEvent.change(screen.getByRole('combobox', { name: '向き' }), {
      target: { value: 'outgoing' },
    })
    fireEvent.change(screen.getByRole('combobox', { name: '接続先システム' }), {
      target: { value: 'sys-sales-bi' },
    })
    fireEvent.change(screen.getByPlaceholderText('例: SSH / HTTPS / SFTP'), {
      target: { value: 'SSH' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'メモ' }), {
      target: { value: '夜間バッチ接続' },
    })
    fireEvent.click(screen.getByRole('button', { name: '関連システムを追加' }))

    await waitFor(() => {
      const relationCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/system-relations') && init?.method === 'POST'
      })

      expect(relationCall).toBeDefined()
      const body = JSON.parse(String(relationCall?.[1]?.body))
      expect(body).toEqual({
        sourceSystemId: 'sys-accounting',
        targetSystemId: 'sys-sales-bi',
        protocol: 'SSH',
        note: '夜間バッチ接続',
      })
    })

    expect(await screen.findByRole('link', { name: 'sys-sales-bi / 営業管理BI' })).toBeInTheDocument()
    expect(screen.getByText(/プロトコル:\s*SSH/)).toBeInTheDocument()
  })

  it('関連システムを削除できる', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: '会計基盤' })

    fireEvent.click(screen.getByTestId('system-detail-delete-relation-rel-001'))

    await waitFor(() => {
      const relationCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/system-relations/rel-001') && init?.method === 'DELETE'
      })

      expect(relationCall).toBeDefined()
    })

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'sys-portal / 社内ポータル' })).not.toBeInTheDocument()
    })

    confirmSpy.mockRestore()
  })
})
