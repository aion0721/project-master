import { vi } from 'vitest'
import { buildProjectDetailResponse, buildProjectListResponse } from '../api/projectApi'
import {
  assignments,
  events,
  members,
  phases,
  projects,
  projectDepartments,
  systemAssignments,
  systemRelations,
  systemTransactions,
  systemTransactionSteps,
  systems,
} from '../data/mockData'
import type {
  CreateMemberInput,
  CreateProjectInput,
  CreateSystemRelationInput,
  CreateSystemTransactionInput,
  Phase,
  Project,
  ProjectDepartmentAssignment,
  ProjectEvent,
  SystemAssignment,
  UpdateProjectDepartmentsInput,
  UpdateProjectEventsInput,
  UpdateMemberInput,
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
} from '../types/project'

const allWorkStatuses = ['未着手', '進行中', '遅延', '完了'] as const

function cloneFixtures() {
  return {
    projects: projects.map((project) => ({
      ...project,
      projectLinks: project.projectLinks.map((link) => ({ ...link })),
      statusEntries: (project.statusEntries ?? []).map((entry) => ({ ...entry })),
    })),
    phases: phases.map((phase) => ({ ...phase })),
    events: events.map((event) => ({ ...event })),
    members: members.map((member) => ({
      ...member,
      departmentCode: member.departmentCode,
      departmentName: member.departmentName,
      lineLabel: member.lineLabel,
      bookmarkedProjectIds: [...member.bookmarkedProjectIds],
      defaultProjectStatusFilters: [...(member.defaultProjectStatusFilters ?? allWorkStatuses)],
    })),
    projectDepartments: projectDepartments.map((projectDepartment) => ({ ...projectDepartment })),
    systems: systems.map((system) => ({
      ...system,
      departmentNames: [...(system.departmentNames ?? [])],
      systemLinks: (system.systemLinks ?? []).map((link) => ({ ...link })),
    })),
    systemRelations: systemRelations.map((relation) => ({ ...relation })),
    systemTransactions: systemTransactions.map((transaction) => ({ ...transaction })),
    systemTransactionSteps: systemTransactionSteps.map((step) => ({ ...step })),
    assignments: assignments.map((assignment) => ({ ...assignment })),
    systemAssignments: systemAssignments.map((assignment) => ({ ...assignment })),
  }
}

type FixtureData = ReturnType<typeof cloneFixtures>

const standardPhaseTemplates = [
  { name: '予備検討', durationWeeks: 1 },
  { name: '基礎検討', durationWeeks: 2 },
  { name: '基本設計', durationWeeks: 2 },
  { name: '詳細設計', durationWeeks: 2 },
  { name: 'CT', durationWeeks: 1 },
  { name: 'ITa', durationWeeks: 1 },
  { name: 'ITb', durationWeeks: 1 },
  { name: 'UAT', durationWeeks: 1 },
  { name: '移行', durationWeeks: 1 },
] as const

function buildInitialPhases(projectId: string, assigneeMemberId: string, selectedPhaseNames: string[] | undefined) {
  const selectedSet = new Set(
    (selectedPhaseNames?.length ? selectedPhaseNames : standardPhaseTemplates.map((phase) => phase.name)).filter(
      (phaseName) => standardPhaseTemplates.some((phase) => phase.name === phaseName),
    ),
  )

  let currentWeek = 1

  return standardPhaseTemplates
    .filter((phase) => selectedSet.has(phase.name))
    .map((phase, index) => {
      const startWeek = currentWeek
      const endWeek = currentWeek + phase.durationWeeks - 1
      currentWeek = endWeek + 1

      return {
        id: `ph-${projectId}-${index + 1}`,
        projectId,
        name: phase.name,
        startWeek,
        endWeek,
        status: statusLabelByCode.not_started as Phase['status'],
        progress: 0,
        assigneeMemberId,
      }
    })
}

const statusLabelByCode = {
  not_started: projects.find((project) => project.projectNumber === 'PRJ-004')!.status,
  in_progress: projects.find((project) => project.projectNumber === 'PRJ-001')!.status,
  completed: projects.find((project) => project.projectNumber === 'PRJ-003')!.status,
  delayed: projects.find((project) => project.projectNumber === 'PRJ-002')!.status,
} as const

function createAssignmentIdGenerator(projectId: string, currentIds: string[]) {
  let nextSuffix =
    currentIds
      .filter((id) => id.startsWith(`as-${projectId}-`))
      .map((id) => Number(id.split('-').at(-1)))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 0) + 1

  return () => {
    const nextId = `as-${projectId}-${nextSuffix}`
    nextSuffix += 1
    return nextId
  }
}

function createPhaseIdGenerator(projectId: string, currentIds: string[]) {
  let nextSuffix =
    currentIds
      .filter((id) => id.startsWith(`ph-${projectId}-`))
      .map((id) => Number(id.split('-').at(-1)))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 0) + 1

  return () => {
    const nextId = `ph-${projectId}-${nextSuffix}`
    nextSuffix += 1
    return nextId
  }
}

function createSystemAssignmentIdGenerator(systemId: string, currentIds: string[]) {
  let nextSuffix =
    currentIds
      .filter((id) => id.startsWith(`sys-as-${systemId}-`))
      .map((id) => Number(id.split('-').at(-1)))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 0) + 1

  return () => {
    const nextId = `sys-as-${systemId}-${nextSuffix}`
    nextSuffix += 1
    return nextId
  }
}

