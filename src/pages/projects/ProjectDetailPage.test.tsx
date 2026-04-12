import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { assignments, events, phases, projects } from '../../data/mockData'
import { mockProjectApi } from '../../test/mockProjectApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import styles from './ProjectDetailPage.module.css'
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
    expect(screen.getByRole('link', { name: '横断ビューへ戻る' })).toHaveAttribute(
      'href',
      '/cross-project',
    )
    expect(screen.getByText('主システム: sys-accounting / 会計基盤')).toBeInTheDocument()
    expect(screen.getByTestId('current-phase-value')).toHaveTextContent(currentPhase.name)
    expect(screen.getByTestId('current-phase-card').className).toContain(
      styles.metaCardPhaseToneBasicDesign,
    )
    expect(screen.getByTestId('hero-current-phase-badge')).toHaveTextContent('フェーズ: 基本設計')
    expect(screen.getByTestId('hero-current-phase-badge').className).toContain(
      styles.phaseSummaryBadgebasicDesign,
    )
    expect(screen.getByTestId('hero-report-status-badge')).toHaveTextContent('報告事項: あり')
    expect(screen.getByTestId('project-status-card').className).toContain(styles.metaCardPhaseInProgress)
    expect(screen.getByTestId('project-note-value')).toHaveTextContent(project.note ?? '')
    expect(screen.getByTestId('project-report-status-value')).toHaveTextContent('あり')
    expect(screen.getByTestId('project-report-status-card').className).toContain(
      styles.metaCardReportActive,
    )
    expect(screen.getByTestId('project-link-anchor-0')).toHaveAttribute(
      'href',
      project.projectLinks[0]?.url,
    )
    expect(
      await screen.findByTestId(`timeline-event-${projectEvent.id}-week-${projectEvent.week}`),
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

  it('プロジェクト名とプロジェクト番号を更新できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('project-summary-edit-button'))
    fireEvent.change(screen.getByTestId('project-summary-number'), {
      target: { value: 'PRJ-101' },
    })
    fireEvent.change(screen.getByTestId('project-summary-name'), {
      target: { value: '基幹会計刷新 本番' },
    })
    fireEvent.click(screen.getByTestId('project-summary-save-button'))

    await waitFor(() => {
      const summaryCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/projects/PRJ-001') && init?.method === 'PATCH'
      })

      expect(summaryCall).toBeDefined()
      const body = JSON.parse(String(summaryCall?.[1]?.body))
      expect(body).toEqual({
        projectNumber: 'PRJ-101',
        name: '基幹会計刷新 本番',
      })
    })

    expect(await screen.findByRole('heading', { name: '基幹会計刷新 本番' })).toBeInTheDocument()
    expect(screen.getByTestId('project-summary-number-value')).toHaveTextContent('PRJ-101')
    expect(screen.getByTestId('project-summary-pm-value')).toHaveTextContent('PM: 田中')
    expect(screen.getByTestId('current-phase-value')).toHaveTextContent(currentPhase.name)
    expect(
      await screen.findByTestId(`timeline-event-${projectEvent.id}-week-${projectEvent.week}`),
    ).toBeInTheDocument()
    expect(screen.getAllByText(projectEvent.name).length).toBeGreaterThan(0)
    expect(screen.getAllByText(editableAssignment.responsibility).length).toBeGreaterThan(0)
    expect(screen.queryByText('案件が見つかりません')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: project.name })).not.toBeInTheDocument()
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

  it('状況メモを更新できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('project-note-edit-button'))
    fireEvent.change(screen.getByTestId('project-note-input'), {
      target: { value: 'レビュー指摘を反映中。金曜に再確認予定。' },
    })
    fireEvent.click(screen.getByTestId('project-note-save-button'))

    await waitFor(() => {
      const noteCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/projects/PRJ-001/note') && init?.method === 'PATCH'
      })

      expect(noteCall).toBeDefined()
      const body = JSON.parse(String(noteCall?.[1]?.body))
      expect(body).toEqual({
        note: 'レビュー指摘を反映中。金曜に再確認予定。',
      })
    })
  })

  it('報告事項の有無を更新できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('project-report-status-edit-button'))
    fireEvent.change(screen.getByTestId('project-report-status-select'), {
      target: { value: 'false' },
    })
    fireEvent.click(screen.getByTestId('project-report-status-save-button'))

    await waitFor(() => {
      const reportStatusCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/projects/PRJ-001/report-status') && init?.method === 'PATCH'
      })

      expect(reportStatusCall).toBeDefined()
      const body = JSON.parse(String(reportStatusCall?.[1]?.body))
      expect(body).toEqual({
        hasReportItems: false,
      })
    })
  })

  it('主システムを更新できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('project-systems-edit-button'))
    fireEvent.change(screen.getByTestId('project-system-select'), {
      target: { value: 'sys-sales-bi' },
    })
    fireEvent.click(screen.getByTestId('project-systems-save-button'))

    await waitFor(() => {
      const systemsCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/projects/PRJ-001/systems') && init?.method === 'PATCH'
      })

      expect(systemsCall).toBeDefined()
      const body = JSON.parse(String(systemsCall?.[1]?.body))
      expect(body).toEqual({
        relatedSystemIds: ['sys-sales-bi'],
      })
    })
  })

  it('案件状態の手動上書きを更新できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('project-status-edit-button'))
    fireEvent.change(screen.getByTestId('project-status-override-select'), {
      target: { value: '中止' },
    })
    fireEvent.click(screen.getByTestId('project-status-override-save-button'))

    await waitFor(() => {
      const statusCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/projects/PRJ-001/status-override') && init?.method === 'PATCH'
      })

      expect(statusCall).toBeDefined()
      const body = JSON.parse(String(statusCall?.[1]?.body))
      expect(body).toEqual({
        statusOverride: '中止',
      })
    })

    expect(await screen.findByTestId('project-status-value')).toHaveTextContent('中止')
    expect(screen.getByTestId('project-status-mode')).toHaveTextContent('手動上書き')
    expect(screen.getByTestId('project-status-card').className).toContain(
      styles.metaCardStatusCancelled,
    )
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
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('phase-editor-toggle'))
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

  it('フェーズ削除確認をキャンセルした場合は削除しない', async () => {
    mockProjectApi()
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('phase-editor-toggle'))
    fireEvent.click(await screen.findByTestId('phase-remove-ph-p1-3'))

    expect(screen.getByTestId('phase-row-ph-p1-3')).toBeInTheDocument()
  })

  it('フェーズを並び替えて保存できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('phase-editor-toggle'))
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

  it('案件期間を超えるフェーズ週は保存前にエラーにする', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('phase-editor-toggle'))
    fireEvent.change(await screen.findByTestId('phase-end-ph-p1-5'), {
      target: { value: '13' },
    })
    fireEvent.click(screen.getByTestId('phase-structure-save-button'))

    expect(
      await screen.findByText('「移行」の開始週・終了週は案件期間内の W1 - W12 で入力してください。'),
    ).toBeInTheDocument()

    const phaseCall = fetchSpy.mock.calls.find(([url, init]) => {
      return String(url).includes('/api/projects/PRJ-001/phases') && init?.method === 'PATCH'
    })

    expect(phaseCall).toBeUndefined()
  })

  it('タイムラインで選択したフェーズを上下移動して確定で保存できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('phase-editor-toggle'))
    fireEvent.click(await screen.findByTestId('timeline-phase-cell-ph-p1-3-5'))
    expect(screen.getByTestId('timeline-move-up-ph-p1-3')).toBeEnabled()
    expect(screen.getByTestId('timeline-move-down-ph-p1-3')).toBeEnabled()

    fireEvent.click(screen.getByTestId('timeline-move-up-ph-p1-3'))
    fireEvent.click(screen.getByTestId('timeline-confirm-ph-p1-3'))

    await waitFor(() => {
      const phaseCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/projects/PRJ-001/phases') && init?.method === 'PATCH'
      })

      expect(phaseCall).toBeDefined()
      const body = JSON.parse(String(phaseCall?.[1]?.body))
      expect(body.phases[1]?.id).toBe('ph-p1-3')
      expect(body.phases[2]?.id).toBe('ph-p1-2')
    })

    expect(screen.queryByTestId('timeline-confirm-ph-p1-3')).not.toBeInTheDocument()
  })

  it('タイムライン上でフェーズ状態を変更して保存できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('phase-editor-toggle'))
    fireEvent.click(await screen.findByTestId('timeline-phase-cell-ph-p1-2-3'))
    fireEvent.change(screen.getByTestId('timeline-status-ph-p1-2'), {
      target: { value: '完了' },
    })
    fireEvent.click(screen.getByTestId('timeline-confirm-ph-p1-2'))

    await waitFor(() => {
      const phaseCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/phases/ph-p1-2') && init?.method === 'PATCH'
      })

      expect(phaseCall).toBeDefined()
      const body = JSON.parse(String(phaseCall?.[1]?.body))
      expect(body).toEqual({
        startWeek: 3,
        endWeek: 5,
        status: '完了',
        progress: 100,
      })
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

  it('主システムの体制をプロジェクト体制へコピーして保存できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('structure-edit-toggle'))
    fireEvent.click(screen.getByTestId('structure-copy-from-system-button'))
    fireEvent.click(screen.getByTestId('structure-save-button'))

    await waitFor(() => {
      const structureCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/projects/PRJ-001/structure') && init?.method === 'PATCH'
      })

      expect(structureCall).toBeDefined()
      const body = JSON.parse(String(structureCall?.[1]?.body))
      expect(body.pmMemberId).toBe('m1')
      expect(body.assignments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            memberId: 'm2',
            responsibility: '業務窓口',
            reportsToMemberId: 'm1',
          }),
          expect.objectContaining({
            memberId: 'm4',
            responsibility: '運用統括',
            reportsToMemberId: 'm1',
          }),
          expect.objectContaining({
            memberId: 'm7',
            responsibility: '基盤担当',
            reportsToMemberId: 'm4',
          }),
          expect.objectContaining({
            memberId: 'm5',
            responsibility: '品質管理',
            reportsToMemberId: 'm4',
          }),
        ]),
      )
    })
  })

  it('プロジェクト体制をツリーとフローで切り替えられる', async () => {
    mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    expect(screen.getByTestId('member-tree')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('structure-view-flow'))
    expect(await screen.findByTestId('project-structure-flow')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('structure-view-tree'))
    expect(await screen.findByTestId('member-tree')).toBeInTheDocument()
  })

  it('フロー表示でメンバーを追加して保存できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('structure-view-flow'))
    fireEvent.click(screen.getByTestId('structure-edit-toggle'))
    fireEvent.change(screen.getByTestId('structure-flow-member-select'), {
      target: { value: 'm6' },
    })
    fireEvent.click(screen.getByTestId('structure-flow-add-button'))
    fireEvent.click(screen.getByTestId('structure-save-button'))

    await waitFor(() => {
      const structureCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/projects/PRJ-001/structure') && init?.method === 'PATCH'
      })

      expect(structureCall).toBeDefined()
      const body = JSON.parse(String(structureCall?.[1]?.body))
      expect(body.assignments).toContainEqual(
        expect.objectContaining({
          memberId: 'm6',
        }),
      )
    })
  })

  it('フロー表示でメンバーを削除すると依存を外して保存できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('structure-view-flow'))
    fireEvent.click(screen.getByTestId('structure-edit-toggle'))
    fireEvent.click(screen.getByTestId('project-structure-node-m2'))
    fireEvent.click(screen.getByTestId('structure-flow-remove-button'))
    fireEvent.click(screen.getByTestId('structure-save-button'))

    await waitFor(() => {
      const structureCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/projects/PRJ-001/structure') && init?.method === 'PATCH'
      })

      expect(structureCall).toBeDefined()
      const body = JSON.parse(String(structureCall?.[1]?.body))
      expect(body.assignments).not.toContainEqual(
        expect.objectContaining({
          memberId: 'm2',
        }),
      )
      expect(body.assignments).toContainEqual(
        expect.objectContaining({
          memberId: 'm3',
          reportsToMemberId: null,
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

  it('タイムラインのイベント行から対象週を指定して追加できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('phase-editor-toggle'))
    fireEvent.click(screen.getByTestId('timeline-event-add-week-9'))

    expect(await screen.findByTestId('event-week-2')).toHaveValue(9)
    fireEvent.change(screen.getByTestId('event-name-2'), {
      target: { value: '利用部門確認' },
    })
    fireEvent.change(screen.getByTestId('event-owner-2'), {
      target: { value: 'm6' },
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
            name: '利用部門確認',
            week: 9,
            ownerMemberId: 'm6',
          }),
        ]),
      )
    })
  })

  it('案件期間を超えるイベント週は保存前にエラーにする', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.change(await screen.findByTestId('event-week-0'), {
      target: { value: '13' },
    })
    fireEvent.click(screen.getByTestId('project-events-save-button'))

    expect(
      await screen.findByText('イベント週は案件期間内の W1 - W12 で入力してください。'),
    ).toBeInTheDocument()

    const eventsCall = fetchSpy.mock.calls.find(([url, init]) => {
      return String(url).includes('/api/projects/PRJ-001/events') && init?.method === 'PATCH'
    })

    expect(eventsCall).toBeUndefined()
  })

  it('関連イベントからフェーズ進捗タイムラインへ戻れる', async () => {
    mockProjectApi()

    const scrollIntoViewMock = vi.fn()
    Object.defineProperty(HTMLDivElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoViewMock,
    })

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('project-events-back-to-phases-button'))

    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
  })

  it('タイムライン上でフェーズ期間を調整して保存できる', async () => {
    const fetchSpy = mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('phase-editor-toggle'))
    fireEvent.click(await screen.findByTestId('timeline-phase-cell-ph-p1-2-3'))
    fireEvent.mouseDown(await screen.findByTestId('timeline-resize-start-ph-p1-2'))
    fireEvent.mouseEnter(await screen.findByTestId('timeline-phase-cell-ph-p1-2-2'))
    fireEvent.mouseUp(window)
    fireEvent.click(screen.getByTestId('timeline-confirm-ph-p1-2'))

    await waitFor(() => {
      const phaseCall = fetchSpy.mock.calls.find(([url, init]) => {
        return String(url).includes('/api/phases/ph-p1-2') && init?.method === 'PATCH'
      })

      expect(phaseCall).toBeDefined()
      const body = JSON.parse(String(phaseCall?.[1]?.body))
      expect(body).toEqual({
        startWeek: 2,
        endWeek: 5,
        status: '進行中',
        progress: 70,
      })
    })
  })

  it('タイムライン変更をキャンセルすると編集前に戻せる', async () => {
    mockProjectApi()

    renderPage()

    await screen.findByRole('heading', { name: project.name })

    fireEvent.click(screen.getByTestId('phase-editor-toggle'))
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
