import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { assignments, phases, projects } from '../data/mockData'
import { mockProjectApi } from '../test/mockProjectApi'
import { renderWithProviders } from '../test/renderWithProviders'
import { ProjectDetailPage } from './ProjectDetailPage'

const project = projects.find((item) => item.projectNumber === 'PRJ-001')!
const currentPhase = phases.find((item) => item.id === 'ph-p1-2')!
const nextPhase = phases.find((item) => item.id === 'ph-p1-3')!
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
    expect(screen.getByTestId('project-link-anchor')).toHaveAttribute('href', project.projectLink)
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

  it('案件リンクを更新できる', async () => {
    const fetchSpy = mockProjectApi()

    renderWithProviders(<ProjectDetailPage />, {
      initialEntries: ['/projects/PRJ-001'],
      routePath: '/projects/:projectNumber',
    })

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('project-link-edit-button'))
    fireEvent.change(screen.getByTestId('project-link-input'), {
      target: { value: 'https://example.com/projects/PRJ-001/review' },
    })
    fireEvent.click(screen.getByTestId('project-link-save-button'))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/PRJ-001/link'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            projectLink: 'https://example.com/projects/PRJ-001/review',
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

  it('案件ごとのフェーズ構成を保存できる', async () => {
    const fetchSpy = mockProjectApi()

    renderWithProviders(<ProjectDetailPage />, {
      initialEntries: ['/projects/PRJ-001'],
      routePath: '/projects/:projectNumber',
    })

    await screen.findByRole('heading', { name: project.name })

    fireEvent.change(await screen.findByTestId('phase-name-ph-p1-2'), {
      target: { value: '予備検討' },
    })
    fireEvent.click(await screen.findByTestId('phase-remove-ph-p1-3'))
    fireEvent.click(screen.getByTestId('phase-structure-save-button'))

    await waitFor(() => {
      const phaseCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/projects/PRJ-001/phases') && init?.method === 'PATCH'
      })

      expect(phaseCall).toBeDefined()
      const body = JSON.parse(String(phaseCall?.[1]?.body))
      expect(body.phases).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'ph-p1-2',
            name: '予備検討',
          }),
        ]),
      )
      expect(body.phases).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'ph-p1-3',
          }),
        ]),
      )
    })
  })

  it('フェーズを上下移動して保存順を変更できる', async () => {
    const fetchSpy = mockProjectApi()

    renderWithProviders(<ProjectDetailPage />, {
      initialEntries: ['/projects/PRJ-001'],
      routePath: '/projects/:projectNumber',
    })

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(await screen.findByTestId('phase-move-up-ph-p1-3'))
    fireEvent.click(screen.getByTestId('phase-structure-save-button'))

    await waitFor(() => {
      const phaseCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/projects/PRJ-001/phases') && init?.method === 'PATCH'
      })

      expect(phaseCall).toBeDefined()
      const body = JSON.parse(String(phaseCall?.[1]?.body))
      expect(body.phases[1]?.id).toBe('ph-p1-3')
      expect(body.phases[2]?.id).toBe('ph-p1-2')
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
    fireEvent.change(screen.getByTestId('structure-reports-to-0'), {
      target: { value: 'm2' },
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
            responsibility: '基礎検討',
            memberId: 'm8',
            reportsToMemberId: 'm2',
          }),
          expect.objectContaining({
            responsibility: editableAssignment.responsibility,
            memberId: editableAssignment.memberId,
            reportsToMemberId: 'm1',
          }),
        ]),
      )
    })
  })
})
