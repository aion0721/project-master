import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { SystemRelationManagementPage } from './SystemRelationManagementPage'

describe('SystemRelationManagementPage', () => {
  it('関連システムを追加して削除できる', async () => {
    mockProjectApi()
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderWithProviders(<SystemRelationManagementPage />, {
      initialEntries: ['/systems/relations'],
    })

    const selects = await screen.findAllByRole('combobox')
    expect(
      within(selects[0]).getByRole('option', { name: 'sys-accounting / 会計基盤' }),
    ).toBeInTheDocument()
    expect(
      within(selects[1]).getByRole('option', { name: 'sys-sales-bi / 営業管理BI' }),
    ).toBeInTheDocument()

    fireEvent.change(selects[0], {
      target: { value: 'sys-accounting' },
    })
    fireEvent.change(selects[1], {
      target: { value: 'sys-sales-bi' },
    })
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '会計データを営業管理BIへ連携' },
    })
    fireEvent.click(screen.getAllByRole('button')[0])

    const relationRow = await screen.findByTestId('system-relation-row-rel-004')
    expect(relationRow).toHaveTextContent('会計基盤')
    expect(relationRow).toHaveTextContent('営業管理BI')

    fireEvent.click(screen.getByTestId('delete-system-relation-rel-004'))

    await waitFor(() => {
      expect(screen.queryByTestId('system-relation-row-rel-004')).not.toBeInTheDocument()
    })
  })
})
