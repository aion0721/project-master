import type { Member, Phase, Project, ProjectAssignment } from '../types/project'

export interface WeekSlot {
  index: number
  startDate: string
  label: string
  subLabel: string
}

const fullDateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const shortDateFormatter = new Intl.DateTimeFormat('ja-JP', {
  month: 'numeric',
  day: 'numeric',
})

export function parseDate(value: string) {
  return new Date(`${value}T00:00:00`)
}

export function addDays(value: string, days: number) {
  const next = parseDate(value)
  next.setDate(next.getDate() + days)
  return next.toISOString().slice(0, 10)
}

export function addWeeks(value: string, weeks: number) {
  return addDays(value, weeks * 7)
}

export function formatDate(value: string) {
  return fullDateFormatter.format(parseDate(value))
}

export function formatShortDate(value: string) {
  return shortDateFormatter.format(parseDate(value))
}

export function formatPeriod(startDate: string, endDate: string) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`
}

export function getProjectPm(project: Project, members: Member[]) {
  return members.find((member) => member.id === project.pmMemberId)
}

export function getMemberName(memberId: string, members: Member[]) {
  return members.find((member) => member.id === memberId)?.name ?? '未設定'
}

export function getProjectCurrentPhase(projectPhases: Phase[]) {
  return (
    projectPhases.find((phase) => phase.status === '進行中' || phase.status === '遅延') ??
    projectPhases.find((phase) => phase.status === '未着手') ??
    projectPhases[projectPhases.length - 1]
  )
}

export function getProjectWeekSlots(project: Project, projectPhases: Phase[]): WeekSlot[] {
  const totalWeeks = Math.max(...projectPhases.map((phase) => phase.endWeek), 1)

  return Array.from({ length: totalWeeks }, (_, index) => {
    const startDate = addWeeks(project.startDate, index)

    return {
      index: index + 1,
      startDate,
      label: `W${index + 1}`,
      subLabel: formatShortDate(startDate),
    }
  })
}

export function getGlobalWeekSlots(projects: Project[]): WeekSlot[] {
  const orderedProjects = [...projects].sort(
    (left, right) => parseDate(left.startDate).getTime() - parseDate(right.startDate).getTime(),
  )
  const firstProject = orderedProjects[0]
  const lastProject = orderedProjects[orderedProjects.length - 1]

  if (!firstProject || !lastProject) {
    return []
  }

  const start = parseDate(firstProject.startDate)
  const end = parseDate(lastProject.endDate)
  const totalWeeks = Math.ceil((end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1

  return Array.from({ length: totalWeeks }, (_, index) => {
    const startDate = addWeeks(firstProject.startDate, index)

    return {
      index: index + 1,
      startDate,
      label: `GW${index + 1}`,
      subLabel: formatShortDate(startDate),
    }
  })
}

export function getPhaseActualRange(project: Project, phase: Phase) {
  const startDate = addWeeks(project.startDate, phase.startWeek - 1)
  const endDate = addDays(addWeeks(project.startDate, phase.endWeek), -1)

  return {
    startDate,
    endDate,
  }
}

export function getActivePhasesForWeek(project: Project, projectPhases: Phase[], slotDate: string) {
  const slotTime = parseDate(slotDate).getTime()

  return projectPhases.filter((phase) => {
    const range = getPhaseActualRange(project, phase)
    const startTime = parseDate(range.startDate).getTime()
    const endTime = parseDate(range.endDate).getTime()

    return slotTime >= startTime && slotTime <= endTime
  })
}

export function getResponsibilitiesForMember(
  projectAssignments: ProjectAssignment[],
  memberId: string,
) {
  return projectAssignments
    .filter((assignment) => assignment.memberId === memberId)
    .map((assignment) => assignment.responsibility)
}

export function getOsOwners(projectAssignments: ProjectAssignment[], members: Member[]) {
  return projectAssignments
    .filter((assignment) => assignment.responsibility === 'OS')
    .map((assignment) => getMemberName(assignment.memberId, members))
}
