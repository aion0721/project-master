import type { Member } from '../../types/project'

export interface MemberFormState {
  id: string
  name: string
  role: string
  managerId: string
}

export function buildInitialMemberForm(): MemberFormState {
  return {
    id: '',
    name: '',
    role: '',
    managerId: '',
  }
}

export function toNullableManagerId(value: string) {
  return value.trim() ? value : null
}

export function buildEditForm(member: Member): MemberFormState {
  return {
    id: member.id,
    name: member.name,
    role: member.role,
    managerId: member.managerId ?? '',
  }
}

export function validateMemberInput(input: Pick<MemberFormState, 'name' | 'role'>) {
  if (!input.name.trim() || !input.role.trim()) {
    return 'メンバー名とロールを入力してください。'
  }

  return null
}
