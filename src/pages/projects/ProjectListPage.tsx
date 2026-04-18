import { useEffect, useMemo, useRef, useState } from "react";
import { FilterVisibilityToggleButton } from "../../components/FilterVisibilityToggleButton";
import { ListPageScaffold } from "../../components/ListPageScaffold";
import { PageStatePanel } from "../../components/PageStatePanel";
import { ProjectTable } from "../../components/ProjectTable";
import { Button } from "../../components/ui/Button";
import { useProjectData } from "../../store/useProjectData";
import { useUserSession } from "../../store/useUserSession";
import type { Project } from "../../types/project";
import { getProjectCurrentPhase, getProjectPm } from "../../utils/projectUtils";
import {
  allWorkStatuses,
  getMemberDefaultProjectStatusFilters,
} from "../../utils/userPreferences";
import styles from "./ProjectListPage.module.css";

type ViewMode = "all" | "bookmarks";

export function ProjectListPage() {
  const {
    projects,
    members,
    projectDepartments,
    systems,
    getProjectPhases,
    isLoading,
    error,
  } =
    useProjectData();
  const { currentUser, saveDefaultProjectStatusFilters, toggleBookmark } =
    useUserSession();
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [selectedDepartmentName, setSelectedDepartmentName] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<Project["status"][]>(
    () => getMemberDefaultProjectStatusFilters(currentUser),
  );
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const currentUserId = currentUser?.id ?? null;
  const currentUserRef = useRef(currentUser);
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
  const departmentNamesByProjectId = useMemo(() => {
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

  const bookmarkFilteredProjects = useMemo(() => {
    if (viewMode !== "bookmarks" || !currentUser) {
      return projects;
    }

    const bookmarkedSet = new Set(currentUser.bookmarkedProjectIds);
    return projects.filter((project) =>
      bookmarkedSet.has(project.projectNumber),
    );
  }, [currentUser, projects, viewMode]);

  const filteredProjects = useMemo(
    () =>
      bookmarkFilteredProjects.filter((project) => {
        if (!selectedStatuses.includes(project.status)) {
          return false;
        }

        if (!selectedDepartmentName) {
          return true;
        }

        const projectDepartmentNames =
          departmentNamesByProjectId.get(project.projectNumber) ?? [];

        return selectedDepartmentName === "__unassigned__"
          ? projectDepartmentNames.length === 0
          : projectDepartmentNames.includes(selectedDepartmentName);
      }),
    [bookmarkFilteredProjects, departmentNamesByProjectId, selectedDepartmentName, selectedStatuses],
  );

  const rows = useMemo(
    () =>
      filteredProjects.map((project) => {
        const projectPhases = getProjectPhases(project.projectNumber);
        const currentPhase = getProjectCurrentPhase(projectPhases);
        const pm = getProjectPm(project, members);

        return {
          project,
          currentPhaseName: currentPhase?.name ?? "未設定",
          pmName: pm?.name ?? "未設定",
          departmentNames:
            departmentNamesByProjectId.get(project.projectNumber) ?? [],
          primarySystemName: systemNameById.get(
            project.relatedSystemIds?.[0] ?? "",
          ),
        };
      }),
    [departmentNamesByProjectId, filteredProjects, getProjectPhases, members, systemNameById],
  );

  const summary = useMemo(
    () => ({
      total: filteredProjects.length,
      inProgress: filteredProjects.filter(
        (project) => project.status === "進行中",
      ).length,
      delayed: filteredProjects.filter((project) => project.status === "遅延")
        .length,
      completed: filteredProjects.filter((project) => project.status === "完了")
        .length,
    }),
    [filteredProjects],
  );

  const bookmarkedCount = currentUser?.bookmarkedProjectIds.length ?? 0;
  const hasStatusSelection = selectedStatuses.length > 0;

  const emptyState =
    viewMode === "bookmarks" &&
    currentUser &&
    rows.length === 0 &&
    hasStatusSelection
      ? {
          title: "条件に一致するブックマーク案件はありません",
          description:
            "ブックマーク済みの案件はありますが、現在の状態フィルターには一致していません。絞り込み条件を見直してください。",
        }
      : viewMode === "bookmarks" && currentUser && rows.length === 0
        ? {
            title: "ブックマーク案件はまだありません",
            description: "一覧の追加ボタンから案件をブックマークできます。",
          }
        : !hasStatusSelection
          ? {
              title: "状態フィルターが選択されていません",
              description:
                "表示したい状態にチェックを入れると、案件一覧が表示されます。",
            }
          : rows.length === 0
            ? {
                title: "条件に一致する案件はありません",
                description: "状態フィルター、部署条件、表示モードを調整してください。",
              }
            : null;

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
        description="バックエンドから案件データを取得しています。"
        title="案件一覧を読み込み中です"
      />
    );
  }

  if (error) {
    return (
      <PageStatePanel
        className={styles.section}
        description={error}
        title="案件一覧を表示できませんでした"
      />
    );
  }

  return (
    <ListPageScaffold
      className={styles.page}
      contentProps={{
        actions: (
          <FilterVisibilityToggleButton
            isVisible={isFilterVisible}
            onToggle={() => setIsFilterVisible((current) => !current)}
          />
        ),
        className: styles.section,
        description: "案件番号、現在フェーズ、PM、主システムをまとめて確認できます。",
        emptyState,
        title:
          viewMode === "bookmarks" && currentUser
            ? "ブックマーク案件一覧"
            : "案件ステータス一覧",
      }}
      filterProps={{
        body: (
          <div className={styles.statusFilters}>
            <label className={styles.filterField}>
              <span className={styles.filterFieldLabel}>関与部署</span>
              <select
                className={styles.filterSelect}
                onChange={(event) => setSelectedDepartmentName(event.target.value)}
                value={selectedDepartmentName}
              >
                <option value="">すべての部署</option>
                <option value="__unassigned__">部署未設定</option>
                {departmentOptions.map((departmentName) => (
                  <option key={departmentName} value={departmentName}>
                    {departmentName}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.statusCheckboxGroup}>
              {allWorkStatuses.map((status) => (
                <label className={styles.statusCheckbox} key={status}>
                  <input
                    checked={selectedStatuses.includes(status)}
                    onChange={() => handleStatusToggle(status)}
                    type="checkbox"
                  />
                  <span>{status}</span>
                </label>
              ))}
            </div>
          </div>
        ),
        className: styles.controls,
        summary: (
          <div className={styles.filterSummaryRow}>
            <div className={styles.filterSummaryHeading}>
              <p className={styles.statusFilterTitle}>状態フィルター</p>
              <p className={styles.statusFilterHint}>
                複数選択できます。部署で絞ると、関連案件だけを一覧化できます。
              </p>
            </div>
            <div className={styles.statusFilterActions}>
              <Button
                disabled={!currentUser || isSavingDefaults}
                onClick={() => void handleSaveDefaults()}
                size="small"
                variant="secondary"
              >
                {isSavingDefaults ? "保存中..." : "この状態を既定値に保存"}
              </Button>
              <p className={styles.statusFilterMeta}>
                {saveFeedback ?? "利用メンバーを選ぶと既定値を保存できます。"}
              </p>
            </div>
          </div>
        ),
        topRow: (
          <div className={styles.filterTopRow}>
            <div className={styles.toggleGroup}>
              <button
                className={
                  viewMode === "all"
                    ? `${styles.toggle} ${styles.toggleActive}`
                    : styles.toggle
                }
                onClick={() => setViewMode("all")}
                type="button"
              >
                全案件
              </button>
              <button
                className={
                  viewMode === "bookmarks"
                    ? `${styles.toggle} ${styles.toggleActive}`
                    : styles.toggle
                }
                disabled={!currentUser}
                onClick={() => setViewMode("bookmarks")}
                type="button"
              >
                ブックマーク
              </button>
            </div>
            <p className={styles.filterHint}>
              {currentUser
                ? `${currentUser.name} さんのブックマーク ${bookmarkedCount} 件`
                : "利用メンバーを選ぶと、ブックマーク案件だけに絞り込めます。"}
            </p>
          </div>
        ),
        visible: isFilterVisible,
      }}
      hero={{
        action: <Button to="/projects/new">案件を追加</Button>,
        className: styles.hero,
        collapsible: true,
        description:
          "進捗、体制、主システムを一覧で確認できます。利用中メンバーのブックマーク案件だけに絞り込むこともできます。",
        eyebrow: "Project Portfolio",
        iconKind: "project",
        storageKey: "project-master:hero-collapsed:projects",
        stats: [
          { label: "総案件数", value: summary.total },
          { label: "進行中", value: summary.inProgress },
          { label: "遅延", value: summary.delayed },
          { label: "完了", value: summary.completed },
        ],
        title: "案件一覧",
      }}
    >
      <ProjectTable
        bookmarkedProjectIds={currentUser?.bookmarkedProjectIds ?? []}
        onToggleBookmark={
          currentUser
            ? (projectId) => {
                void toggleBookmark(projectId).catch(() => undefined);
              }
            : undefined
        }
        rows={rows}
      />
    </ListPageScaffold>
  );
}
