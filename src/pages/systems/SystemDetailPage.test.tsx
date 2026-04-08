import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
  })

  it('関連リンクを編集保存できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: '会計基盤' })

    fireEvent.click(screen.getAllByRole('button', { name: '編集' })[0]!)
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

  it('システム体制を編集保存できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: '会計基盤' })

    fireEvent.click(screen.getByTestId('system-structure-edit-toggle'))
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
})
