import { createContext } from 'react'
import type {
  CreateMemberInput,
  CreateProjectInput,
  CreateSystemRelationInput,
  CreateSystemInput,
  ManagedSystem,
  Member,
  Phase,
  Project,
  ProjectAssignment,
  ProjectEvent,
  SystemRelation,
  UpdateMemberInput,
  UpdateProjectEventsInput,
  UpdateProjectNoteInput,
  UpdateProjectReportStatusInput,
  UpdatePhaseInput,
  UpdateProjectLinksInput,
  UpdateProjectSystemsInput,
  UpdateProjectPhasesInput,
  UpdateProjectScheduleInput,
  UpdateProjectStructureInput,
  UpdateSystemInput,
} from '../types/project'

export interface ProjectDataContextValue {
  projects: Project[]
  phases: Phase[]
  events: ProjectEvent[]
  members: Member[]
  systems: ManagedSystem[]
  systemRelations: SystemRelation[]
  assignments: ProjectAssignment[]
  isLoading: boolean
  error: string | null
  refresh: () => void
  createMember: (input: CreateMemberInput) => Promise<Member>
  createProject: (input: CreateProjectInput) => Promise<Project>
  createSystem: (input: CreateSystemInput) => Promise<ManagedSystem>
  createSystemRelation: (input: CreateSystemRelationInput) => Promise<SystemRelation>
  updateMember: (memberId: string, input: UpdateMemberInput) => Promise<Member>
  updateSystem: (systemId: string, input: UpdateSystemInput) => Promise<ManagedSystem>
  deleteMember: (memberId: string) => Promise<void>
  deleteSystem: (systemId: string) => Promise<void>
  deleteSystemRelation: (relationId: string) => Promise<void>
  updatePhase: (phaseId: string, input: UpdatePhaseInput) => Promise<Phase>
  updateProjectSchedule: (projectId: string, input: UpdateProjectScheduleInput) => Promise<Project>
  updateProjectLinks: (projectId: string, input: UpdateProjectLinksInput) => Promise<Project>
  updateProjectNote: (projectId: string, input: UpdateProjectNoteInput) => Promise<Project>
  updateProjectReportStatus: (projectId: string, input: UpdateProjectReportStatusInput) => Promise<Project>
  updateProjectSystems: (projectId: string, input: UpdateProjectSystemsInput) => Promise<Project>
  updateProjectEvents: (projectId: string, input: UpdateProjectEventsInput) => Promise<Project>
  updateProjectPhases: (projectId: string, input: UpdateProjectPhasesInput) => Promise<Project>
  updateProjectCurrentPhase: (projectId: string, phaseId: string) => Promise<Project>
  updateProjectStructure: (projectId: string, input: UpdateProjectStructureInput) => Promise<Project>
  getProjectById: (projectId: string) => Project | undefined
  getProjectPhases: (projectId: string) => Phase[]
  getProjectAssignments: (projectId: string) => ProjectAssignment[]
  getProjectEvents: (projectId: string) => ProjectEvent[]
  getMemberById: (memberId: string) => Member | undefined
  getSystemById: (systemId: string) => ManagedSystem | undefined
}

export const ProjectDataContext = createContext<ProjectDataContextValue | null>(null)
