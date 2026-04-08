import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { projects } from '../../data/mockData'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { ProjectDetailPage } from './ProjectDetailPage'

const project = projects.find((item) => item.projectNumber === 'PRJ-001')!

function renderPage() {
  return renderWithProviders(<ProjectDetailPage />, {
    initialEntries: ['/projects/PRJ-001'],
    routePath: '/projects/:projectNumber',
  })
}

describe('ProjectDetailHero', () => {
  it('折りたたみ表示に切り替えられる', async () => {
    mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    expect(screen.getByTestId('current-phase-card')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('project-hero-toggle-button'))

    expect(screen.queryByTestId('current-phase-card')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Heroを開く' })).toBeInTheDocument()
    expect(window.localStorage.getItem('project-master:hero-collapsed:project-detail')).toBe('true')

    fireEvent.click(screen.getByTestId('project-hero-toggle-button'))

    expect(await screen.findByTestId('current-phase-card')).toBeInTheDocument()
  })
})
