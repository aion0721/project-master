import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ListPageScaffold } from "../../components/ListPageScaffold";
import { PageStatePanel } from "../../components/PageStatePanel";
import { useProjectData } from "../../store/useProjectData";
import { useUserSession } from "../../store/useUserSession";
import type { Project } from "../../types/project";
import { getMemberDefaultProjectStatusFilters } from "../../utils/userPreferences";
import { CrossProjectFilterSection } from "./CrossProjectFilterSection";
import { CrossProjectTimelineSection } from "./CrossProjectTimelineSection";
import {
  getEmptyState,
  getSelectedSystemLabel,
} from "./crossProjectViewHelpers";
import { useCrossProjectRows } from "./useCrossProjectRows";
import { useCrossProjectView } from "./useCrossProjectView";
import styles from "./CrossProjectViewPage.module.css";

export function CrossProjectViewPage() {
  const [searchParams] = useSearchParams();
  const {
    projects,
    members,
    projectDepartments,
    getProjectPhases,
    getProjectEvents,
    getProjectAssignments,
    getMemberById,
    systems,
    isLoading,
    error,
  } = useProjectData();
  const { currentUser, saveDefaultProjectStatusFilters } = useUserSession();
  const selectedSystemId = searchParams.get("systemId")?.trim() || "";
  const currentUserId = currentUser?.id ?? null;
  const currentUserRef = useRef(currentUser);
  const tableWrapRef = useRef<HTMLDivElement | null>(null);

  const [selectedStatuses, setSelectedStatuses] = useState<Project["status"][]>(
    () => getMemberDefaultProjectStatusFilters(currentUser),
  );
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [isStructureVisible, setIsStructureVisible] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(true);
  const [isGroupedByPrimarySystem, setIsGroupedByPrimarySystem] =
    useState(false);
  const [selectedDepartmentName, setSelectedDepartmentName] = useState("");

  currentUserRef.current = currentUser;

  useEffect(() => {
    setSelectedStatuses(
      getMemberDefaultProjectStatusFilters(currentUserRef.current),
    );
    setSaveFeedback(null);
  }, [currentUserId]);

  const systemNameById = useMemo(
    () => new Map(systems.map((system) => [system.id, system.name])),
    [systems],
  );
  const projectDepartmentNamesByProjectId = useMemo(() => {
    const map = new Map<string, string[]>();

    projectDepartments.forEach((projectDepartment) => {
      const current = map.get(projectDepartment.projectId) ?? [];

      if (!current.includes(projectDepartment.departmentName)) {
        map.set(projectDepartment.projectId, [...current, projectDepartment.departmentName]);
      }
    });

    return map;
  }, [projectDepartments]);
  const departmentOptions = useMemo(
    () =>
      [...new Set(projectDepartments.map((projectDepartment) => projectDepartment.departmentName))]
        .sort((left, right) => left.localeCompare(right, "ja")),
    [projectDepartments],
  );
  const view = useCrossProjectView({
    currentUser,
    getProjectEvents,
    getProjectPhases,
    projectDepartmentNamesByProjectId,
    projects,
    selectedDepartmentName,
    selectedStatuses,
  });
  const selectedSystemLabel = getSelectedSystemLabel(
    selectedSystemId,
    systemNameById,
  );
  const { rows, scopedProjects } = useCrossProjectRows({
    projects: view.filteredProjects,
    selectedSystemId,
    systemNameById,
    isGroupedByPrimarySystem,
  });
  const emptyState = getEmptyState({
    hasNoProjectsInMode: view.hasNoProjectsInMode,
    hasNoDepartmentMatches: view.hasNoDepartmentMatches,
    hasNoSearchResults: view.hasNoSearchResults,
    hasNoStatusMatches: view.hasNoStatusMatches,
    hasNoStatusesSelected: view.hasNoStatusesSelected,
    isBookmarkMode: view.isBookmarkMode,
    scopedProjectCount: scopedProjects.length,
    selectedSystemId,
    selectedSystemLabel,
  });

  useEffect(() => {
    const tableWrap = tableWrapRef.current;

    if (!tableWrap || view.timelineSlots.length === 0) {
      return;
    }

    const currentHeader = tableWrap.querySelector<HTMLTableCellElement>(
      `[data-testid^='cross-project-current-${view.timeScale}-']`,
    );

    if (!currentHeader) {
      return;
    }

    const stickyColumn = tableWrap.querySelector<HTMLElement>(
      `.${styles.stickyColumn}`,
    );
    const stickyWidth = stickyColumn?.offsetWidth ?? 0;
    const targetLeft = Math.max(0, currentHeader.offsetLeft - stickyWidth - 24);

    if (typeof tableWrap.scrollTo !== "function") {
      tableWrap.scrollLeft = targetLeft;
      return;
    }

    tableWrap.scrollTo({ left: targetLeft, behavior: "smooth" });
  }, [view.timeScale, view.timelineSlots]);

  const handleStatusToggle = (status: Project["status"]) => {
    setSaveFeedback(null);
    setSelectedStatuses((current) =>
      current.includes(status)
        ? current.filter((value) => value !== status)
        : [...current, status],
    );
  };

  const handleSaveDefaults = async () => {
    if (!currentUser) {
      return;
    }

    setIsSavingDefaults(true);
    setSaveFeedback(null);

    try {
      await saveDefaultProjectStatusFilters(selectedStatuses);
      setSaveFeedback("現在の状態フィルターを既定値として保存しました。");
    } catch {
      setSaveFeedback("既定値フィルターの保存に失敗しました。");
    } finally {
      setIsSavingDefaults(false);
    }
  };

  if (isLoading) {
    return (
      <PageStatePanel
        className={styles.section}
        description="案件表示に必要な情報を取得しています。"
        title="案件ビューを読み込み中です"
      />
    );
  }

  if (error) {
    return (
      <PageStatePanel
        className={styles.section}
        description={error}
        title="案件ビューを表示できませんでした"
      />
    );
  }

  return (
    <ListPageScaffold
      className={styles.page}
      contentSection={
        <CrossProjectTimelineSection
          emptyState={emptyState}
          getMemberById={getMemberById}
          getProjectAssignments={getProjectAssignments}
          getProjectEvents={getProjectEvents}
          getProjectPhases={getProjectPhases}
          isCompactMode={isCompactMode}
          isFilterVisible={isFilterVisible}
          isGroupedByPrimarySystem={isGroupedByPrimarySystem}
          isStructureVisible={isStructureVisible}
          members={members}
          rows={rows}
          setIsCompactMode={setIsCompactMode}
          setIsFilterVisible={setIsFilterVisible}
          setIsGroupedByPrimarySystem={setIsGroupedByPrimarySystem}
          setIsStructureVisible={setIsStructureVisible}
          setTimeScale={view.setTimeScale}
          tableWrapRef={tableWrapRef}
          timeScale={view.timeScale}
          timelineSlots={view.timelineSlots}
        />
      }
      filterSection={
        <CrossProjectFilterSection
          currentUser={currentUser}
          departmentOptions={departmentOptions}
          handleSaveDefaults={handleSaveDefaults}
          handleStatusToggle={handleStatusToggle}
          isFilterVisible={isFilterVisible}
          isSavingDefaults={isSavingDefaults}
          keyword={view.keyword}
          saveFeedback={saveFeedback}
          selectedDepartmentName={selectedDepartmentName}
          selectedStatuses={selectedStatuses}
          selectedSystemLabel={selectedSystemLabel}
          setSelectedDepartmentName={setSelectedDepartmentName}
          setKeyword={view.setKeyword}
          setViewMode={view.setViewMode}
          viewMode={view.viewMode}
        />
      }
      hero={{
        className: styles.hero,
        collapsible: true,
        description:
          "複数案件の進行や偏りを、週または月単位で比較できます。表示モードや絞り込みを切り替えながら、どこが詰まっているかを横断で確認します。",
        eyebrow: "Cross Project Timeline",
        iconKind: "project",
        storageKey: "project-master:hero-collapsed:cross-project",
        stats: [
          { label: "表示案件数", value: scopedProjects.length },
          {
            label: "最大同時稼働",
            value: `${view.peakBusy} Phase / ${view.timeScale === "month" ? "Month" : "Week"}`,
          },
        ],
        title: "横断案件ビュー",
      }}
    />
  );
}
