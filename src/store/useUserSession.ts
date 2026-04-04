import { useContext } from 'react'
import { UserSessionContext } from './userSessionContext'

export function useUserSession() {
  const context = useContext(UserSessionContext)

  if (!context) {
    throw new Error('useUserSession must be used within UserSessionProvider')
  }

  return context
}
