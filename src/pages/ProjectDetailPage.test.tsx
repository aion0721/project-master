import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { assignments, phases, projects } from '../data/mockData'
import { mockProjectApi } from '../test/mockProjectApi'
import { renderWithProviders } from '../test/renderWithProviders'
import { ProjectDetailPage } from './ProjectDetailPage'

const project = projects.find((item) => item.projectNumber === 'PRJ-001')!
const currentPhase = phases.find((item) => item.id === 'ph-p1-2')!
const nextPhase = phases.find((item) => item.id === 'ph-p1-3')!
const delayedStatus = projects.find((item) => item.projectNumber === 'PRJ-002')!.status
const editableAssignment = assignments.find((item) => item.id === 'as-p1-3')!

describe('ProjectDetailPage', () => {
  it('案件詳細と現在フェーズを表示する', async () => {
    mockProjectApi()

    renderWithProviders(<ProjectDetailPage />, {
      initialEntries: ['/projects/PRJ-001'],
      routePath: '/projects/:projectNumber',
    })

    expect(await screen.findByRole('heading', { name: project.name })).toBeInTheDocument()
    expect(screen.getByTestId('current-phase-value')).toHaveTextContent(currentPhase.name)
    expect(screen.getByTestId('current-phase-edit-button')).toBeInTheDocument()
    expect(screen.getByTestId('project-schedule-value')).toBeInTheDocument()
    expect(screen.queryByTestId('structure-editor')).not.toBeInTheDocument()
  })

  it('開始日と終了日を更新できる', async () => {
    const fetchSpy = mockProjectApi()

    renderWithProviders(<ProjectDetailPage />, {
      initialEntries: ['/projects/PRJ-001'],
      routePath: '/projects/:projectNumber',
    })

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('project-schedule-edit-button'))
    fireEvent.change(screen.getByTestId('project-schedule-start'), {
      target: { value: '2026-04-13' },
    })
    fireEvent.change(screen.getByTestId('project-schedule-end'), {
      target: { value: '2026-07-03' },
    })
    fireEvent.click(screen.getByTestId('project-schedule-save-button'))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/PRJ-001/schedule'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            startDate: '2026-04-13',
            endDate: '2026-07-03',
          }),
        }),
      )
    })
  })

  it('現在フェーズを変更できる', async () => {
    const fetchSpy = mockProjectApi()

    renderWithProviders(<ProjectDetailPage />, {
      initialEntries: ['/projects/PRJ-001'],
      routePath: '/projects/:projectNumber',
    })

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('current-phase-edit-button'))
    fireEvent.change(screen.getByTestId('current-phase-select'), {
      target: { value: nextPhase.id },
    })
    fireEvent.click(screen.getByTestId('current-phase-save-button'))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/PRJ-001/current-phase'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            phaseId: nextPhase.id,
          }),
        }),
      )
    })
  })

  it('フェーズの状態と進捗率と週を更新できる', async () => {
    const fetchSpy = mockProjectApi()

    renderWithProviders(<ProjectDetailPage />, {
      initialEntries: ['/projects/PRJ-001'],
      routePath: '/projects/:projectNumber',
    })

    await screen.findByRole('heading', { name: project.name })

    fireEvent.change(screen.getByTestId('phase-start-ph-p1-2'), { target: { value: '4' } })
    fireEvent.change(screen.getByTestId('phase-end-ph-p1-2'), { target: { value: '6' } })
    fireEvent.change(screen.getByTestId('phase-progress-ph-p1-2'), { target: { value: '80' } })
    fireEvent.change(screen.getByTestId('phase-status-ph-p1-2'), {
      target: { value: delayedStatus },
    })
    fireEvent.click(screen.getByTestId('phase-save-ph-p1-2'))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/phases/ph-p1-2'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            startWeek: 4,
            endWeek: 6,
            status: delayedStatus,
            progress: 80,
          }),
        }),
      )
    })
  })

  it('プロジェクト体制を編集モードで更新できる', async () => {
    const fetchSpy = mockProjectApi()

    renderWithProviders(<ProjectDetailPage />, {
      initialEntries: ['/projects/PRJ-001'],
      routePath: '/projects/:projectNumber',
    })

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('structure-edit-toggle'))
    fireEvent.change(screen.getByTestId('structure-pm-select'), {
      target: { value: 'm6' },
    })
    fireEvent.click(screen.getByTestId('structure-save-button'))

    await waitFor(() => {
      const structureCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/projects/PRJ-001/structure') && init?.method === 'PATCH'
      })

      expect(structureCall).toBeDefined()
      const body = JSON.parse(String(structureCall?.[1]?.body))
      expect(body.pmMemberId).toBe('m6')
      expect(body.assignments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            responsibility: editableAssignment.responsibility,
            memberId: editableAssignment.memberId,
          }),
        ]),
      )
    })
  })
})
