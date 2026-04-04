import { createContext } from 'react'
import type { UserProfile } from '../types/user'

export interface UserSessionContextValue {
  currentUser: UserProfile | null
  isLoading: boolean
  error: string | null
  login: (username: string) => Promise<void>
  logout: () => void
  toggleBookmark: (projectId: string) => Promise<void>
  isBookmarked: (projectId: string) => boolean
}

export const UserSessionContext = createContext<UserSessionContextValue | null>(null)
