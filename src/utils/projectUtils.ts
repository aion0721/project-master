import type { Member, Phase, Project, ProjectAssignment, ProjectEvent } from '../types/project'

export interface WeekSlot {
  index: number
  startDate: string
  endDate: string
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

const monthFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'numeric',
})

const millisecondsPerDay = 24 * 60 * 60 * 1000

export function parseDate(value: string) {
  return new Date(`${value}T00:00:00`)
}

export function formatDateInputValue(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(value: string, days: number) {
  const next = parseDate(value)
  next.setDate(next.getDate() + days)
  return formatDateInputValue(next)
}

export function addWeeks(value: string, weeks: number) {
  return addDays(value, weeks * 7)
}

export function addMonths(value: string, months: number) {
  const next = parseDate(value)
  next.setMonth(next.getMonth() + months)
  return formatDateInputValue(next)
}

export function formatDate(value: string) {
  return fullDateFormatter.format(parseDate(value))
}

export function formatShortDate(value: string) {
  return shortDateFormatter.format(parseDate(value))
}

export function formatMonth(value: string) {
  return monthFormatter.format(parseDate(value))
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

export function getProjectTotalWeeks(project: Project) {
  const startTime = parseDate(project.startDate).getTime()
  const endTime = parseDate(project.endDate).getTime()

  if (Number.isNaN(startTime) || Number.isNaN(endTime) || endTime < startTime) {
    return 1
  }

  const totalDays = Math.floor((endTime - startTime) / millisecondsPerDay) + 1
  return Math.max(Math.ceil(totalDays / 7), 1)
}

export function getProjectWeekSlots(
  project: Project,
  projectPhases: Phase[],
  projectEvents: ProjectEvent[] = [],
): WeekSlot[] {
  void projectPhases
  void projectEvents

  const totalWeeks = getProjectTotalWeeks(project)

  return Array.from({ length: totalWeeks }, (_, index) => {
    const startDate = addWeeks(project.startDate, index)

    return {
      index: index + 1,
      startDate,
      endDate: addDays(startDate, 6),
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
      endDate: addDays(startDate, 6),
      label: `GW${index + 1}`,
      subLabel: formatShortDate(startDate),
    }
  })
}

export function isDateInWeekSlot(slotStartDate: string, targetDate = formatDateInputValue(new Date())) {
  return isDateInRange(slotStartDate, addDays(slotStartDate, 6), targetDate)
}

export function isDateInRange(
  startDate: string,
  endDate: string,
  targetDate = formatDateInputValue(new Date()),
) {
  const targetTime = parseDate(targetDate).getTime()
  const startTime = parseDate(startDate).getTime()
  const endTime = parseDate(endDate).getTime()

  return targetTime >= startTime && targetTime <= endTime
}

export function getGlobalMonthSlots(projects: Project[]): WeekSlot[] {
  const orderedProjects = [...projects].sort(
    (left, right) => parseDate(left.startDate).getTime() - parseDate(right.startDate).getTime(),
  )
  const firstProject = orderedProjects[0]
  const lastProject = orderedProjects[orderedProjects.length - 1]

  if (!firstProject || !lastProject) {
    return []
  }

  const firstStart = parseDate(firstProject.startDate)
  const start = new Date(firstStart.getFullYear(), firstStart.getMonth(), 1)
  const lastEnd = parseDate(lastProject.endDate)
  const end = new Date(lastEnd.getFullYear(), lastEnd.getMonth(), 1)
  const totalMonths =
    (end.getFullYear() - start.getFullYear()) * 12 +
    end.getMonth() -
    start.getMonth() +
    1

  return Array.from({ length: totalMonths }, (_, index) => {
    const monthStart = new Date(start.getFullYear(), start.getMonth() + index, 1)
    const startDate = formatDateInputValue(monthStart)
    const monthEnd = new Date(start.getFullYear(), start.getMonth() + index + 1, 0)

    return {
      index: index + 1,
      startDate,
      endDate: formatDateInputValue(monthEnd),
      label: formatMonth(startDate),
      subLabel: `${monthStart.getMonth() + 1}月`,
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
  return getActivePhasesForRange(project, projectPhases, slotDate, slotDate)
}

export function getActivePhasesForRange(
  project: Project,
  projectPhases: Phase[],
  rangeStartDate: string,
  rangeEndDate: string,
) {
  const rangeStartTime = parseDate(rangeStartDate).getTime()
  const rangeEndTime = parseDate(rangeEndDate).getTime()

  return projectPhases.filter((phase) => {
    const range = getPhaseActualRange(project, phase)
    const startTime = parseDate(range.startDate).getTime()
    const endTime = parseDate(range.endDate).getTime()

    return startTime <= rangeEndTime && endTime >= rangeStartTime
  })
}

export function getEventDate(project: Project, event: ProjectEvent) {
  return addWeeks(project.startDate, event.week - 1)
}

export function getActiveEventsForRange(
  project: Project,
  projectEvents: ProjectEvent[],
  rangeStartDate: string,
  rangeEndDate: string,
) {
  return projectEvents.filter((event) =>
    isDateInRange(rangeStartDate, rangeEndDate, getEventDate(project, event)),
  )
}

export function isCurrentMonthSlot(
  slotStartDate: string,
  slotEndDate: string,
  targetDate = formatDateInputValue(new Date()),
) {
  return isDateInRange(slotStartDate, slotEndDate, targetDate)
}

export function getActiveEventsForWeek(projectEvents: ProjectEvent[], weekIndex: number) {
  return projectEvents.filter((event) => event.week === weekIndex)
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
