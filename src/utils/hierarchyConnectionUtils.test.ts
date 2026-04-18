import { describe, expect, it } from 'vitest'
import { validateHierarchyConnection } from './hierarchyConnectionUtils'

const messages = {
  missingConnection: '接続元と接続先を正しく指定してください。',
  selfReference: '自分自身は接続できません。',
  unavailableConnection: '表示中のメンバー同士だけ接続できます。',
  entityNotFound: '接続対象のメンバーが見つかりません。',
  cycleDetected: '循環する上下関係になるため、この接続はできません。',
  duplicateConnection: (memberLabel: string, managerLabel: string) =>
    `${memberLabel} はすでに ${managerLabel} 配下です。`,
}

describe('validateHierarchyConnection', () => {
  it('必須IDがない場合はエラーを返す', () => {
    const result = validateHierarchyConnection({
      memberId: '',
      managerId: 'm1',
      availableIds: new Set(['m1']),
      entityExists: () => true,
      getEntityLabel: (id) => id,
      getCurrentManagerId: () => null,
      createsCycle: () => false,
      messages,
    })

    expect(result).toEqual({
      kind: 'error',
      message: messages.missingConnection,
    })
  })

  it('同じ接続なら noop を返す', () => {
    const result = validateHierarchyConnection({
      memberId: 'm2',
      managerId: 'm1',
      availableIds: new Set(['m1', 'm2']),
      entityExists: () => true,
      getEntityLabel: (id) => (id === 'm1' ? '田中' : '山本'),
      getCurrentManagerId: () => 'm1',
      createsCycle: () => false,
      messages,
    })

    expect(result).toEqual({
      kind: 'noop',
      message: '山本 はすでに 田中 配下です。',
    })
  })

  it('循環が発生する場合はエラーを返す', () => {
    const result = validateHierarchyConnection({
      memberId: 'm2',
      managerId: 'm3',
      availableIds: new Set(['m2', 'm3']),
      entityExists: () => true,
      getEntityLabel: (id) => id,
      getCurrentManagerId: () => 'm1',
      createsCycle: () => true,
      messages,
    })

    expect(result).toEqual({
      kind: 'error',
      message: messages.cycleDetected,
    })
  })

  it('接続可能なら valid を返す', () => {
    const result = validateHierarchyConnection({
      memberId: 'm2',
      managerId: 'm3',
      availableIds: new Set(['m2', 'm3']),
      entityExists: () => true,
      getEntityLabel: (id) => id,
      getCurrentManagerId: () => 'm1',
      createsCycle: () => false,
      messages,
    })

    expect(result).toEqual({
      kind: 'valid',
      memberId: 'm2',
      managerId: 'm3',
    })
  })
})
