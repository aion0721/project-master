import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { assignments, events, phases, projects } from '../data/mockData'
import { mockProjectApi } from '../test/mockProjectApi'
import { renderWithProviders } from '../test/renderWithProviders'
import { ProjectDetailPage } from './ProjectDetailPage'

const project = projects.find((item) => item.projectNumber === 'PRJ-001')!
const currentPhase = phases.find((item) => item.id === 'ph-p1-2')!
const nextPhase = phases.find((item) => item.id === 'ph-p1-3')!
const editableAssignment = assignments.find((item) => item.id === 'as-p1-3')!
const projectEvent = events.find((item) => item.id === 'ev-p1-1')!

function renderPage() {
  return renderWithProviders(<ProjectDetailPage />, {
    initialEntries: ['/projects/PRJ-001'],
    routePath: '/projects/:projectNumber',
  })
}

describe('ProjectDetailPage', () => {
  it('案件詳細と現在フェーズを表示する', async () => {
    mockProjectApi()

    renderPage()

    expect(await screen.findByRole('heading', { name: project.name })).toBeInTheDocument()
    expect(screen.getByText('会計基盤')).toBeInTheDocument()
    expect(screen.getByTestId('current-phase-value')).toHaveTextContent(currentPhase.name)
    expect(screen.getByTestId('project-link-anchor-0')).toHaveAttribute(
      'href',
      project.projectLinks[0]?.url,
    )
    expect(
      screen.getByTestId(`timeline-event-${projectEvent.id}-week-${projectEvent.week}`),
    ).toBeInTheDocument()
    expect(screen.getAllByText(projectEvent.name).length).toBeGreaterThan(0)
    expect(screen.queryByTestId('structure-editor')).not.toBeInTheDocument()
  })

  it('開始日と終了予定日を更新できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

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
      const scheduleCall = fetchSpy.mock.calls.find(([url, init]) => {
        return (
          String(url).includes('/api/projects/PRJ-001/schedule') && init?.method === 'PATCH'
        )
      })

      expect(scheduleCall).toBeDefined()
      const body = JSON.parse(String(scheduleCall?.[1]?.body))
      expect(body).toEqual({
        startDate: '2026-04-13',
        endDate: '2026-07-03',
      })
    })
  })

  it('案件リンクを複数更新できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('project-links-edit-button'))
    fireEvent.change(screen.getByTestId('project-link-label-0'), {
      target: { value: 'Review' },
    })
    fireEvent.change(screen.getByTestId('project-link-url-0'), {
      target: { value: 'https://example.com/projects/PRJ-001/review' },
    })
    fireEvent.click(screen.getByRole('button', { name: '追加' }))
    fireEvent.change(screen.getByTestId('project-link-label-2'), {
      target: { value: 'Minutes' },
    })
    fireEvent.change(screen.getByTestId('project-link-url-2'), {
      target: { value: 'https://example.com/projects/PRJ-001/minutes' },
    })
    fireEvent.click(screen.getByTestId('project-links-save-button'))

    await waitFor(() => {
      const linkCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/projects/PRJ-001/links') && init?.method === 'PATCH'
      })

      expect(linkCall).toBeDefined()
      const body = JSON.parse(String(linkCall?.[1]?.body))
      expect(body.projectLinks).toEqual([
        {
          label: 'Review',
          url: 'https://example.com/projects/PRJ-001/review',
        },
        {
          label: '設計共有',
          url: 'https://example.com/wiki/PRJ-001',
        },
        {
          label: 'Minutes',
          url: 'https://example.com/projects/PRJ-001/minutes',
        },
      ])
    })
  })

  it('現在フェーズを更新できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('current-phase-edit-button'))
    fireEvent.change(screen.getByTestId('current-phase-select'), {
      target: { value: nextPhase.id },
    })
    fireEvent.click(screen.getByTestId('current-phase-save-button'))

    await waitFor(() => {
      const phaseCall = fetchSpy.mock.calls.find(([url, init]) => {
        return (
          String(url).includes('/api/projects/PRJ-001/current-phase') && init?.method === 'PATCH'
        )
      })

      expect(phaseCall).toBeDefined()
      const body = JSON.parse(String(phaseCall?.[1]?.body))
      expect(body).toEqual({
        phaseId: nextPhase.id,
      })
    })
  })

  it('案件ごとのフェーズ構成を編集して保存できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.change(await screen.findByTestId('phase-name-ph-p1-2'), {
      target: { value: '基盤検討' },
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
            name: '基盤検討',
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

  it('フェーズを並び替えて保存できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

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

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('structure-edit-toggle'))
    fireEvent.change(screen.getByTestId('structure-pm-select'), {
      target: { value: 'm6' },
    })
    fireEvent.change(screen.getByTestId('structure-responsibility-0'), {
      target: { value: 'Review Lead' },
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
      expect(body.assignments).toContainEqual(
        expect.objectContaining({
          responsibility: 'Review Lead',
          memberId: 'm8',
          reportsToMemberId: 'm2',
        }),
      )
      expect(body.assignments).toContainEqual(
        expect.objectContaining({
          responsibility: editableAssignment.responsibility,
          memberId: editableAssignment.memberId,
          reportsToMemberId: 'm1',
        }),
      )
    })
  })

  it('関連イベントを追加と更新で保存できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.change(await screen.findByTestId('event-name-0'), {
      target: { value: '週次レビュー' },
    })
    fireEvent.change(screen.getByTestId('event-week-0'), {
      target: { value: '5' },
    })
    fireEvent.click(screen.getByTestId('project-events-add-button'))
    fireEvent.change(await screen.findByTestId('event-name-2'), {
      target: { value: '障害試験' },
    })
    fireEvent.change(screen.getByTestId('event-week-2'), {
      target: { value: '8' },
    })
    fireEvent.change(screen.getByTestId('event-owner-2'), {
      target: { value: 'm1' },
    })
    fireEvent.click(screen.getByTestId('project-events-save-button'))

    await waitFor(() => {
      const eventsCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/projects/PRJ-001/events') && init?.method === 'PATCH'
      })

      expect(eventsCall).toBeDefined()
      const body = JSON.parse(String(eventsCall?.[1]?.body))
      expect(body.events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: projectEvent.id,
            name: '週次レビュー',
            week: 5,
          }),
          expect.objectContaining({
            name: '障害試験',
            week: 8,
            ownerMemberId: 'm1',
          }),
        ]),
      )
    })
  })

  it('タイムライン上でフェーズ期間を調整して保存できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(await screen.findByTestId('timeline-phase-cell-ph-p1-2-3'))
    fireEvent.mouseDown(await screen.findByTestId('timeline-resize-start-ph-p1-2'))
    fireEvent.mouseEnter(await screen.findByTestId('timeline-phase-cell-ph-p1-2-2'))
    fireEvent.mouseUp(window)
    fireEvent.click(screen.getByTestId('timeline-confirm-ph-p1-2'))
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
            startWeek: 2,
            endWeek: 5,
          }),
        ]),
      )
    })
  })

  it('タイムライン変更をキャンセルすると編集前に戻せる', async () => {
    mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(await screen.findByTestId('timeline-phase-cell-ph-p1-2-3'))
    fireEvent.mouseDown(await screen.findByTestId('timeline-resize-start-ph-p1-2'))
    fireEvent.mouseEnter(await screen.findByTestId('timeline-phase-cell-ph-p1-2-2'))
    fireEvent.mouseUp(window)
    fireEvent.click(screen.getByTestId('timeline-cancel-ph-p1-2'))

    expect(screen.queryByTestId('timeline-confirm-ph-p1-2')).not.toBeInTheDocument()

    fireEvent.click(await screen.findByTestId('timeline-phase-cell-ph-p1-2-3'))
    expect(await screen.findByTestId('timeline-resize-start-ph-p1-2')).toBeInTheDocument()
  })
})
