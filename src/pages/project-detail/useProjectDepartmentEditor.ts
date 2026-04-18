import { useEffect, useState } from 'react'
import type {
  Project,
  ProjectDepartmentAssignment,
  ProjectDepartmentRole,
} from '../../types/project'

interface ProjectDepartmentDraft {
  key: string
  id?: string
  departmentCode: string
  departmentName: string
  role: ProjectDepartmentRole
  note: string
}

interface UpdateProjectDepartments {
  (
    projectId: string,
    input: {
      departments: Array<{
        id?: string
        departmentCode: string
        departmentName: string
        role: ProjectDepartmentRole
        note?: string | null
      }>
    },
  ): Promise<ProjectDepartmentAssignment[]>
}

function buildDraftFromDepartment(projectDepartment: ProjectDepartmentAssignment): ProjectDepartmentDraft {
  return {
    key: projectDepartment.id,
    id: projectDepartment.id,
    departmentCode: projectDepartment.departmentCode,
    departmentName: projectDepartment.departmentName,
    role: projectDepartment.role,
    note: projectDepartment.note ?? '',
  }
}

function createEmptyDepartmentDraft(index: number): ProjectDepartmentDraft {
  return {
    key: `new-project-department-${index}`,
    departmentCode: '',
    departmentName: '',
    role: '主管',
    note: '',
  }
}

export function useProjectDepartmentEditor(
  project: Project | undefined,
  projectDepartments: ProjectDepartmentAssignment[],
  updateProjectDepartments: UpdateProjectDepartments,
) {
  const [isProjectDepartmentsEditing, setIsProjectDepartmentsEditing] = useState(false)
  const [projectDepartmentDrafts, setProjectDepartmentDrafts] = useState<ProjectDepartmentDraft[]>([])
  const [projectDepartmentsError, setProjectDepartmentsError] = useState<string | null>(null)
  const [isSavingProjectDepartments, setIsSavingProjectDepartments] = useState(false)

  useEffect(() => {
    if (!project) {
      return
    }

    setProjectDepartmentDrafts(
      projectDepartments.length > 0
        ? projectDepartments.map(buildDraftFromDepartment)
        : [createEmptyDepartmentDraft(1)],
    )
    setProjectDepartmentsError(null)
  }, [project, projectDepartments])

  const normalizedDrafts = projectDepartmentDrafts
    .map((draft) => ({
      id: draft.id,
      departmentCode: draft.departmentCode.trim(),
      departmentName: draft.departmentName.trim(),
      role: draft.role,
      note: draft.note.trim() || null,
    }))
    .filter((draft) => draft.departmentCode || draft.departmentName || draft.note)

  const projectDepartmentsChanged =
    JSON.stringify(normalizedDrafts) !==
    JSON.stringify(
      projectDepartments.map((projectDepartment) => ({
        id: projectDepartment.id,
        departmentCode: projectDepartment.departmentCode,
        departmentName: projectDepartment.departmentName,
        role: projectDepartment.role,
        note: projectDepartment.note ?? null,
      })),
    )

  function openProjectDepartmentsEditor() {
    setProjectDepartmentDrafts(
      projectDepartments.length > 0
        ? projectDepartments.map(buildDraftFromDepartment)
        : [createEmptyDepartmentDraft(1)],
    )
    setProjectDepartmentsError(null)
    setIsProjectDepartmentsEditing(true)
  }

  function closeProjectDepartmentsEditor() {
    setProjectDepartmentDrafts(
      projectDepartments.length > 0
        ? projectDepartments.map(buildDraftFromDepartment)
        : [createEmptyDepartmentDraft(1)],
    )
    setProjectDepartmentsError(null)
    setIsProjectDepartmentsEditing(false)
  }

  function updateProjectDepartmentDraft(
    key: string,
    patch: Partial<Omit<ProjectDepartmentDraft, 'key'>>,
  ) {
    setProjectDepartmentDrafts((current) =>
      current.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)),
    )
    setProjectDepartmentsError(null)
  }

  function addProjectDepartmentDraft() {
    setProjectDepartmentDrafts((current) => [...current, createEmptyDepartmentDraft(current.length + 1)])
    setProjectDepartmentsError(null)
  }

  function removeProjectDepartmentDraft(key: string) {
    setProjectDepartmentDrafts((current) => {
      const nextDrafts = current.filter((draft) => draft.key !== key)
      return nextDrafts.length > 0 ? nextDrafts : [createEmptyDepartmentDraft(1)]
    })
    setProjectDepartmentsError(null)
  }

  async function saveProjectDepartments() {
    if (!project) {
      return
    }

    if (normalizedDrafts.some((draft) => !draft.departmentCode || !draft.departmentName)) {
      setProjectDepartmentsError('部署コードと部署名は両方入力してください。')
      return
    }

    const duplicateKeys = normalizedDrafts.map(
      (draft) => `${draft.departmentCode.toLocaleLowerCase()}::${draft.departmentName.toLocaleLowerCase()}`,
    )

    if (new Set(duplicateKeys).size !== duplicateKeys.length) {
      setProjectDepartmentsError('同じ部署コードと部署名の組み合わせは1件だけ登録できます。')
      return
    }

    setIsSavingProjectDepartments(true)
    setProjectDepartmentsError(null)

    try {
      await updateProjectDepartments(project.projectNumber, {
        departments: normalizedDrafts.map((draft) => ({
          id: draft.id,
          departmentCode: draft.departmentCode,
          departmentName: draft.departmentName,
          role: draft.role,
          note: draft.note,
        })),
      })
      setIsProjectDepartmentsEditing(false)
    } catch (caughtError) {
      setProjectDepartmentsError(
        caughtError instanceof Error ? caughtError.message : '部署情報の更新に失敗しました。',
      )
    } finally {
      setIsSavingProjectDepartments(false)
    }
  }

  return {
    isProjectDepartmentsEditing,
    projectDepartmentDrafts,
    projectDepartmentsChanged,
    projectDepartmentsError,
    isSavingProjectDepartments,
    openProjectDepartmentsEditor,
    closeProjectDepartmentsEditor,
    updateProjectDepartmentDraft,
    addProjectDepartmentDraft,
    removeProjectDepartmentDraft,
    saveProjectDepartments,
  }
}
