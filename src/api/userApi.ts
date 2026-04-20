import type { Member } from '../types/project'
import { normalizeDefaultProjectStatusFilters } from '../utils/userPreferences'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787'

interface UserResponse {
  user: Member
}

interface ApiErrorResponse {
  message?: string
}

async function sendJson<TResponse, TRequest>(
  path: string,
  method: 'POST' | 'PATCH',
  body: TRequest,
  signal?: AbortSignal,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    let message = `API request failed: ${response.status}`

    try {
      const errorBody = (await response.json()) as ApiErrorResponse
      if (errorBody.message?.trim()) {
        message = errorBody.message
      }
    } catch {
      // Ignore non-JSON error responses and keep the fallback message.
    }

    throw new Error(message)
  }

  return (await response.json()) as TResponse
}

async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    let message = `API request failed: ${response.status}`

    try {
      const errorBody = (await response.json()) as ApiErrorResponse
      if (errorBody.message?.trim()) {
        message = errorBody.message
      }
    } catch {
      // Ignore non-JSON error responses and keep the fallback message.
    }

    throw new Error(message)
  }

  return (await response.json()) as T
}

function normalizeUser(user: Member): Member {
  return {
    ...user,
    tags: [...(user.tags ?? [])],
    bookmarkedProjectIds: [...(user.bookmarkedProjectIds ?? [])],
    defaultProjectStatusFilters: normalizeDefaultProjectStatusFilters(user.defaultProjectStatusFilters),
  }
}

export async function loginUserRequest(memberKey: string, signal?: AbortSignal) {
  const response = await sendJson<UserResponse, { memberKey: string }>(
    '/api/members/login',
    'POST',
    { memberKey },
    signal,
  )

  return normalizeUser(response.user)
}

export async function loadUserRequest(userId: string, signal?: AbortSignal) {
  const response = await fetchJson<UserResponse>(`/api/members/${userId}`, signal)
  return normalizeUser(response.user)
}

export async function toggleBookmarkRequest(
  userId: string,
  projectId: string,
  signal?: AbortSignal,
) {
  const response = await sendJson<UserResponse, { projectId: string }>(
    `/api/members/${userId}/bookmarks`,
    'PATCH',
    { projectId },
    signal,
  )

  return normalizeUser(response.user)
}

export async function saveDefaultProjectStatusFiltersRequest(
  userId: string,
  defaultProjectStatusFilters: NonNullable<Member['defaultProjectStatusFilters']>,
  signal?: AbortSignal,
) {
  const response = await sendJson<
    UserResponse,
    { defaultProjectStatusFilters: NonNullable<Member['defaultProjectStatusFilters']> }
  >(
    `/api/members/${userId}/preferences/project-status-filters`,
    'PATCH',
    { defaultProjectStatusFilters },
    signal,
  )

  return normalizeUser(response.user)
}
