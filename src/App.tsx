import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CrossProjectViewPage } from './pages/cross-project/CrossProjectViewPage'
import { MemberCreatePage } from './pages/members/MemberCreatePage'
import { MemberHierarchyPage } from './pages/members/MemberHierarchyPage'
import { MemberManagementPage } from './pages/members/MemberManagementPage'
import { ProjectCreatePage } from './pages/projects/ProjectCreatePage'
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage'
import { ProjectListPage } from './pages/projects/ProjectListPage'
import { SystemCreatePage } from './pages/systems/SystemCreatePage'
import { SystemDetailPage } from './pages/systems/SystemDetailPage'
import { SystemLandscapePage } from './pages/systems/SystemLandscapePage'
import { SystemManagementPage } from './pages/systems/SystemManagementPage'
import { ProjectDataProvider } from './store/projectData'
import { UserSessionProvider } from './store/userSession'

function App() {
  const routerBasename =
    import.meta.env.BASE_URL === '/'
      ? '/'
      : import.meta.env.BASE_URL.replace(/\/$/, '')

  return (
    <ProjectDataProvider>
      <UserSessionProvider>
        <BrowserRouter basename={routerBasename}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/projects" replace />} />
              <Route path="/projects" element={<ProjectListPage />} />
              <Route path="/projects/new" element={<ProjectCreatePage />} />
              <Route path="/projects/:projectNumber" element={<ProjectDetailPage />} />
              <Route path="/members" element={<MemberManagementPage />} />
              <Route path="/members/new" element={<MemberCreatePage />} />
              <Route path="/members/hierarchy" element={<MemberHierarchyPage />} />
              <Route path="/systems" element={<SystemManagementPage />} />
              <Route path="/systems/new" element={<SystemCreatePage />} />
              <Route path="/systems/:systemId" element={<SystemDetailPage />} />
              <Route path="/systems/diagram" element={<SystemLandscapePage />} />
              <Route path="/cross-project" element={<CrossProjectViewPage />} />
              <Route path="*" element={<Navigate to="/projects" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </UserSessionProvider>
    </ProjectDataProvider>
  )
}

export default App
