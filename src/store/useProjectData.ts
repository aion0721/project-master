import { useContext } from 'react'
import { ProjectDataContext } from './projectDataContext'

export function useProjectData() {
  const context = useContext(ProjectDataContext)

  if (!context) {
    throw new Error('useProjectData must be used within ProjectDataProvider')
  }

  return context
}
