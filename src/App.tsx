import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CrossProjectViewPage } from './pages/CrossProjectViewPage'
import { ProjectCreatePage } from './pages/ProjectCreatePage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { ProjectListPage } from './pages/ProjectListPage'
import { ProjectDataProvider } from './store/projectData'

function App() {
  return (
    <ProjectDataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/projects" replace />} />
            <Route path="/projects" element={<ProjectListPage />} />
            <Route path="/projects/new" element={<ProjectCreatePage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="/cross-project" element={<CrossProjectViewPage />} />
            <Route path="*" element={<Navigate to="/projects" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProjectDataProvider>
  )
}

export default App
