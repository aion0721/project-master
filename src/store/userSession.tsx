import { useEffect, useState, type ReactNode } from 'react'
import {
  loadUserRequest,
  loginUserRequest,
  saveDefaultProjectStatusFiltersRequest,
  toggleBookmarkRequest,
} from '../api/userApi'
import type { Member } from '../types/project'
import { UserSessionContext, type UserSessionContextValue } from './userSessionContext'

const storageKey = 'project-master:user-id'

export function UserSessionProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Member | null>(null)
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
        setError(
          caughtError instanceof Error ? caughtError.message : '利用メンバー情報の復元に失敗しました。',
        )
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
    login: async (memberKey: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const user = await loginUserRequest(memberKey.trim())
        window.localStorage.setItem(storageKey, user.id)
        setCurrentUser(user)
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : '利用メンバーの選択に失敗しました。')
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
        throw new Error('利用メンバーを選択してからブックマークしてください。')
      }

      setError(null)

      try {
        const nextUser = await toggleBookmarkRequest(currentUser.id, projectId)
        setCurrentUser(nextUser)
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'ブックマーク更新に失敗しました。')
        throw caughtError
      }
    },
    saveDefaultProjectStatusFilters: async (statuses) => {
      if (!currentUser) {
        throw new Error('利用メンバーを選択してから既定フィルターを保存してください。')
      }

      setError(null)

      try {
        const nextUser = await saveDefaultProjectStatusFiltersRequest(currentUser.id, statuses)
        setCurrentUser(nextUser)
      } catch (caughtError) {
        setError(
          caughtError instanceof Error ? caughtError.message : '既定フィルターの保存に失敗しました。',
        )
        throw caughtError
      }
    },
    isBookmarked: (projectId: string) => currentUser?.bookmarkedProjectIds.includes(projectId) ?? false,
  }

  return <UserSessionContext.Provider value={value}>{children}</UserSessionContext.Provider>
}
