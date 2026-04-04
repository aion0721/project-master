import { useEffect, useState, type ReactNode } from 'react'
import { loadUserRequest, loginUserRequest, toggleBookmarkRequest } from '../api/userApi'
import type { UserProfile } from '../types/user'
import { UserSessionContext, type UserSessionContextValue } from './userSessionContext'

const storageKey = 'project-master:user-id'

export function UserSessionProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const persistedUserId = window.localStorage.getItem(storageKey)

    if (!persistedUserId) {
      setIsLoading(false)
      return
    }

    const userId = persistedUserId

    const controller = new AbortController()

    async function loadUser() {
      setIsLoading(true)
      setError(null)

      try {
        const user = await loadUserRequest(userId, controller.signal)
        setCurrentUser(user)
      } catch (caughtError) {
        window.localStorage.removeItem(storageKey)
        setCurrentUser(null)
        setError(caughtError instanceof Error ? caughtError.message : 'ユーザー情報の取得に失敗しました。')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadUser()

    return () => {
      controller.abort()
    }
  }, [])

  const value: UserSessionContextValue = {
    currentUser,
    isLoading,
    error,
    login: async (username: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const user = await loginUserRequest(username.trim())
        window.localStorage.setItem(storageKey, user.id)
        setCurrentUser(user)
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'ログインに失敗しました。')
        throw caughtError
      } finally {
        setIsLoading(false)
      }
    },
    logout: () => {
      window.localStorage.removeItem(storageKey)
      setCurrentUser(null)
      setError(null)
    },
    toggleBookmark: async (projectId: string) => {
      if (!currentUser) {
        throw new Error('ログインしてからブックマークしてください。')
      }

      setError(null)

      try {
        const nextUser = await toggleBookmarkRequest(currentUser.id, projectId)
        setCurrentUser(nextUser)
      } catch (caughtError) {
        setError(
          caughtError instanceof Error ? caughtError.message : 'ブックマーク更新に失敗しました。',
        )
        throw caughtError
      }
    },
    isBookmarked: (projectId: string) => currentUser?.bookmarkedProjectIds.includes(projectId) ?? false,
  }

  return <UserSessionContext.Provider value={value}>{children}</UserSessionContext.Provider>
}
