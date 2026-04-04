import { createContext } from 'react'
import type {
  CreateMemberInput,
  CreateProjectInput,
  Member,
  Phase,
  Project,
  ProjectAssignment,
  UpdateMemberInput,
  UpdatePhaseInput,
  UpdateProjectLinkInput,
  UpdateProjectPhasesInput,
  UpdateProjectScheduleInput,
  UpdateProjectStructureInput,
} from '../types/project'

export interface ProjectDataContextValue {
  projects: Project[]
  phases: Phase[]
  members: Member[]
  assignments: ProjectAssignment[]
  isLoading: boolean
  error: string | null
  refresh: () => void
  createMember: (input: CreateMemberInput) => Promise<Member>
  createProject: (input: CreateProjectInput) => Promise<Project>
  updateMember: (memberId: string, input: UpdateMemberInput) => Promise<Member>
  deleteMember: (memberId: string) => Promise<void>
  updatePhase: (phaseId: string, input: UpdatePhaseInput) => Promise<Phase>
  updateProjectSchedule: (projectId: string, input: UpdateProjectScheduleInput) => Promise<Project>
  updateProjectLink: (projectId: string, input: UpdateProjectLinkInput) => Promise<Project>
  updateProjectPhases: (projectId: string, input: UpdateProjectPhasesInput) => Promise<Project>
  updateProjectCurrentPhase: (projectId: string, phaseId: string) => Promise<Project>
  updateProjectStructure: (projectId: string, input: UpdateProjectStructureInput) => Promise<Project>
  getProjectById: (projectId: string) => Project | undefined
  getProjectPhases: (projectId: string) => Phase[]
  getProjectAssignments: (projectId: string) => ProjectAssignment[]
  getMemberById: (memberId: string) => Member | undefined
}

export const ProjectDataContext = createContext<ProjectDataContextValue | null>(null)
