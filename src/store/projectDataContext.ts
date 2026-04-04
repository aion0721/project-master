import { createContext } from 'react'
import type {
  CreateProjectInput,
  Member,
  Phase,
  Project,
  ProjectAssignment,
  UpdatePhaseScheduleInput,
} from '../types/project'

export interface ProjectDataContextValue {
  projects: Project[]
  phases: Phase[]
  members: Member[]
  assignments: ProjectAssignment[]
  isLoading: boolean
  error: string | null
  refresh: () => void
  createProject: (input: CreateProjectInput) => Promise<Project>
  updatePhaseSchedule: (phaseId: string, input: UpdatePhaseScheduleInput) => Promise<Phase>
  getProjectById: (projectId: string) => Project | undefined
  getProjectPhases: (projectId: string) => Phase[]
  getProjectAssignments: (projectId: string) => ProjectAssignment[]
  getMemberById: (memberId: string) => Member | undefined
}

export const ProjectDataContext = createContext<ProjectDataContextValue | null>(null)
