import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { SystemRelationManagementPage } from './SystemRelationManagementPage'

describe('SystemRelationManagementPage', () => {
  it('関連システムを登録して削除できる', async () => {
    mockProjectApi()

    renderWithProviders(<SystemRelationManagementPage />, {
      initialEntries: ['/systems/relations'],
    })

    await screen.findByRole('heading', { name: '関係一覧' })

    fireEvent.change(screen.getByLabelText('接続元システム'), {
      target: { value: 'sys-accounting' },
    })
    fireEvent.change(screen.getByLabelText('接続先システム'), {
      target: { value: 'sys-sales-bi' },
    })
    fireEvent.change(screen.getByLabelText('メモ'), {
      target: { value: '会計データを分析基盤へ転送' },
    })
    fireEvent.click(screen.getByRole('button', { name: '関連システムを登録' }))

    const relationRow = await screen.findByTestId('system-relation-row-rel-004')
    expect(relationRow).toHaveTextContent('会計基盤')
    expect(relationRow).toHaveTextContent('営業管理BI')

    fireEvent.click(screen.getByTestId('delete-system-relation-rel-004'))

    await waitFor(() => {
      expect(screen.queryByTestId('system-relation-row-rel-004')).not.toBeInTheDocument()
    })
  })
})
