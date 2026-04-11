import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProjectDataProvider } from "./store/projectData";
import { UserSessionProvider } from "./store/userSession";
import { ProjectListPage } from "./pages/projects/ProjectListPage";

const CrossProjectViewPage = lazy(() =>
  import("./pages/cross-project/CrossProjectViewPage").then((module) => ({
    default: module.CrossProjectViewPage,
  })),
);

const MemberCreatePage = lazy(() =>
  import("./pages/members/MemberCreatePage").then((module) => ({
    default: module.MemberCreatePage,
  })),
);

const MemberDetailPage = lazy(() =>
  import("./pages/members/MemberDetailPage").then((module) => ({
    default: module.MemberDetailPage,
  })),
);

const MemberHierarchyPage = lazy(() =>
  import("./pages/members/MemberHierarchyPage").then((module) => ({
    default: module.MemberHierarchyPage,
  })),
);

const MemberManagementPage = lazy(() =>
  import("./pages/members/MemberManagementPage").then((module) => ({
    default: module.MemberManagementPage,
  })),
);

const ProjectCreatePage = lazy(() =>
  import("./pages/projects/ProjectCreatePage").then((module) => ({
    default: module.ProjectCreatePage,
  })),
);

const ProjectDetailPage = lazy(() =>
  import("./pages/projects/ProjectDetailPage").then((module) => ({
    default: module.ProjectDetailPage,
  })),
);

const SystemCreatePage = lazy(() =>
  import("./pages/systems/SystemCreatePage").then((module) => ({
    default: module.SystemCreatePage,
  })),
);

const SystemDetailPage = lazy(() =>
  import("./pages/systems/SystemDetailPage").then((module) => ({
    default: module.SystemDetailPage,
  })),
);

const SystemLandscapePage = lazy(() =>
  import("./pages/systems/SystemLandscapePage").then((module) => ({
    default: module.SystemLandscapePage,
  })),
);

const SystemManagementPage = lazy(() =>
  import("./pages/systems/SystemManagementPage").then((module) => ({
    default: module.SystemManagementPage,
  })),
);

function App() {
  const routerBasename =
    import.meta.env.BASE_URL === "/"
      ? "/"
      : import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <ProjectDataProvider>
      <UserSessionProvider>
        <BrowserRouter basename={routerBasename}>
          <Suspense fallback={<div>読み込み中...</div>}>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Navigate to="/projects" replace />} />
                <Route path="/projects" element={<ProjectListPage />} />
                <Route path="/projects/new" element={<ProjectCreatePage />} />
                <Route
                  path="/projects/:projectNumber"
                  element={<ProjectDetailPage />}
                />
                <Route path="/members" element={<MemberManagementPage />} />
                <Route path="/members/new" element={<MemberCreatePage />} />
                <Route
                  path="/members/:memberId"
                  element={<MemberDetailPage />}
                />
                <Route
                  path="/members/hierarchy"
                  element={<MemberHierarchyPage />}
                />
                <Route path="/systems" element={<SystemManagementPage />} />
                <Route path="/systems/new" element={<SystemCreatePage />} />
                <Route
                  path="/systems/:systemId"
                  element={<SystemDetailPage />}
                />
                <Route
                  path="/systems/diagram"
                  element={<SystemLandscapePage />}
                />
                <Route
                  path="/cross-project"
                  element={<CrossProjectViewPage />}
                />
                <Route path="*" element={<Navigate to="/projects" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </UserSessionProvider>
    </ProjectDataProvider>
  );
}

export default App;
