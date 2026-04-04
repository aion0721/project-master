import { useMemo } from 'react'
import type { Member, Phase, Project, ProjectAssignment, ProjectEvent } from '../../types/project'
import { getProjectCurrentPhase, getProjectPm } from '../../utils/projectUtils'
import type { StructureAssignmentDraft } from './projectDetailTypes'

interface UseProjectDetailDataParams {
  project: Project | undefined
  projects: Project[]
  members: Member[]
  assignments: ProjectAssignment[]
  getProjectPhases: (projectId: string) => Phase[]
  getProjectAssignments: (projectId: string) => ProjectAssignment[]
  getProjectEvents: (projectId: string) => ProjectEvent[]
}

export function useProjectDetailData({
  project,
  projects,
  members,
  assignments,
  getProjectPhases,
  getProjectAssignments,
  getProjectEvents,
}: UseProjectDetailDataParams) {
  const projectPhases = useMemo(
    () => (project ? getProjectPhases(project.projectNumber) : []),
    [getProjectPhases, project],
  )

  const projectAssignments = useMemo(
    () => (project ? getProjectAssignments(project.projectNumber) : []),
    [getProjectAssignments, project],
  )

  const projectEvents = useMemo(
    () => (project ? getProjectEvents(project.projectNumber) : []),
    [getProjectEvents, project],
  )

  const editableAssignments = useMemo<StructureAssignmentDraft[]>(
    () =>
      projectAssignments
        .filter((assignment) => assignment.responsibility !== 'PM')
        .map((assignment) => ({
          id: assignment.id,
          memberId: assignment.memberId,
          responsibility: assignment.responsibility,
          reportsToMemberId: assignment.reportsToMemberId ?? '',
        })),
    [projectAssignments],
  )

  const currentPhase = useMemo(() => getProjectCurrentPhase(projectPhases), [projectPhases])

  const workStatusOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...projects.map((item) => item.status),
          ...projectPhases.map((item) => item.status),
          ...projectEvents.map((item) => item.status),
        ]),
      ),
    [projectEvents, projectPhases, projects],
  )

  const responsibilityOptions = useMemo(
    () =>
      Array.from(
        new Set(
          assignments
            .map((assignment) => assignment.responsibility)
            .filter((responsibility) => responsibility !== 'PM'),
        ),
      ),
    [assignments],
  )

  const pm = useMemo(
    () => (project ? getProjectPm(project, members) : undefined),
    [members, project],
  )

  return {
    currentPhase,
    editableAssignments,
    pm,
    projectAssignments,
    projectEvents,
    projectPhases,
    responsibilityOptions,
    workStatusOptions,
  }
}
