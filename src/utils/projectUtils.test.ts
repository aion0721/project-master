import { describe, expect, it } from 'vitest'
import { events, phases, projects } from '../data/mockData'
import {
  getActivePhasesForWeek,
  getProjectCurrentPhase,
  getProjectTotalWeeks,
  getProjectWeekSlots,
  isDateInWeekSlot,
} from './projectUtils'

describe('projectUtils', () => {
  it('進行中または遅延のフェーズを現在フェーズとして返す', () => {
    const projectPhases = phases.filter((phase) => phase.projectId === 'PRJ-002')

    expect(getProjectCurrentPhase(projectPhases)?.name).toBe('詳細設計')
  })

  it('案件の週スロットを案件期間にあわせて生成する', () => {
    const project = projects.find((item) => item.projectNumber === 'PRJ-001')
    const projectPhases = phases.filter((phase) => phase.projectId === 'PRJ-001')

    expect(project).toBeDefined()
    if (!project) {
      return
    }

    const weekSlots = getProjectWeekSlots(project, projectPhases)

    expect(weekSlots).toHaveLength(12)
    expect(weekSlots[0]?.label).toBe('W1')
    expect(weekSlots[11]?.label).toBe('W12')
  })

  it('案件期間の総週数を返す', () => {
    const project = projects.find((item) => item.projectNumber === 'PRJ-001')

    expect(project).toBeDefined()
    if (!project) {
      return
    }

    expect(getProjectTotalWeeks(project)).toBe(12)
  })

  it('イベントが案件期間より後ろの週にあっても週スロットは案件期間で固定する', () => {
    const project = projects.find((item) => item.projectNumber === 'PRJ-001')
    const projectPhases = phases.filter((phase) => phase.projectId === 'PRJ-001')

    expect(project).toBeDefined()
    if (!project) {
      return
    }

    const weekSlots = getProjectWeekSlots(project, projectPhases, [
      ...events.filter((event) => event.projectId === 'PRJ-001'),
      {
        id: 'ev-extra',
        projectId: 'PRJ-001',
        name: '本番連携',
        week: 14,
        status: '未着手',
      },
    ])

    expect(weekSlots).toHaveLength(12)
    expect(weekSlots[11]?.label).toBe('W12')
  })

  it('重なる週に該当するフェーズを正しく返す', () => {
    const project = projects.find((item) => item.projectNumber === 'PRJ-001')
    const projectPhases = phases.filter((phase) => phase.projectId === 'PRJ-001')

    expect(project).toBeDefined()
    if (!project) {
      return
    }

    const activePhases = getActivePhasesForWeek(project, projectPhases, '2026-05-04')

    expect(activePhases.map((phase) => phase.name)).toEqual(['基本設計', '詳細設計'])
  })

  it('指定日が週スロットに含まれるか判定できる', () => {
    expect(isDateInWeekSlot('2026-04-20', '2026-04-20')).toBe(true)
    expect(isDateInWeekSlot('2026-04-20', '2026-04-26')).toBe(true)
    expect(isDateInWeekSlot('2026-04-20', '2026-04-27')).toBe(false)
  })
})
