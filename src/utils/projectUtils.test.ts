import { describe, expect, it } from 'vitest'
import { phases, projects } from '../data/mockData'
import {
  getActivePhasesForWeek,
  getProjectCurrentPhase,
  getProjectWeekSlots,
} from './projectUtils'

describe('projectUtils', () => {
  it('進行中または遅延のフェーズを現在フェーズとして返す', () => {
    const projectPhases = phases.filter((phase) => phase.projectId === 'p2')

    expect(getProjectCurrentPhase(projectPhases)?.name).toBe('詳細設計')
  })

  it('案件の週スロットを終了週まで生成する', () => {
    const project = projects.find((item) => item.id === 'p1')
    const projectPhases = phases.filter((phase) => phase.projectId === 'p1')

    expect(project).toBeDefined()
    if (!project) {
      return
    }

    const weekSlots = getProjectWeekSlots(project, projectPhases)

    expect(weekSlots).toHaveLength(12)
    expect(weekSlots[0]?.label).toBe('W1')
    expect(weekSlots[11]?.label).toBe('W12')
  })

  it('同じ週に重複するフェーズを正しく抽出する', () => {
    const project = projects.find((item) => item.id === 'p1')
    const projectPhases = phases.filter((phase) => phase.projectId === 'p1')

    expect(project).toBeDefined()
    if (!project) {
      return
    }

    const activePhases = getActivePhasesForWeek(project, projectPhases, '2026-05-04')

    expect(activePhases.map((phase) => phase.name)).toEqual(['基本設計', '詳細設計'])
  })
})
