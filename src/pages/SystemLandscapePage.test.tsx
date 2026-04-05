import { renderWithProviders } from '../test/renderWithProviders'
import { mockProjectApi } from '../test/mockProjectApi'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SystemLandscapePage } from './SystemLandscapePage'

describe('SystemLandscapePage', () => {
  it('関連図と矢印ラベルを表示する', async () => {
    mockProjectApi()

    renderWithProviders(<SystemLandscapePage />, {
      initialEntries: ['/systems/diagram'],
    })

    expect(await screen.findByRole('heading', { name: 'システム関連図' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'システム関連図' })).toBeInTheDocument()
    expect(screen.getAllByText('仕向け → 被仕向け').length).toBeGreaterThan(0)
  })
})
