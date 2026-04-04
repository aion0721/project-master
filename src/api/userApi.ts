import type { UserProfile } from '../types/user'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787'

interface UserResponse {
  user: UserProfile
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
    throw new Error(`API request failed: ${response.status}`)
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
    throw new Error(`API request failed: ${response.status}`)
  }

  return (await response.json()) as T
}

function normalizeUser(user: UserProfile): UserProfile {
  return {
    id: user.id,
    username: user.username,
    bookmarkedProjectIds: [...user.bookmarkedProjectIds],
  }
}

export async function loginUserRequest(username: string, signal?: AbortSignal) {
  const response = await sendJson<UserResponse, { username: string }>(
    '/api/users/login',
    'POST',
    { username },
    signal,
  )

  return normalizeUser(response.user)
}

export async function loadUserRequest(userId: string, signal?: AbortSignal) {
  const response = await fetchJson<UserResponse>(`/api/users/${userId}`, signal)
  return normalizeUser(response.user)
}

export async function toggleBookmarkRequest(
  userId: string,
  projectId: string,
  signal?: AbortSignal,
) {
  const response = await sendJson<UserResponse, { projectId: string }>(
    `/api/users/${userId}/bookmarks`,
    'PATCH',
    { projectId },
    signal,
  )

  return normalizeUser(response.user)
}
