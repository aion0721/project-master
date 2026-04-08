import { fireEvent, screen, waitFor } from '@testing-library/react'
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

describe('ProjectStatusBulkSync', () => {
  it('完了を全フェーズへ反映して保存できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('project-status-edit-button'))
    fireEvent.change(screen.getByTestId('project-status-override-select'), {
      target: { value: '完了' },
    })
    fireEvent.click(screen.getByTestId('project-status-apply-all-phases'))
    fireEvent.click(screen.getByTestId('project-status-override-save-button'))

    await waitFor(() => {
      const phasesCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/projects/PRJ-001/phases') && init?.method === 'PATCH'
      })

      expect(phasesCall).toBeDefined()
      const phasesBody = JSON.parse(String(phasesCall?.[1]?.body))
      expect(phasesBody.phases).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'ph-p1-1', status: '完了', progress: 100 }),
          expect.objectContaining({ id: 'ph-p1-2', status: '完了', progress: 100 }),
          expect.objectContaining({ id: 'ph-p1-3', status: '完了', progress: 100 }),
        ]),
      )

      const statusCall = fetchSpy.mock.calls.find(([url, init]) => {
        return (
          String(url).includes('/api/projects/PRJ-001/status-override') &&
          init?.method === 'PATCH'
        )
      })

      expect(statusCall).toBeDefined()
      const statusBody = JSON.parse(String(statusCall?.[1]?.body))
      expect(statusBody).toEqual({ statusOverride: '完了' })
    })
  })
})
