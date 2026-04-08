import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
              <Route element={<div>projects</div>} path="/projects" />
              <Route element={<div>new project</div>} path="/projects/new" />
              <Route element={<div>project detail</div>} path="/projects/:projectNumber" />
              <Route element={<div>members</div>} path="/members" />
              <Route element={<div>new member</div>} path="/members/new" />
              <Route element={<div>hierarchy</div>} path="/members/hierarchy" />
              <Route element={<div>systems</div>} path="/systems" />
              <Route element={<div>new system</div>} path="/systems/new" />
              <Route element={<div>system detail</div>} path="/systems/:systemId" />
              <Route element={<div>system relations</div>} path="/systems/relations" />
              <Route element={<div>system diagram</div>} path="/systems/diagram" />
              <Route element={<div>cross project</div>} path="/cross-project" />
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

  afterEach(() => {
    vi.unstubAllEnvs()
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

  it('keeps system list active on system detail routes', () => {
    renderLayout(['/systems/sys-accounting'])

    const systemListLink = screen.getByRole('link', { name: 'システム一覧' })
    expect(systemListLink.className).toContain('active')
    expect(screen.getByRole('link', { name: '関係一覧' }).className).not.toContain('active')
    expect(screen.getByRole('link', { name: '関連図' }).className).not.toContain('active')
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

  it('uses env placeholder for member login input', () => {
    vi.stubEnv('VITE_MEMBER_ID_EXAMPLE', 'EMP0001')

    renderLayout(['/projects'])

    expect(screen.getByPlaceholderText('例: EMP0001')).toBeInTheDocument()
  })
})
