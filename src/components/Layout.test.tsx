import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
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
              <Route path="/members/hierarchy" element={<div>hierarchy</div>} />
              <Route path="/cross-project" element={<div>cross project</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </UserSessionProvider>
    </ProjectDataProvider>,
  )
}

describe('Layout', () => {
  it('案件管理とメンバー管理のセクションを表示する', () => {
    renderLayout(['/projects'])

    expect(screen.getByText('案件管理')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '横断ビュー' })).toHaveAttribute('href', '/cross-project')
    expect(screen.getByRole('link', { name: '一覧' })).toHaveAttribute('href', '/projects')
    expect(screen.getByRole('link', { name: '追加' })).toHaveAttribute('href', '/projects/new')

    expect(screen.getByText('メンバー管理')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'メンバー一覧' })).toHaveAttribute('href', '/members')
    expect(screen.getByRole('link', { name: '体制図' })).toHaveAttribute('href', '/members/hierarchy')
  })

  it('案件詳細では案件管理の一覧をアクティブ表示する', () => {
    renderLayout(['/projects/PRJ-001'])

    const projectListLink = screen.getByRole('link', { name: '一覧' })
    expect(projectListLink.className).toContain('active')
    expect(screen.getByRole('link', { name: '追加' }).className).not.toContain('active')
    expect(screen.getByRole('link', { name: '横断ビュー' }).className).not.toContain('active')
  })
})
