import type { ManagedSystem } from '../../types/project'

export interface SystemFormState {
  id: string
  name: string
  category: string
  ownerMemberId: string
  departmentNames: string[]
  note: string
}

export interface SystemRelationFormState {
  sourceSystemId: string
  targetSystemId: string
  protocol: string
  note: string
}

export function buildInitialSystemForm(): SystemFormState {
  return {
    id: '',
    name: '',
    category: '',
    ownerMemberId: '',
    departmentNames: [],
    note: '',
  }
}

export function buildInitialSystemRelationForm(): SystemRelationFormState {
  return {
    sourceSystemId: '',
    targetSystemId: '',
    protocol: '',
    note: '',
  }
}

export function buildEditSystemForm(system: ManagedSystem): SystemFormState {
  return {
    id: system.id,
    name: system.name,
    category: system.category,
    ownerMemberId: system.ownerMemberId ?? '',
    departmentNames: [...(system.departmentNames ?? [])],
    note: system.note ?? '',
  }
}

export function toNullableValue(value: string) {
  return value.trim() ? value.trim() : null
}

export function formatSystemOptionLabel(system: ManagedSystem) {
  return `${system.id} / ${system.name}`
}

export function validateSystemInput(input: Pick<SystemFormState, 'id' | 'name' | 'category'>) {
  if (!input.id.trim() || !input.name.trim() || !input.category.trim()) {
    return 'システムID、名称、カテゴリを入力してください。'
  }

  return null
}

export function validateRelationInput(input: SystemRelationFormState) {
  if (!input.sourceSystemId || !input.targetSystemId) {
    return '接続元システムと接続先システムを選択してください。'
  }

  if (input.sourceSystemId === input.targetSystemId) {
    return '同じシステム同士は関連付けできません。'
  }

  return null
}
