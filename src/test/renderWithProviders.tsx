import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProjectDataProvider } from '../store/projectData'
import { UserSessionProvider } from '../store/userSession'

interface RenderWithProvidersOptions {
  initialEntries?: string[]
  routePath?: string
}

export function renderWithProviders(
  ui: ReactElement,
  options?: RenderWithProvidersOptions,
) {
  const initialEntries = options?.initialEntries ?? ['/']
  const routePath = options?.routePath

  return render(
    <ProjectDataProvider>
      <UserSessionProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {routePath ? (
            <Routes>
              <Route path={routePath} element={ui} />
            </Routes>
          ) : (
            ui
          )}
        </MemoryRouter>
      </UserSessionProvider>
    </ProjectDataProvider>,
  )
}
