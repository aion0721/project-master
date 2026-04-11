import type { Member } from '../../types/project'

export interface MemberFormState {
  id: string
  name: string
  departmentCode: string
  departmentName: string
  role: string
  lineLabel: string
  managerId: string
}

export function buildInitialMemberForm(): MemberFormState {
  return {
    id: '',
    name: '',
    departmentCode: '',
    departmentName: '',
    role: '',
    lineLabel: '',
    managerId: '',
  }
}

export function toNullableManagerId(value: string) {
  return value.trim() ? value : null
}

export function formatMemberOptionLabel(member: Member) {
  return `${member.id} / ${member.name} (${member.role})`
}

export function formatMemberShortLabel(member: Member) {
  return `${member.id} / ${member.name}`
}

export function buildEditForm(member: Member): MemberFormState {
  return {
    id: member.id,
    name: member.name,
    departmentCode: member.departmentCode,
    departmentName: member.departmentName,
    role: member.role,
    lineLabel: member.lineLabel ?? '',
    managerId: member.managerId ?? '',
  }
}

export function validateMemberInput(
  input: Pick<MemberFormState, 'name' | 'departmentCode' | 'departmentName' | 'role'>,
) {
  if (
    !input.name.trim() ||
    !input.departmentCode.trim() ||
    !input.departmentName.trim() ||
    !input.role.trim()
  ) {
    return '名前、部署コード、部署名、ロールを入力してください。'
  }

  return null
}
