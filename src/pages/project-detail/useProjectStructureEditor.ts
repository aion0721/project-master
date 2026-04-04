import { useEffect, useState } from 'react'
import type { Project } from '../../types/project'
import {
  normalizeAssignments,
  type StructureAssignmentDraft,
} from './projectDetailTypes'

interface UpdateProjectStructure {
  (
    projectId: string,
    input: {
      pmMemberId: string
      assignments: Array<{
        id?: string
        memberId: string
        responsibility: string
      }>
    },
  ): Promise<unknown>
}

export function useProjectStructureEditor(
  project: Project | undefined,
  editableAssignments: StructureAssignmentDraft[],
  responsibilityOptions: string[],
  updateProjectStructure: UpdateProjectStructure,
) {
  const [isStructureEditing, setIsStructureEditing] = useState(false)
  const [structurePmMemberId, setStructurePmMemberId] = useState('')
  const [structureAssignments, setStructureAssignments] = useState<StructureAssignmentDraft[]>([])
  const [structureError, setStructureError] = useState<string | null>(null)
  const [isSavingStructure, setIsSavingStructure] = useState(false)

  useEffect(() => {
    if (!project) {
      return
    }

    setStructurePmMemberId(project.pmMemberId)
    setStructureAssignments(editableAssignments)
    setStructureError(null)
  }, [editableAssignments, project])

  const structureChanged = project
    ? structurePmMemberId !== project.pmMemberId ||
      JSON.stringify(normalizeAssignments(structureAssignments)) !==
        JSON.stringify(normalizeAssignments(editableAssignments))
    : false

  function resetStructureEditor() {
    if (!project) {
      return
    }

    setStructurePmMemberId(project.pmMemberId)
    setStructureAssignments(editableAssignments)
    setStructureError(null)
  }

  function openStructureEditor() {
    resetStructureEditor()
    setIsStructureEditing(true)
  }

  function closeStructureEditor() {
    resetStructureEditor()
    setIsStructureEditing(false)
  }

  function updateStructureAssignment(index: number, patch: Partial<StructureAssignmentDraft>) {
    setStructureAssignments((current) =>
      current.map((assignment, assignmentIndex) =>
        assignmentIndex === index ? { ...assignment, ...patch } : assignment,
      ),
    )
  }

  function addStructureAssignment() {
    setStructureAssignments((current) => [
      ...current,
      {
        memberId: '',
        responsibility: responsibilityOptions[0] ?? 'OS',
      },
    ])
  }

  function removeStructureAssignment(index: number) {
    setStructureAssignments((current) =>
      current.filter((_, assignmentIndex) => assignmentIndex !== index),
    )
  }

  async function saveStructure() {
    if (!project) {
      return
    }

    setStructureError(null)

    if (!structurePmMemberId) {
      setStructureError('PM を選択してください。')
      return
    }

    const normalizedAssignments = normalizeAssignments(structureAssignments)
    const hasInvalidAssignment = normalizedAssignments.some(
      (assignment) => !assignment.memberId || !assignment.responsibility,
    )

    if (hasInvalidAssignment) {
      setStructureError('各役割に担当者と責務を入力してください。')
      return
    }

    setIsSavingStructure(true)

    try {
      await updateProjectStructure(project.projectNumber, {
        pmMemberId: structurePmMemberId,
        assignments: normalizedAssignments,
      })
      setIsStructureEditing(false)
    } catch (caughtError) {
      setStructureError(
        caughtError instanceof Error ? caughtError.message : 'プロジェクト体制の更新に失敗しました。',
      )
    } finally {
      setIsSavingStructure(false)
    }
  }

  return {
    isSavingStructure,
    isStructureEditing,
    structureAssignments,
    structureChanged,
    structureError,
    structurePmMemberId,
    addStructureAssignment,
    closeStructureEditor,
    openStructureEditor,
    removeStructureAssignment,
    saveStructure,
    setStructurePmMemberId,
    updateStructureAssignment,
  }
}
