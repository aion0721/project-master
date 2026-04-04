import type { ReactNode } from 'react'
import { assignments, members, phases, projects } from '../data/mockData'
import type { ProjectDataContextValue } from './projectDataContext'
import { ProjectDataContext } from './projectDataContext'

export function ProjectDataProvider({ children }: { children: ReactNode }) {
  const value: ProjectDataContextValue = {
    projects,
    phases,
    members,
    assignments,
    getProjectById: (projectId) => projects.find((project) => project.id === projectId),
    getProjectPhases: (projectId) =>
      phases
        .filter((phase) => phase.projectId === projectId)
        .sort((left, right) => left.startWeek - right.startWeek),
    getProjectAssignments: (projectId) =>
      assignments.filter((assignment) => assignment.projectId === projectId),
    getMemberById: (memberId) => members.find((member) => member.id === memberId),
  }

  return (
    <ProjectDataContext.Provider value={value}>
      {children}
    </ProjectDataContext.Provider>
  )
}
