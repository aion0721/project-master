import { describe, expect, it } from 'vitest'
import {
  projects,
  systemRelations,
  systems,
  systemTransactions,
  systemTransactionSteps,
} from '../../data/mockData'
import {
  buildFocusedSystemView,
  buildProjectCountBySystemId,
  buildRelatedSystems,
  buildRelationOptions,
  buildRelationTransactionGroups,
  buildSystemById,
  buildSystemGraphSummary,
  buildTransactionEntries,
} from './systemGraphUtils'

describe('systemGraphUtils', () => {
  it('システム別のフォーカスビューを組み立てられる', () => {
    const systemById = buildSystemById(systems)
    const selectedSystem = systemById.get('sys-accounting') ?? null

    const focusedView = buildFocusedSystemView(selectedSystem, systemRelations, systemById)

    expect(focusedView).not.toBeNull()
    expect(focusedView?.upstream.map((item) => item.system.name).sort()).toEqual([
      '物流ダッシュボード',
      '社内ポータル',
    ])
    expect(focusedView?.downstream.map((item) => item.system.name)).toEqual(['営業管理BI'])
  })

  it('システム関連の集計と選択肢を共通化できる', () => {
    const systemById = buildSystemById(systems)
    const relationOptions = buildRelationOptions(systemRelations, systemById)
    const projectCountBySystemId = buildProjectCountBySystemId(projects)
    const summary = buildSystemGraphSummary(systems, systemRelations, systemTransactions, projects)

    expect(relationOptions.find((option) => option.value === 'rel-004')).toEqual(
      expect.objectContaining({
        label: '会計基盤 → 営業管理BI',
        sourceSystemId: 'sys-accounting',
        targetSystemId: 'sys-sales-bi',
      }),
    )
    expect(projectCountBySystemId.get('sys-accounting')).toBeGreaterThan(0)
    expect(summary).toEqual(
      expect.objectContaining({
        systems: systems.length,
        relations: systemRelations.length,
        transactions: systemTransactions.length,
      }),
    )
  })

  it('データ流れの一覧と通信線単位のグループを再利用できる', () => {
    const systemById = buildSystemById(systems)
    const relatedSystems = buildRelatedSystems('sys-accounting', systemRelations, systemById)

    const transactionEntries = buildTransactionEntries(
      'sys-accounting',
      systemTransactions,
      systemTransactionSteps,
      systemById,
    )
    const transactionGroups = buildRelationTransactionGroups(
      relatedSystems,
      systemTransactions,
      systemTransactionSteps,
      systemById,
    )

    expect(transactionEntries.map((entry) => entry.pathLabel)).toEqual(
      expect.arrayContaining([
        '社内ポータル → 会計基盤',
        '社内ポータル → 会計基盤 → 営業管理BI',
      ]),
    )

    const salesBiGroup = transactionGroups.find((group) => group.relation.id === 'rel-004')
    expect(salesBiGroup?.system?.name).toBe('営業管理BI')
    expect(salesBiGroup?.transactions.map((transaction) => transaction.pathLabel)).toEqual(
      expect.arrayContaining(['社内ポータル → 会計基盤 → 営業管理BI']),
    )
  })
})
