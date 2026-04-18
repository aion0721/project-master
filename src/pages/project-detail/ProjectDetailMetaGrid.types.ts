import type {
  ManagedSystem,
  Phase,
  Project,
  ProjectDepartmentAssignment,
  ProjectLink,
  ProjectStatusEntry,
  ProjectStatusOverride,
} from '../../types/project'

export interface ScheduleDraft {
  startDate: string
  endDate: string
}

export interface ProjectSummaryDraft {
  projectNumber: string
  name: string
}

export interface ProjectSummaryCardProps {
  isEditing: boolean
  isSaving: boolean
  changed: boolean
  error: string | null
  pmName?: string
  project: Project
  draft: ProjectSummaryDraft
  onDraftChange: (patch: Partial<ProjectSummaryDraft>) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
}

export interface ScheduleCardProps {
  isEditing: boolean
  isSaving: boolean
  changed: boolean
  error: string | null
  project: Project
  draft: ScheduleDraft
  onDraftChange: (patch: Partial<ScheduleDraft>) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
}

export interface ProjectSystemCardProps {
  isEditing: boolean
  isSaving: boolean
  changed: boolean
  error: string | null
  availableSystems: ManagedSystem[]
  project: Project
  draftSystemIds: string[]
  onSystemChange: (systemId: string) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
}

export interface CurrentPhaseCardProps {
  currentPhase?: Phase
  isEditing: boolean
  isSaving: boolean
  changed: boolean
  error: string | null
  draftId: string
  projectPhases: Phase[]
  onDraftChange: (phaseId: string) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
}

export interface ProjectStatusCardProps {
  isEditing: boolean
  isSaving: boolean
  changed: boolean
  error: string | null
  bulkApplyEnabled: boolean
  draft: ProjectStatusOverride | null
  project: Project
  onBulkApplyChange: (checked: boolean) => void
  onDraftChange: (status: ProjectStatusOverride | null) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
}

export interface ProjectNoteCardProps {
  isEditing: boolean
  isSaving: boolean
  changed: boolean
  error: string | null
  draft: string
  project: Project
  onDraftChange: (note: string) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
}

export interface ProjectLinksCardProps {
  isEditing: boolean
  isSaving: boolean
  changed: boolean
  error: string | null
  draft: ProjectLink[]
  project: Project
  onAdd: () => void
  onDraftChange: (index: number, patch: Partial<ProjectLink>) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onRemove: (index: number) => void
}

export interface ProjectStatusEntriesCardProps {
  isEditing: boolean
  isSaving: boolean
  changed: boolean
  error: string | null
  draft: ProjectStatusEntry[]
  project: Project
  onAdd: () => void
  onDraftChange: (index: number, patch: Partial<ProjectStatusEntry>) => void
  onMove: (index: number, direction: 'up' | 'down') => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onRemove: (index: number) => void
}

export interface ProjectReportStatusCardProps {
  isEditing: boolean
  isSaving: boolean
  changed: boolean
  error: string | null
  draft: boolean
  project: Project
  onDraftChange: (hasReportItems: boolean) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
}

export interface ProjectDepartmentsCardProps {
  isEditing: boolean
  isSaving: boolean
  changed: boolean
  error: string | null
  availableDepartments: Array<{
    departmentCode: string
    departmentName: string
  }>
  projectDepartments: ProjectDepartmentAssignment[]
  draft: Array<{
    key: string
    id?: string
    departmentCode: string
    departmentName: string
    role: ProjectDepartmentAssignment['role']
    note: string
  }>
  onAdd: () => void
  onDraftChange: (
    key: string,
    patch: Partial<{
      id?: string
      departmentCode: string
      departmentName: string
      role: ProjectDepartmentAssignment['role']
      note: string
    }>,
  ) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onRemove: (key: string) => void
}

export interface ProjectDetailMetaGridProps {
  projectSummaryProps: ProjectSummaryCardProps
  scheduleProps: ScheduleCardProps
  projectSystemProps: ProjectSystemCardProps
  projectDepartmentsProps: ProjectDepartmentsCardProps
  currentPhaseProps: CurrentPhaseCardProps
  projectStatusProps: ProjectStatusCardProps
  projectNoteProps: ProjectNoteCardProps
  projectLinksProps: ProjectLinksCardProps
  projectStatusEntriesProps: ProjectStatusEntriesCardProps
  projectReportStatusProps: ProjectReportStatusCardProps
}
