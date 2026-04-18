import { createContext } from 'react'
import type {
  CreateMemberInput,
  CreateProjectInput,
  CreateSystemRelationInput,
  CreateSystemTransactionInput,
  CreateSystemInput,
  ManagedSystem,
  Member,
  Phase,
  Project,
  ProjectAssignment,
  ProjectDepartmentAssignment,
  ProjectEvent,
  SystemAssignment,
  SystemRelation,
  SystemTransaction,
  SystemTransactionStep,
  UpdateMemberInput,
  UpdateProjectEventsInput,
  UpdateProjectDepartmentsInput,
  UpdateProjectNoteInput,
  UpdateProjectReportStatusInput,
  UpdateProjectStatusEntriesInput,
  UpdateProjectStatusOverrideInput,
  UpdatePhaseInput,
  UpdateProjectLinksInput,
  UpdateProjectSystemsInput,
  UpdateProjectPhasesInput,
  UpdateProjectScheduleInput,
  UpdateProjectSummaryInput,
  UpdateProjectStructureInput,
  UpdateSystemRelationInput,
  UpdateSystemStructureInput,
  UpdateSystemTransactionInput,
  UpdateSystemInput,
} from '../types/project'

export interface ProjectDataContextValue {
  projects: Project[]
  phases: Phase[]
  events: ProjectEvent[]
  members: Member[]
  projectDepartments: ProjectDepartmentAssignment[]
  systems: ManagedSystem[]
  systemRelations: SystemRelation[]
  systemTransactions: SystemTransaction[]
  systemTransactionSteps: SystemTransactionStep[]
  assignments: ProjectAssignment[]
  systemAssignments: SystemAssignment[]
  isLoading: boolean
  error: string | null
  refresh: () => void
  createMember: (input: CreateMemberInput) => Promise<Member>
  createProject: (input: CreateProjectInput) => Promise<Project>
  createSystem: (input: CreateSystemInput) => Promise<ManagedSystem>
  createSystemRelation: (input: CreateSystemRelationInput) => Promise<SystemRelation>
  createSystemTransaction: (
    input: CreateSystemTransactionInput,
  ) => Promise<{ transaction: SystemTransaction; steps: SystemTransactionStep[] }>
  updateMember: (memberId: string, input: UpdateMemberInput) => Promise<Member>
  updateSystem: (systemId: string, input: UpdateSystemInput) => Promise<ManagedSystem>
  updateSystemRelation: (relationId: string, input: UpdateSystemRelationInput) => Promise<SystemRelation>
  updateSystemStructure: (
    systemId: string,
    input: UpdateSystemStructureInput,
  ) => Promise<{ system: ManagedSystem; assignments: SystemAssignment[] }>
  updateSystemTransaction: (
    transactionId: string,
    input: UpdateSystemTransactionInput,
  ) => Promise<{ transaction: SystemTransaction; steps: SystemTransactionStep[] }>
  deleteMember: (memberId: string) => Promise<void>
  deleteSystem: (systemId: string) => Promise<void>
  deleteSystemRelation: (relationId: string) => Promise<void>
  deleteSystemTransaction: (transactionId: string) => Promise<void>
  updatePhase: (phaseId: string, input: UpdatePhaseInput) => Promise<Phase>
  updateProjectSummary: (projectId: string, input: UpdateProjectSummaryInput) => Promise<Project>
  updateProjectSchedule: (projectId: string, input: UpdateProjectScheduleInput) => Promise<Project>
  updateProjectLinks: (projectId: string, input: UpdateProjectLinksInput) => Promise<Project>
  updateProjectNote: (projectId: string, input: UpdateProjectNoteInput) => Promise<Project>
  updateProjectStatusEntries: (
    projectId: string,
    input: UpdateProjectStatusEntriesInput,
  ) => Promise<Project>
  updateProjectReportStatus: (projectId: string, input: UpdateProjectReportStatusInput) => Promise<Project>
  updateProjectStatusOverride: (
    projectId: string,
    input: UpdateProjectStatusOverrideInput,
  ) => Promise<Project>
  updateProjectSystems: (projectId: string, input: UpdateProjectSystemsInput) => Promise<Project>
  updateProjectDepartments: (
    projectId: string,
    input: UpdateProjectDepartmentsInput,
  ) => Promise<ProjectDepartmentAssignment[]>
  updateProjectEvents: (projectId: string, input: UpdateProjectEventsInput) => Promise<Project>
  updateProjectPhases: (projectId: string, input: UpdateProjectPhasesInput) => Promise<Project>
  updateProjectCurrentPhase: (projectId: string, phaseId: string) => Promise<Project>
  updateProjectStructure: (projectId: string, input: UpdateProjectStructureInput) => Promise<Project>
  getProjectById: (projectId: string) => Project | undefined
  getProjectPhases: (projectId: string) => Phase[]
  getProjectAssignments: (projectId: string) => ProjectAssignment[]
  getProjectEvents: (projectId: string) => ProjectEvent[]
  getProjectDepartments: (projectId: string) => ProjectDepartmentAssignment[]
  getMemberById: (memberId: string) => Member | undefined
  getSystemById: (systemId: string) => ManagedSystem | undefined
  getSystemAssignments: (systemId: string) => SystemAssignment[]
}

export const ProjectDataContext = createContext<ProjectDataContextValue | null>(null)
