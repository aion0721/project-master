import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ListPageContentSection } from "../../components/ListPageContentSection";
import { ListPageFilterSection } from "../../components/ListPageFilterSection";
import { ListPageHero } from "../../components/ListPageHero";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { useProjectData } from "../../store/useProjectData";
import { useUserSession } from "../../store/useUserSession";
import type { Member, Project, ProjectAssignment } from "../../types/project";
import {
  getActivePhasesForWeek,
  getProjectPm,
  isDateInWeekSlot,
} from "../../utils/projectUtils";
import {
  allWorkStatuses,
  getMemberDefaultProjectStatusFilters,
} from "../../utils/userPreferences";
import { formatMemberShortLabel } from "../members/memberFormUtils";
import { getPhaseToneKey, useCrossProjectView } from "./useCrossProjectView";
import styles from "./CrossProjectViewPage.module.css";

export function CrossProjectViewPage() {
  const [searchParams] = useSearchParams();
  const {
    projects,
    members,
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
  currentUserRef.current = currentUser;
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

  useEffect(() => {
    setSelectedStatuses(
      getMemberDefaultProjectStatusFilters(currentUserRef.current),
    );
    setSaveFeedback(null);
  }, [currentUserId]);

  const {
    filteredProjects,
    globalWeekSlots,
    hasNoProjectsInMode,
    hasNoSearchResults,
    hasNoStatusMatches,
    hasNoStatusesSelected,
    isBookmarkMode,
    keyword,
    peakBusy,
    setKeyword,
    setViewMode,
    viewMode,
  } = useCrossProjectView({
    currentUser,
    getProjectEvents,
    getProjectPhases,
    projects,
    selectedStatuses,
  });

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

  const systemNameById = useMemo(
    () => new Map(systems.map((system) => [system.id, system.name])),
    [systems],
  );

  const selectedSystemLabel = selectedSystemId
    ? `${selectedSystemId} / ${systemNameById.get(selectedSystemId) ?? selectedSystemId}`
    : null;

  const scopedProjects = useMemo(() => {
    if (!selectedSystemId) {
      return filteredProjects;
    }

    return filteredProjects.filter(
      (project) => project.relatedSystemIds?.[0] === selectedSystemId,
    );
  }, [filteredProjects, selectedSystemId]);

  const groupedProjects = useMemo(() => {
    const groups = new Map<string, Project[]>();

    scopedProjects.forEach((project) => {
      const primarySystemId = project.relatedSystemIds?.[0];
      const groupLabel = primarySystemId
        ? `${primarySystemId} / ${systemNameById.get(primarySystemId) ?? primarySystemId}`
        : "未設定";
      const current = groups.get(groupLabel) ?? [];
      current.push(project);
      groups.set(groupLabel, current);
    });

    return [...groups.entries()]
      .sort((left, right) => left[0].localeCompare(right[0], "ja"))
      .map(([label, projectsInGroup]) => ({
        label,
        projects: projectsInGroup.sort((left, right) =>
          left.name.localeCompare(right.name, "ja"),
        ),
      }));
  }, [scopedProjects, systemNameById]);

  if (isLoading) {
    return (
      <Panel className={styles.section}>
        <h1 className={styles.title}>横断ビューを読み込み中です</h1>
        <p className={styles.description}>
          横断表示に必要な案件データを準備しています。
        </p>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel className={styles.section}>
        <h1 className={styles.title}>横断ビューを表示できませんでした</h1>
        <p className={styles.description}>{error}</p>
      </Panel>
    );
  }

  const emptyState =
    isBookmarkMode && hasNoProjectsInMode
      ? {
          title: "ブックマーク案件はまだありません",
          description:
            "案件一覧または案件詳細から案件をブックマークすると、ここで横断表示できます。",
        }
      : hasNoStatusesSelected
        ? {
            title: "状態フィルターが空になっています",
            description:
              "表示したい状態にチェックを入れると、対象の案件が表示されます。",
          }
        : hasNoStatusMatches
          ? {
              title: "条件に一致する案件はありません",
              description: "状態フィルターや表示モードを調整してみてください。",
            }
          : hasNoSearchResults
            ? {
                title: "検索条件に一致する案件はありません",
                description:
                  "プロジェクト番号または案件名で検索条件を見直してください。",
              }
            : null;

  const scopedEmptyState =
    !emptyState && selectedSystemId && scopedProjects.length === 0
      ? {
          title: "対象システムに一致する案件はありません",
          description: `${selectedSystemLabel ?? selectedSystemId} を主システムに持つ案件は、現在の表示条件では見つかりません。`,
        }
      : emptyState;

  return (
    <div className={styles.page}>
      <ListPageHero
        className={styles.hero}
        collapsible
        description="複数案件がどの週にどのフェーズへ入っているかを横断で確認できます。表示モードを切り替えると、利用中メンバーのブックマーク案件だけも見られます。"
        eyebrow="Cross Project Timeline"
        iconKind="project"
        storageKey="project-master:hero-collapsed:cross-project"
        stats={[
          { label: "表示案件数", value: scopedProjects.length },
          { label: "最大混雑度", value: `${peakBusy} Phase / Week` },
        ]}
        title="横断案件ビュー"
      />

      {isFilterVisible ? (
        <ListPageFilterSection
          className={styles.controls}
          topRow={
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
                  ? `${currentUser.name} さんのブックマーク ${currentUser.bookmarkedProjectIds.length} 件`
                  : "利用メンバーを選ぶと、ブックマーク案件だけに絞り込めます。"}
              </p>

              <label className={styles.searchField}>
                <span className={styles.searchLabel}>案件フィルター</span>
                <input
                  aria-label="プロジェクト番号または案件名でフィルター"
                  className={styles.searchInput}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="例: PRJ-001 / 基幹会計刷新"
                  type="search"
                  value={keyword}
                />
              </label>
            </div>
          }
          summary={
            <div className={styles.filterSummaryRow}>
              <div className={styles.filterSummaryHeading}>
                <p className={styles.statusFilterTitle}>状態フィルター</p>
                <p className={styles.statusFilterHint}>
                  横断表示では複数選択できます。完了だけ外す使い方を想定しています。
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
          }
          body={
            <div className={styles.statusFilters}>
              {selectedSystemLabel ? (
                <p className={styles.filterHint}>
                  主システム絞り込み中: {selectedSystemLabel}{" "}
                  <Link className={styles.projectLink} to="/cross-project">
                    解除
                  </Link>
                </p>
              ) : null}
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
          }
        />
      ) : null}

      <ListPageContentSection
        actions={
          <div className={styles.timelineToolbar}>
            <div className={styles.timelineToolbarGroup}>
              <Button
                aria-expanded={isFilterVisible}
                onClick={() => setIsFilterVisible((current) => !current)}
                size="small"
                variant="secondary"
              >
                {isFilterVisible ? "絞り込みを非表示" : "絞り込みを表示"}
              </Button>
            </div>
            <div className={styles.timelineToolbarGroup}>
              <Button
                aria-pressed={isStructureVisible}
                className={
                  isStructureVisible
                    ? `${styles.toggleStateButton} ${styles.toggleStateButtonActive}`
                    : styles.toggleStateButton
                }
                onClick={() => setIsStructureVisible((current) => !current)}
                size="small"
                variant="secondary"
              >
                {`体制: ${isStructureVisible ? "ON" : "OFF"}`}
              </Button>
              <Button
                aria-pressed={!isCompactMode}
                className={
                  !isCompactMode
                    ? `${styles.toggleStateButton} ${styles.toggleStateButtonActive}`
                    : styles.toggleStateButton
                }
                onClick={() => setIsCompactMode((current) => !current)}
                size="small"
                variant="secondary"
              >
                {`詳細表示: ${isCompactMode ? "OFF" : "ON"}`}
              </Button>
              <Button
                aria-pressed={isGroupedByPrimarySystem}
                className={
                  isGroupedByPrimarySystem
                    ? `${styles.toggleStateButton} ${styles.toggleStateButtonActive}`
                    : styles.toggleStateButton
                }
                onClick={() =>
                  setIsGroupedByPrimarySystem((current) => !current)
                }
                size="small"
                variant="secondary"
              >
                {`システムグルーピング: ${isGroupedByPrimarySystem ? "ON" : "OFF"}`}
              </Button>
            </div>
          </div>
        }
        className={styles.section}
        description="案件ごとの週次フェーズとイベントを横並びで比較できます。必要に応じて絞り込み条件を開いて表示対象を調整してください。"
        emptyState={scopedEmptyState}
        title="横断案件タイムライン"
      >
        <p className={styles.timelineToolbarHint}>
          表示切替はタイムライン単位で反映されます。情報量と並び順を見ながら比較しやすい形に調整できます。
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.stickyColumn}>案件名</th>
                {globalWeekSlots.map((slot) => {
                  const isCurrentWeek = isDateInWeekSlot(slot.startDate);

                  return (
                    <th
                      key={slot.index}
                      className={
                        isCurrentWeek ? styles.currentWeekHeader : undefined
                      }
                      data-testid={
                        isCurrentWeek
                          ? `cross-project-current-week-${slot.index}`
                          : undefined
                      }
                    >
                      <span className={styles.weekLabel}>{slot.label}</span>
                      <span className={styles.weekDate}>{slot.subLabel}</span>
                      {isCurrentWeek ? (
                        <span className={styles.currentWeekBadge}>今週</span>
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {(isGroupedByPrimarySystem
                ? groupedProjects.flatMap((group) => [
                    { type: "group" as const, label: group.label },
                    ...group.projects.map((project) => ({
                      type: "project" as const,
                      project,
                    })),
                  ])
                : scopedProjects.map((project) => ({
                    type: "project" as const,
                    project,
                  }))
              ).map((row) => {
                if (row.type === "group") {
                  return (
                    <tr className={styles.groupRow} key={`group-${row.label}`}>
                      <td
                        className={`${styles.stickyColumn} ${styles.groupCell}`}
                        colSpan={globalWeekSlots.length + 1}
                        data-testid={`cross-project-group-${row.label}`}
                      >
                        主システム: {row.label}
                      </td>
                    </tr>
                  );
                }

                const project = row.project;
                const projectPhases = getProjectPhases(project.projectNumber);
                const projectEvents = getProjectEvents(project.projectNumber);
                const structureMembers = getProjectAssignments(
                  project.projectNumber,
                )
                  .map((assignment) => ({
                    assignment,
                    member: getMemberById(assignment.memberId),
                  }))
                  .filter(
                    (
                      item,
                    ): item is {
                      assignment: ProjectAssignment;
                      member: Member;
                    } => item.member !== undefined,
                  )
                  .sort((left, right) => {
                    const responsibilityCompare =
                      left.assignment.responsibility.localeCompare(
                        right.assignment.responsibility,
                        "ja",
                      );

                    if (responsibilityCompare !== 0) {
                      return responsibilityCompare;
                    }

                    return left.member.name.localeCompare(
                      right.member.name,
                      "ja",
                    );
                  });
                const pm = getProjectPm(project, members);

                return (
                  <tr key={project.projectNumber}>
                    <td
                      className={
                        project.hasReportItems
                          ? `${styles.stickyColumn} ${styles.stickyColumnAlert}`
                          : styles.stickyColumn
                      }
                    >
                      <div
                        className={
                          isCompactMode
                            ? `${styles.projectInfo} ${styles.projectInfoCompact}`
                            : styles.projectInfo
                        }
                        data-testid={`cross-project-project-info-${project.projectNumber}`}
                      >
                        <Link
                          className={styles.projectLink}
                          to={`/projects/${project.projectNumber}`}
                        >
                          {project.name}
                        </Link>
                        <div className={styles.metaLine}>
                          {project.projectNumber}
                        </div>
                        {!isCompactMode ? (
                          <>
                            <div className={styles.metaLine}>
                              PM: {pm?.name ?? "未設定"}
                            </div>
                            <div className={styles.metaLine}>
                              体制: {structureMembers.length}名
                            </div>
                          </>
                        ) : null}
                        <StatusBadge status={project.status} />
                        {isStructureVisible ? (
                          <div className={styles.structureList}>
                            {structureMembers.map(({ assignment, member }) => (
                              <div
                                key={assignment.id}
                                className={styles.structureItem}
                                data-testid={`cross-project-structure-${project.projectNumber}-${assignment.id}`}
                              >
                                <span className={styles.structureRole}>
                                  {assignment.responsibility}
                                </span>
                                <span className={styles.structureMember}>
                                  {formatMemberShortLabel(member)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </td>

                    {globalWeekSlots.map((slot) => {
                      const activePhases = getActivePhasesForWeek(
                        project,
                        projectPhases,
                        slot.startDate,
                      );
                      const activeEvents = projectEvents.filter(
                        (event) => event.week === slot.index,
                      );
                      const busy =
                        activePhases.length + activeEvents.length > 1;
                      const isCurrentWeek = isDateInWeekSlot(slot.startDate);

                      return (
                        <td
                          key={`${project.projectNumber}-${slot.index}`}
                          className={
                            busy
                              ? `${styles.cell} ${styles.busy} ${isCurrentWeek ? styles.currentWeekCell : ""}`
                              : `${styles.cell} ${isCurrentWeek ? styles.currentWeekCell : ""}`
                          }
                        >
                          {activePhases.length > 0 ||
                          activeEvents.length > 0 ? (
                            <div className={styles.phaseChipList}>
                              {activePhases.map((phase) => (
                                <span
                                  key={phase.id}
                                  className={`${styles.phaseChip} ${styles[getPhaseToneKey(phase.name)]}`}
                                >
                                  {phase.name}
                                </span>
                              ))}
                              {activeEvents.map((event) => (
                                <span
                                  key={event.id}
                                  className={`${styles.phaseChip} ${styles.eventChip}`}
                                  data-testid={`cross-project-event-${project.projectNumber}-${event.id}`}
                                >
                                  <span className={styles.eventChipTag}>
                                    EV
                                  </span>
                                  <span className={styles.eventChipText}>
                                    {event.name}
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className={styles.emptyCell}>-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ListPageContentSection>
    </div>
  );
}
