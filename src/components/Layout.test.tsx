import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { ProjectDataProvider } from '../store/projectData'
import { UserSessionProvider } from '../store/userSession'
import { Layout } from './Layout'

function renderLayout(initialEntries: string[]) {
  return render(
    <ProjectDataProvider>
      <UserSessionProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/projects" element={<div>projects</div>} />
              <Route path="/projects/new" element={<div>new project</div>} />
              <Route path="/projects/:projectNumber" element={<div>project detail</div>} />
              <Route path="/members" element={<div>members</div>} />
              <Route path="/members/new" element={<div>new member</div>} />
              <Route path="/members/hierarchy" element={<div>hierarchy</div>} />
              <Route path="/systems" element={<div>systems</div>} />
              <Route path="/systems/new" element={<div>new system</div>} />
              <Route path="/systems/relations" element={<div>system relations</div>} />
              <Route path="/systems/diagram" element={<div>system diagram</div>} />
              <Route path="/cross-project" element={<div>cross project</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </UserSessionProvider>
    </ProjectDataProvider>,
  )
}

describe('Layout', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders grouped navigation links', () => {
    renderLayout(['/projects'])

    expect(screen.getByText('案件管理')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '一覧' })).toHaveAttribute('href', '/projects')
    expect(screen.getByRole('link', { name: '横断ビュー' })).toHaveAttribute('href', '/cross-project')

    expect(screen.getByText('メンバー管理')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'メンバー一覧' })).toHaveAttribute('href', '/members')
    expect(screen.getByRole('link', { name: '体制図' })).toHaveAttribute('href', '/members/hierarchy')

    expect(screen.getByText('システム管理')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'システム一覧' })).toHaveAttribute('href', '/systems')
    expect(screen.getByRole('link', { name: '関係一覧' })).toHaveAttribute(
      'href',
      '/systems/relations',
    )
    expect(screen.getByRole('link', { name: '関連図' })).toHaveAttribute('href', '/systems/diagram')
  })

  it('keeps project list active on project detail routes', () => {
    renderLayout(['/projects/PRJ-001'])

    const projectListLink = screen.getByRole('link', { name: '一覧' })
    expect(projectListLink.className).toContain('active')
    expect(screen.getByRole('link', { name: '横断ビュー' }).className).not.toContain('active')
  })

  it('expands the rail while hovering', () => {
    renderLayout(['/projects'])

    const sidebar = screen.getByRole('complementary')
    expect(sidebar).toHaveAttribute('data-state', 'rail')

    fireEvent.mouseEnter(sidebar)
    expect(sidebar).toHaveAttribute('data-state', 'expanded')

    fireEvent.mouseLeave(sidebar)
    expect(sidebar).toHaveAttribute('data-state', 'rail')
  })

  it('pins the sidebar open and persists the preference', () => {
    renderLayout(['/projects'])

    const sidebar = screen.getByRole('complementary')
    const pinButton = screen.getByTestId('layout-sidebar-pin')

    expect(window.localStorage.getItem('project-master:sidebar-pinned')).toBe('false')

    fireEvent.click(pinButton)

    expect(sidebar).toHaveAttribute('data-state', 'expanded')
    expect(window.localStorage.getItem('project-master:sidebar-pinned')).toBe('true')
  })
})