function createEventIdGenerator(projectId: string, currentIds: string[]) {
  let nextSuffix =
    currentIds
      .filter((id) => id.startsWith(`ev-${projectId}-`))
      .map((id) => Number(id.split('-').at(-1)))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 0) + 1

  return () => {
    const nextId = `ev-${projectId}-${nextSuffix}`
    nextSuffix += 1
    return nextId
  }
}

function buildProjectKey(projectNumber: string) {
  return projectNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function deriveProjectStatus(projectPhases: Array<{ status: string }>) {
  if (projectPhases.some((phase) => phase.status === statusLabelByCode.delayed)) {
    return statusLabelByCode.delayed
  }

  if (projectPhases.every((phase) => phase.status === statusLabelByCode.completed)) {
    return statusLabelByCode.completed
  }

  if (
    projectPhases.some(
      (phase) =>
        phase.status === statusLabelByCode.in_progress || phase.status === statusLabelByCode.completed,
    )
  ) {
    return statusLabelByCode.in_progress
  }

  return statusLabelByCode.not_started
}

function getOrderedProjectPhases(fixtureData: FixtureData, projectNumber: string) {
  return fixtureData.phases.filter((phase) => phase.projectId === projectNumber)
}

function updateProjectStatus(fixtureData: FixtureData, projectNumber: string) {
  const project = fixtureData.projects.find((item) => item.projectNumber === projectNumber)

  if (!project) {
    return null
  }

  project.status = (project.statusOverride ??
    deriveProjectStatus(getOrderedProjectPhases(fixtureData, projectNumber))) as Project['status']
  return project
}

function renameProjectReferences(
  fixtureData: FixtureData,
  previousProjectNumber: string,
  nextProjectNumber: string,
) {
  fixtureData.phases.forEach((phase) => {
    if (phase.projectId === previousProjectNumber) {
      phase.projectId = nextProjectNumber
    }
  })

  fixtureData.events.forEach((event) => {
    if (event.projectId === previousProjectNumber) {
      event.projectId = nextProjectNumber
    }
  })

  fixtureData.assignments.forEach((assignment) => {
    if (assignment.projectId === previousProjectNumber) {
      assignment.projectId = nextProjectNumber
    }
  })

  fixtureData.projectDepartments.forEach((projectDepartment) => {
    if (projectDepartment.projectId === previousProjectNumber) {
      projectDepartment.projectId = nextProjectNumber
    }
  })
}

function updateCurrentPhaseState(fixtureData: FixtureData, projectNumber: string, phaseId: string) {
  const project = fixtureData.projects.find((item) => item.projectNumber === projectNumber)

  if (!project) {
    return null
  }

  const projectPhases = getOrderedProjectPhases(fixtureData, projectNumber)
  const targetIndex = projectPhases.findIndex((phase) => phase.id === phaseId)

  if (targetIndex === -1) {
    return null
  }

  projectPhases.forEach((phase, index) => {
    if (index < targetIndex) {
      phase.status = statusLabelByCode.completed as Phase['status']
      phase.progress = 100
      return
    }

    if (index === targetIndex) {
      phase.status = statusLabelByCode.in_progress as Phase['status']
      phase.progress = phase.progress === 100 ? 80 : phase.progress
      return
    }

    phase.status = statusLabelByCode.not_started as Phase['status']
    phase.progress = 0
  })

  updateProjectStatus(fixtureData, projectNumber)
  return buildProjectDetailResponse(fixtureData, projectNumber)
}

function buildJsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

export function mockProjectApi() {
  const fixtureData = cloneFixtures()

  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const requestUrl = typeof input === 'string' ? input : input.toString()
    const method = init?.method ?? 'GET'

    if (requestUrl.endsWith('/api/members') && method === 'GET') {
      return buildJsonResponse({ items: fixtureData.members }, 200)
    }

    if (requestUrl.endsWith('/api/project-departments') && method === 'GET') {
      return buildJsonResponse({ items: fixtureData.projectDepartments }, 200)
    }

    if (requestUrl.endsWith('/api/systems') && method === 'GET') {
      return buildJsonResponse({ items: fixtureData.systems }, 200)
    }

    if (requestUrl.endsWith('/api/system-relations') && method === 'GET') {
      return buildJsonResponse({ items: fixtureData.systemRelations }, 200)
    }

    if (requestUrl.endsWith('/api/system-transactions') && method === 'GET') {
      return buildJsonResponse({ items: fixtureData.systemTransactions }, 200)
    }

    if (requestUrl.endsWith('/api/system-transaction-steps') && method === 'GET') {
      return buildJsonResponse({ items: fixtureData.systemTransactionSteps }, 200)
    }

    if (requestUrl.endsWith('/api/system-assignments') && method === 'GET') {
      return buildJsonResponse({ items: fixtureData.systemAssignments }, 200)
    }

    if (requestUrl.endsWith('/api/members') && method === 'POST') {
      const body = JSON.parse(String(init?.body)) as CreateMemberInput

      if (
        !body.id.trim() ||
        !body.name.trim() ||
        !body.departmentCode.trim() ||
        !body.departmentName.trim() ||
        !body.role.trim()
      ) {
        return buildJsonResponse({ message: 'Missing required member fields' }, 400)
      }

      if (fixtureData.members.some((member) => member.id === body.id.trim())) {
        return buildJsonResponse({ message: 'Member ID already exists' }, 400)
      }

      if (
        body.managerId &&
        !fixtureData.members.some((member) => member.id === body.managerId)
      ) {
        return buildJsonResponse({ message: 'Manager not found' }, 400)
      }

      const member = {
        id: body.id.trim(),
        name: body.name.trim(),
        departmentCode: body.departmentCode.trim(),
        departmentName: body.departmentName.trim(),
        role: body.role.trim(),
        lineLabel: body.lineLabel?.trim() || undefined,
        managerId: body.managerId ?? null,
        bookmarkedProjectIds: [],
        defaultProjectStatusFilters: [...allWorkStatuses],
      }

      fixtureData.members.push(member)
      return buildJsonResponse({ member }, 201)
    }

    if (requestUrl.endsWith('/api/systems') && method === 'POST') {
      const body = JSON.parse(String(init?.body)) as {
        id: string
        name: string
        category: string
        ownerMemberId?: string | null
        departmentNames?: string[]
        note?: string | null
        systemLinks?: Array<{ label: string; url: string }>
      }

      const system = {
        id: body.id.trim(),
        name: body.name.trim(),
        category: body.category.trim(),
        ownerMemberId: body.ownerMemberId ?? null,
        departmentNames: [...new Set((body.departmentNames ?? []).map((name) => name.trim()).filter(Boolean))],
        note: body.note?.trim() || null,
        systemLinks: body.systemLinks ?? [],
      }

      fixtureData.systems.push(system)
      if (system.ownerMemberId) {
        fixtureData.systemAssignments.push({
          id: `sys-as-${system.id}-1`,
          systemId: system.id,
          memberId: system.ownerMemberId,
          responsibility: 'オーナー',
          reportsToMemberId: null,
        })
      }
      return buildJsonResponse({ system }, 201)
    }

    if (requestUrl.endsWith('/api/system-relations') && method === 'POST') {
      const body = JSON.parse(String(init?.body)) as CreateSystemRelationInput
      const existingIds = fixtureData.systemRelations
        .map((relation) => Number(relation.id.replace('rel-', '')))
        .filter((value) => Number.isFinite(value))
      const relation = {
        id: `rel-${String((existingIds.length > 0 ? Math.max(...existingIds) : 0) + 1).padStart(3, '0')}`,
        sourceSystemId: body.sourceSystemId,
        targetSystemId: body.targetSystemId,
        protocol: body.protocol?.trim() || null,
        note: body.note?.trim() || null,
      }

      fixtureData.systemRelations.push(relation)
      return buildJsonResponse({ relation }, 201)
    }

    const systemRelationMatch = requestUrl.match(/\/api\/system-relations\/([^/]+)$/)
    if (systemRelationMatch && method === 'PATCH') {
      const relationId = systemRelationMatch[1]
      const relation = fixtureData.systemRelations.find((item) => item.id === relationId)

      if (!relation) {
        return buildJsonResponse({ message: 'System relation not found' }, 404)
      }

      const body = JSON.parse(String(init?.body)) as UpdateSystemRelationInput
      const sourceSystemId = body.sourceSystemId.trim()
      const targetSystemId = body.targetSystemId.trim()

      if (!sourceSystemId || !targetSystemId) {
        return buildJsonResponse({ message: 'System relation fields are required' }, 400)
      }

      if (sourceSystemId === targetSystemId) {
        return buildJsonResponse({ message: 'System relation cannot point to the same system' }, 400)
      }

      if (
        !fixtureData.systems.some((system) => system.id === sourceSystemId) ||
        !fixtureData.systems.some((system) => system.id === targetSystemId)
      ) {
        return buildJsonResponse({ message: 'System in relation does not exist' }, 400)
      }

      if (
        fixtureData.systemRelations.some(
          (item) =>
            item.id !== relationId &&
            item.sourceSystemId === sourceSystemId &&
            item.targetSystemId === targetSystemId,
        )
      ) {
        return buildJsonResponse({ message: 'System relation already exists' }, 400)
      }

      const directionChanged =
        relation.sourceSystemId !== sourceSystemId || relation.targetSystemId !== targetSystemId

      if (
        directionChanged &&
        fixtureData.systemTransactionSteps.some((step) => step.relationId === relationId)
      ) {
        return buildJsonResponse(
          {
            message: 'System relation source/target cannot be changed while linked to a system transaction',
          },
          400,
        )
      }

      relation.sourceSystemId = sourceSystemId
      relation.targetSystemId = targetSystemId
      relation.protocol = body.protocol?.trim() || null
      relation.note = body.note?.trim() || null

      return buildJsonResponse({ relation }, 200)
    }

    if (requestUrl.endsWith('/api/system-transactions') && method === 'POST') {
      const body = JSON.parse(String(init?.body)) as CreateSystemTransactionInput
      const existingTransactionIds = fixtureData.systemTransactions
        .map((transaction) => Number(transaction.id.replace('tx-', '')))
        .filter((value) => Number.isFinite(value))
      const nextTransactionId = `tx-${String((existingTransactionIds.length > 0 ? Math.max(...existingTransactionIds) : 0) + 1).padStart(3, '0')}`
      const existingStepIds = fixtureData.systemTransactionSteps
        .map((step) => Number(step.id.replace('tx-step-', '')))
        .filter((value) => Number.isFinite(value))
      let nextStepNumber = (existingStepIds.length > 0 ? Math.max(...existingStepIds) : 0) + 1

      const transaction = {
        id: nextTransactionId,
        name: body.name.trim(),
        dataLabel: body.dataLabel.trim(),
        note: body.note?.trim() || null,
      }
      const steps = body.steps
        .slice()
        .sort((left, right) => left.stepOrder - right.stepOrder)
        .map((step) => ({
          id: `tx-step-${String(nextStepNumber++).padStart(3, '0')}`,
          transactionId: nextTransactionId,
          relationId: step.relationId,
          sourceSystemId: step.sourceSystemId,
          targetSystemId: step.targetSystemId,
          stepOrder: step.stepOrder,
          actionLabel: step.actionLabel?.trim() || null,
          note: step.note?.trim() || null,
        }))

      fixtureData.systemTransactions.push(transaction)
      fixtureData.systemTransactionSteps.push(...steps)

      return buildJsonResponse({ transaction, steps }, 201)
    }

    if (requestUrl.endsWith('/api/members/login') && method === 'POST') {
      const body = JSON.parse(String(init?.body)) as { memberKey: string }
      const normalizedMemberKey = body.memberKey.trim().toLocaleLowerCase()
      const user = fixtureData.members.find(
        (member) => member.id.toLocaleLowerCase() === normalizedMemberKey,
      )

      return new Response(JSON.stringify(user ? { user } : { message: 'Member not found' }), {
        status: user ? 200 : 404,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const getUserMatch = requestUrl.match(/\/api\/members\/([^/]+)$/)
    if (getUserMatch && method === 'GET') {
      const user = fixtureData.members.find((item) => item.id === getUserMatch[1])

      return new Response(JSON.stringify({ user }), {
        status: user ? 200 : 404,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const bookmarkMatch = requestUrl.match(/\/api\/members\/([^/]+)\/bookmarks$/)
    if (bookmarkMatch && method === 'PATCH') {
      const user = fixtureData.members.find((item) => item.id === bookmarkMatch[1])

      if (!user) {
        return new Response(JSON.stringify({ message: 'User not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      const body = JSON.parse(String(init?.body)) as { projectId: string }
      user.bookmarkedProjectIds = user.bookmarkedProjectIds.includes(body.projectId)
        ? user.bookmarkedProjectIds.filter((id) => id !== body.projectId)
        : [...user.bookmarkedProjectIds, body.projectId]

      return new Response(JSON.stringify({ user }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const preferencesMatch = requestUrl.match(/\/api\/members\/([^/]+)\/preferences\/project-status-filters$/)
    if (preferencesMatch && method === 'PATCH') {
      const user = fixtureData.members.find((item) => item.id === preferencesMatch[1])

      if (!user) {
        return new Response(JSON.stringify({ message: 'User not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      const body = JSON.parse(String(init?.body)) as {
        defaultProjectStatusFilters: Array<(typeof allWorkStatuses)[number]>
      }

      user.defaultProjectStatusFilters = allWorkStatuses.filter((status) =>
        body.defaultProjectStatusFilters.includes(status),
      )

      return new Response(JSON.stringify({ user }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const systemMatch = requestUrl.match(/\/api\/systems\/([^/]+)$/)
    if (systemMatch && method === 'PATCH') {
      const system = fixtureData.systems.find((item) => item.id === systemMatch[1])

      if (!system) {
        return buildJsonResponse({ message: 'System not found' }, 404)
      }

      const body = JSON.parse(String(init?.body)) as {
        name: string
        category: string
        ownerMemberId?: string | null
        departmentNames?: string[]
        note?: string | null
        systemLinks?: Array<{ label: string; url: string }>
      }

      system.name = body.name.trim()
      system.category = body.category.trim()
      system.ownerMemberId = body.ownerMemberId ?? null
      system.departmentNames = [...new Set((body.departmentNames ?? []).map((name) => name.trim()).filter(Boolean))]
      system.note = body.note?.trim() || null
      if (body.systemLinks) {
        system.systemLinks = body.systemLinks
      }

      return buildJsonResponse({ system }, 200)
    }

    if (systemMatch && method === 'DELETE') {
      const system = fixtureData.systems.find((item) => item.id === systemMatch[1])

      if (!system) {
        return buildJsonResponse({ message: 'System not found' }, 404)
      }

      if (fixtureData.projects.some((project) => (project.relatedSystemIds ?? []).includes(system.id))) {
        return buildJsonResponse({ message: 'System is linked to a project' }, 400)
      }

      if (
        fixtureData.systemRelations.some(
          (relation) => relation.sourceSystemId === system.id || relation.targetSystemId === system.id,
        )
      ) {
        return buildJsonResponse({ message: 'System is linked to a system relation' }, 400)
      }

      fixtureData.systems = fixtureData.systems.filter((item) => item.id !== system.id)
      fixtureData.systemAssignments = fixtureData.systemAssignments.filter(
        (assignment) => assignment.systemId !== system.id,
      )
      return buildJsonResponse({ systemId: system.id }, 200)
    }

    const systemStructureMatch = requestUrl.match(/\/api\/systems\/([^/]+)\/structure$/)
    if (systemStructureMatch && method === 'PATCH') {
      const systemId = systemStructureMatch[1]
      const body = JSON.parse(String(init?.body)) as UpdateSystemStructureInput
      const system = fixtureData.systems.find((item) => item.id === systemId)

      if (!system) {
        return buildJsonResponse({ message: 'System not found' }, 404)
      }

      system.ownerMemberId = body.ownerMemberId
      const currentAssignments = fixtureData.systemAssignments.filter(
        (assignment) => assignment.systemId === systemId,
      )
      const nextAssignmentId = createSystemAssignmentIdGenerator(
        systemId,
        currentAssignments.map((assignment) => assignment.id),
      )
      const nextAssignments: SystemAssignment[] = [
        {
          id:
            currentAssignments.find((assignment) => assignment.responsibility === 'オーナー')?.id ??
            nextAssignmentId(),
          systemId,
          memberId: body.ownerMemberId,
          responsibility: 'オーナー',
          reportsToMemberId: null,
        },
        ...body.assignments.map((assignment) => ({
          id: assignment.id ?? nextAssignmentId(),
          systemId,
          memberId: assignment.memberId,
          responsibility: assignment.responsibility.trim(),
          reportsToMemberId: assignment.reportsToMemberId ?? null,
        })),
      ]

      fixtureData.systemAssignments = fixtureData.systemAssignments
        .filter((assignment) => assignment.systemId !== systemId)
        .concat(nextAssignments)

      return buildJsonResponse({ system, assignments: nextAssignments }, 200)
    }

    const relationMatch = requestUrl.match(/\/api\/system-relations\/([^/]+)$/)
    if (relationMatch && method === 'DELETE') {
      const relation = fixtureData.systemRelations.find((item) => item.id === relationMatch[1])

      if (!relation) {
        return buildJsonResponse({ message: 'System relation not found' }, 404)
      }

      fixtureData.systemRelations = fixtureData.systemRelations.filter((item) => item.id !== relation.id)
      return buildJsonResponse({ relationId: relation.id }, 200)
    }

    const transactionMatch = requestUrl.match(/\/api\/system-transactions\/([^/]+)$/)
    if (transactionMatch && method === 'PATCH') {
      const transactionId = transactionMatch[1]
      const body = JSON.parse(String(init?.body)) as UpdateSystemTransactionInput
      const transaction = fixtureData.systemTransactions.find((item) => item.id === transactionId)

      if (!transaction) {
        return buildJsonResponse({ message: 'System transaction not found' }, 404)
      }

      const currentSteps = fixtureData.systemTransactionSteps.filter((step) => step.transactionId === transactionId)
      const existingStepIds = fixtureData.systemTransactionSteps
        .map((step) => Number(step.id.replace('tx-step-', '')))
        .filter((value) => Number.isFinite(value))
      let nextStepNumber = (existingStepIds.length > 0 ? Math.max(...existingStepIds) : 0) + 1

      transaction.name = body.name.trim()
      transaction.dataLabel = body.dataLabel.trim()
      transaction.note = body.note?.trim() || null

      const steps = body.steps
        .slice()
        .sort((left, right) => left.stepOrder - right.stepOrder)
        .map((step) => ({
          id:
            step.id && currentSteps.some((currentStep) => currentStep.id === step.id)
              ? step.id
              : `tx-step-${String(nextStepNumber++).padStart(3, '0')}`,
          transactionId,
          relationId: step.relationId,
          sourceSystemId: step.sourceSystemId,
          targetSystemId: step.targetSystemId,
          stepOrder: step.stepOrder,
          actionLabel: step.actionLabel?.trim() || null,
          note: step.note?.trim() || null,
        }))

      fixtureData.systemTransactionSteps = fixtureData.systemTransactionSteps
        .filter((step) => step.transactionId !== transactionId)
        .concat(steps)

      return buildJsonResponse({ transaction, steps }, 200)
    }

    if (transactionMatch && method === 'DELETE') {
      const transactionId = transactionMatch[1]
      const transaction = fixtureData.systemTransactions.find((item) => item.id === transactionId)

      if (!transaction) {
        return buildJsonResponse({ message: 'System transaction not found' }, 404)
      }

      fixtureData.systemTransactions = fixtureData.systemTransactions.filter(
        (item) => item.id !== transactionId,
      )
      fixtureData.systemTransactionSteps = fixtureData.systemTransactionSteps.filter(
        (step) => step.transactionId !== transactionId,
      )

      return buildJsonResponse({ transactionId }, 200)
    }

    if (requestUrl.endsWith('/api/projects') && method === 'GET') {
      return new Response(JSON.stringify(buildProjectListResponse(fixtureData)), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    if (requestUrl.endsWith('/api/projects') && method === 'POST') {
      const body = JSON.parse(String(init?.body)) as Omit<CreateProjectInput, 'status'> & {
        status: keyof typeof statusLabelByCode
      }

      const project = {
        projectNumber: body.projectNumber,
        name: body.name,
        startDate: body.startDate,
        endDate: body.endDate,
        status: statusLabelByCode[body.status],
        pmMemberId: body.pmMemberId,
        note: body.note?.trim() || null,
        statusEntries: [],
        hasReportItems: body.hasReportItems ?? false,
        relatedSystemIds: body.relatedSystemIds ?? [],
        projectLinks: body.projectLinks ?? [],
      }

      fixtureData.projects.push(project)
      const projectKey = buildProjectKey(body.projectNumber)

      fixtureData.assignments.push({
        id: `as-${projectKey}-1`,
        projectId: body.projectNumber,
        memberId: body.pmMemberId,
        responsibility: 'PM',
        reportsToMemberId: null,
      })

      buildInitialPhases(body.projectNumber, body.pmMemberId, body.initialPhaseNames).forEach((phase) => {
        fixtureData.phases.push(phase)
      })

      const detail = buildProjectDetailResponse(fixtureData, body.projectNumber)

      return new Response(JSON.stringify(detail), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const projectMatch = requestUrl.match(/\/api\/projects\/([^/]+)$/)
    if (projectMatch && method === 'PATCH') {
      const projectNumber = projectMatch[1]
      const body = JSON.parse(String(init?.body)) as UpdateProjectSummaryInput
      const project = fixtureData.projects.find((item) => item.projectNumber === projectNumber)

      if (!project) {
        return buildJsonResponse({ message: 'Project not found' }, 404)
      }

      const nextProjectNumber = body.projectNumber.trim()
      const nextProjectName = body.name.trim()

      if (!nextProjectNumber || !nextProjectName) {
        return buildJsonResponse({ message: 'Project number and name are required' }, 400)
      }

      if (
        nextProjectNumber !== projectNumber &&
        fixtureData.projects.some((item) => item.projectNumber === nextProjectNumber)
      ) {
        return buildJsonResponse({ message: 'Project number already exists' }, 400)
      }

      project.name = nextProjectName

      if (nextProjectNumber !== projectNumber) {
        project.projectNumber = nextProjectNumber
        renameProjectReferences(fixtureData, projectNumber, nextProjectNumber)
      }

      const detail = buildProjectDetailResponse(
        fixtureData,
        nextProjectNumber !== projectNumber ? nextProjectNumber : projectNumber,
      )

      return buildJsonResponse(detail, 200)
    }

    const currentPhaseMatch = requestUrl.match(/\/api\/projects\/([^/]+)\/current-phase$/)
    if (currentPhaseMatch && method === 'PATCH') {
      const projectNumber = currentPhaseMatch[1]
      const body = JSON.parse(String(init?.body)) as { phaseId: string }
      const detail = updateCurrentPhaseState(fixtureData, projectNumber, body.phaseId)

      return new Response(JSON.stringify(detail ?? { message: 'Project or phase not found' }), {
        status: detail ? 200 : 404,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const scheduleMatch = requestUrl.match(/\/api\/projects\/([^/]+)\/schedule$/)
    if (scheduleMatch && method === 'PATCH') {
      const projectNumber = scheduleMatch[1]
      const body = JSON.parse(String(init?.body)) as UpdateProjectScheduleInput
      const project = fixtureData.projects.find((item) => item.projectNumber === projectNumber)

      if (!project) {
        return new Response(JSON.stringify({ message: 'Project not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      if (body.startDate > body.endDate) {
        return new Response(JSON.stringify({ message: 'Invalid schedule' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      project.startDate = body.startDate
      project.endDate = body.endDate

      const detail = buildProjectDetailResponse(fixtureData, projectNumber)

      return new Response(JSON.stringify(detail), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const linksMatch = requestUrl.match(/\/api\/projects\/([^/]+)\/links$/)
    if (linksMatch && method === 'PATCH') {
      const projectNumber = linksMatch[1]
      const body = JSON.parse(String(init?.body)) as UpdateProjectLinksInput
      const project = fixtureData.projects.find((item) => item.projectNumber === projectNumber)

      if (!project) {
        return new Response(JSON.stringify({ message: 'Project not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      project.projectLinks = body.projectLinks.map((link) => ({
        label: link.label.trim(),
        url: link.url.trim(),
      }))

      const detail = buildProjectDetailResponse(fixtureData, projectNumber)

      return new Response(JSON.stringify(detail), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const systemsMatch = requestUrl.match(/\/api\/projects\/([^/]+)\/systems$/)
    if (systemsMatch && method === 'PATCH') {
      const projectNumber = systemsMatch[1]
      const body = JSON.parse(String(init?.body)) as UpdateProjectSystemsInput
      const project = fixtureData.projects.find((item) => item.projectNumber === projectNumber)

      if (!project) {
        return new Response(JSON.stringify({ message: 'Project not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      project.relatedSystemIds = [...new Set(body.relatedSystemIds)]

      const detail = buildProjectDetailResponse(fixtureData, projectNumber)

      return new Response(JSON.stringify(detail), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const projectDepartmentsMatch = requestUrl.match(/\/api\/projects\/([^/]+)\/departments$/)
    if (projectDepartmentsMatch && method === 'PATCH') {
      const projectNumber = projectDepartmentsMatch[1]
      const body = JSON.parse(String(init?.body)) as UpdateProjectDepartmentsInput
      const project = fixtureData.projects.find((item) => item.projectNumber === projectNumber)

      if (!project) {
        return new Response(JSON.stringify({ message: 'Project not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      const nextDepartments: ProjectDepartmentAssignment[] = body.departments.map((department, index) => ({
        id: department.id ?? `proj-dept-${projectNumber}-${index + 1}`,
        projectId: projectNumber,
        departmentCode: department.departmentCode.trim(),
        departmentName: department.departmentName.trim(),
        role: department.role,
        note: department.note?.trim() || null,
      }))

      fixtureData.projectDepartments = fixtureData.projectDepartments
        .filter((projectDepartment) => projectDepartment.projectId !== projectNumber)
        .concat(nextDepartments)

      return new Response(JSON.stringify({ projectDepartments: nextDepartments }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const noteMatch = requestUrl.match(/\/api\/projects\/([^/]+)\/note$/)
    if (noteMatch && method === 'PATCH') {
      const projectNumber = noteMatch[1]
      const body = JSON.parse(String(init?.body)) as { note?: string | null }
      const project = fixtureData.projects.find((item) => item.projectNumber === projectNumber)

      if (!project) {
        return new Response(JSON.stringify({ message: 'Project not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      project.note = body.note?.trim() || null

      const detail = buildProjectDetailResponse(fixtureData, projectNumber)

      return new Response(JSON.stringify(detail), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const statusEntriesMatch = requestUrl.match(/\/api\/projects\/([^/]+)\/status-entries$/)
    if (statusEntriesMatch && method === 'PATCH') {
      const projectNumber = statusEntriesMatch[1]
      const body = JSON.parse(String(init?.body)) as {
        statusEntries?: Array<{ date: string; content: string }>
      }
      const project = fixtureData.projects.find((item) => item.projectNumber === projectNumber)

      if (!project) {
        return new Response(JSON.stringify({ message: 'Project not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      project.statusEntries = (body.statusEntries ?? [])
        .map((entry) => ({
          date: entry.date.trim(),
          content: entry.content.trim(),
        }))
        .filter((entry) => entry.date || entry.content)

      const detail = buildProjectDetailResponse(fixtureData, projectNumber)

      return new Response(JSON.stringify(detail), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const reportStatusMatch = requestUrl.match(/\/api\/projects\/([^/]+)\/report-status$/)
    if (reportStatusMatch && method === 'PATCH') {
      const projectNumber = reportStatusMatch[1]
      const body = JSON.parse(String(init?.body)) as { hasReportItems: boolean }
      const project = fixtureData.projects.find((item) => item.projectNumber === projectNumber)

      if (!project) {
        return new Response(JSON.stringify({ message: 'Project not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      project.hasReportItems = body.hasReportItems

      const detail = buildProjectDetailResponse(fixtureData, projectNumber)

      return new Response(JSON.stringify(detail), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const statusOverrideMatch = requestUrl.match(/\/api\/projects\/([^/]+)\/status-override$/)
    if (statusOverrideMatch && method === 'PATCH') {
      const projectNumber = statusOverrideMatch[1]
      const body = JSON.parse(String(init?.body)) as { statusOverride?: Project['status'] | null }
      const project = fixtureData.projects.find((item) => item.projectNumber === projectNumber)

      if (!project) {
        return new Response(JSON.stringify({ message: 'Project not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      project.statusOverride = body.statusOverride ?? null
      updateProjectStatus(fixtureData, projectNumber)

      const detail = buildProjectDetailResponse(fixtureData, projectNumber)

      return new Response(JSON.stringify(detail), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const eventsMatch = requestUrl.match(/\/api\/projects\/([^/]+)\/events$/)
    if (eventsMatch && method === 'PATCH') {
      const projectNumber = eventsMatch[1]
      const body = JSON.parse(String(init?.body)) as UpdateProjectEventsInput
      const project = fixtureData.projects.find((item) => item.projectNumber === projectNumber)

      if (!project) {
        return new Response(JSON.stringify({ message: 'Project not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      const nextEventId = createEventIdGenerator(projectNumber, fixtureData.events.map((event) => event.id))
      const nextEvents: ProjectEvent[] = body.events.map((event) => ({
        id: event.id ?? nextEventId(),
        projectId: projectNumber,
        name: event.name.trim(),
        week: event.week,
        status: event.status,
        ownerMemberId: event.ownerMemberId ?? null,
        note: event.note?.trim() || null,
      }))

      fixtureData.events = fixtureData.events
        .filter((event) => event.projectId !== projectNumber)
        .concat(nextEvents)

      const detail = buildProjectDetailResponse(fixtureData, projectNumber)

      return new Response(JSON.stringify(detail), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const phasesMatch = requestUrl.match(/\/api\/projects\/([^/]+)\/phases$/)
    if (phasesMatch && method === 'PATCH') {
      const projectNumber = phasesMatch[1]
      const body = JSON.parse(String(init?.body)) as UpdateProjectPhasesInput
      const project = fixtureData.projects.find((item) => item.projectNumber === projectNumber)

      if (!project) {
        return new Response(JSON.stringify({ message: 'Project not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      const nextPhaseId = createPhaseIdGenerator(projectNumber, fixtureData.phases.map((phase) => phase.id))
      const nextPhases = body.phases.map((phase) => ({
        id: phase.id ?? nextPhaseId(),
        projectId: projectNumber,
        name: phase.name,
        startWeek: phase.startWeek,
        endWeek: phase.endWeek,
        status: phase.status,
        progress: phase.progress,
        assigneeMemberId: project.pmMemberId,
      }))

      fixtureData.phases = fixtureData.phases
        .filter((phase) => phase.projectId !== projectNumber)
        .concat(nextPhases)

      updateProjectStatus(fixtureData, projectNumber)
      const detail = buildProjectDetailResponse(fixtureData, projectNumber)

      return new Response(JSON.stringify(detail), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const structureMatch = requestUrl.match(/\/api\/projects\/([^/]+)\/structure$/)
    if (structureMatch && method === 'PATCH') {
      const projectNumber = structureMatch[1]
      const body = JSON.parse(String(init?.body)) as UpdateProjectStructureInput
      const project = fixtureData.projects.find((item) => item.projectNumber === projectNumber)

      if (!project) {
        return new Response(JSON.stringify({ message: 'Project not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      project.pmMemberId = body.pmMemberId

      const currentProjectAssignments = fixtureData.assignments.filter(
        (assignment) => assignment.projectId === projectNumber,
      )
      const existingIds = currentProjectAssignments.map((assignment) => assignment.id)

      const nextAssignmentId = createAssignmentIdGenerator(buildProjectKey(projectNumber), existingIds)
      const nextAssignments = [
        {
          id:
            currentProjectAssignments.find((assignment) => assignment.responsibility === 'PM')?.id ??
            nextAssignmentId(),
          projectId: projectNumber,
          memberId: body.pmMemberId,
          responsibility: 'PM',
          reportsToMemberId: null,
        },
        ...body.assignments.map((assignment) => ({
          id: assignment.id ?? nextAssignmentId(),
          projectId: projectNumber,
          memberId: assignment.memberId,
          responsibility: assignment.responsibility,
          reportsToMemberId: assignment.reportsToMemberId ?? null,
        })),
      ]

      fixtureData.assignments = fixtureData.assignments
        .filter((assignment) => assignment.projectId !== projectNumber)
        .concat(nextAssignments)

      const detail = buildProjectDetailResponse(fixtureData, projectNumber)

      return new Response(JSON.stringify(detail), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const phaseMatch = requestUrl.match(/\/api\/phases\/([^/]+)$/)
    if (phaseMatch && method === 'PATCH') {
      const phaseId = phaseMatch[1]
      const body = JSON.parse(String(init?.body)) as UpdatePhaseInput
      const targetPhase = fixtureData.phases.find((phase) => phase.id === phaseId)

      if (!targetPhase) {
        return new Response(JSON.stringify({ message: 'Phase not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      targetPhase.startWeek = body.startWeek
      targetPhase.endWeek = body.endWeek
      targetPhase.status = body.status
      targetPhase.progress = body.progress

      const targetProject = updateProjectStatus(fixtureData, targetPhase.projectId)

      if (!targetProject) {
        return new Response(JSON.stringify({ message: 'Project not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }

      return new Response(JSON.stringify({ phase: targetPhase, project: targetProject }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    const memberMatch = requestUrl.match(/\/api\/members\/([^/]+)$/)
    if (memberMatch && method === 'PATCH') {
      const memberId = memberMatch[1]
      const body = JSON.parse(String(init?.body)) as UpdateMemberInput
      const member = fixtureData.members.find((item) => item.id === memberId)

      if (!member) {
        return buildJsonResponse({ message: 'Member not found' }, 404)
      }

      if (
        !body.name.trim() ||
        !body.departmentCode.trim() ||
        !body.departmentName.trim() ||
        !body.role.trim()
      ) {
        return buildJsonResponse({ message: 'Missing required member fields' }, 400)
      }

      if (body.managerId === memberId) {
        return buildJsonResponse({ message: 'Member cannot manage themselves' }, 400)
      }

      if (
        body.managerId &&
        !fixtureData.members.some((item) => item.id === body.managerId)
      ) {
        return buildJsonResponse({ message: 'Manager not found' }, 400)
      }

      member.name = body.name.trim()
      member.departmentCode = body.departmentCode.trim()
      member.departmentName = body.departmentName.trim()
      member.role = body.role.trim()
      member.lineLabel = body.lineLabel?.trim() || undefined
      member.managerId = body.managerId ?? null

      return buildJsonResponse({ member }, 200)
    }

    if (memberMatch && method === 'DELETE') {
      const memberId = memberMatch[1]
      const member = fixtureData.members.find((item) => item.id === memberId)

      if (!member) {
        return buildJsonResponse({ message: 'Member not found' }, 404)
      }

      if (fixtureData.projects.some((project) => project.pmMemberId === memberId)) {
        return buildJsonResponse({ message: 'PM assigned member cannot be deleted' }, 400)
      }

      if (fixtureData.assignments.some((assignment) => assignment.memberId === memberId)) {
        return buildJsonResponse({ message: 'Assigned member cannot be deleted' }, 400)
      }

      if (fixtureData.assignments.some((assignment) => assignment.reportsToMemberId === memberId)) {
        return buildJsonResponse({ message: 'Member is used in a project hierarchy' }, 400)
      }

      if (fixtureData.members.some((item) => item.managerId === memberId)) {
        return buildJsonResponse({ message: 'Manager with subordinates cannot be deleted' }, 400)
      }

      fixtureData.members = fixtureData.members.filter((item) => item.id !== memberId)
      return buildJsonResponse({ memberId }, 200)
    }

    const detailMatch = requestUrl.match(/\/api\/projects\/([^/]+)$/)
    if (detailMatch && method === 'GET') {
      const detail = buildProjectDetailResponse(fixtureData, detailMatch[1])

      return new Response(JSON.stringify(detail), {
        status: detail ? 200 : 404,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }

    return new Response(JSON.stringify({ message: 'Not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  })
}
