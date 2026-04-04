import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProjectDataProvider } from '../store/projectData'

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
      <MemoryRouter initialEntries={initialEntries}>
        {routePath ? (
          <Routes>
            <Route path={routePath} element={ui} />
          </Routes>
        ) : (
          ui
        )}
      </MemoryRouter>
    </ProjectDataProvider>,
  )
}
