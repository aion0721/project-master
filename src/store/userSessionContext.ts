import { createContext } from 'react'
import type { Member } from '../types/project'

export interface UserSessionContextValue {
  currentUser: Member | null
  isLoading: boolean
  error: string | null
  login: (memberKey: string) => Promise<void>
  logout: () => void
  toggleBookmark: (projectId: string) => Promise<void>
  saveDefaultProjectStatusFilters: (statuses: NonNullable<Member['defaultProjectStatusFilters']>) => Promise<void>
  isBookmarked: (projectId: string) => boolean
}

export const UserSessionContext = createContext<UserSessionContextValue | null>(null)
