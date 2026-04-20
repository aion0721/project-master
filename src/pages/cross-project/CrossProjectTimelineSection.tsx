import { useCallback } from "react";
import { FilterVisibilityToggleButton } from "../../components/FilterVisibilityToggleButton";
import { ListPageContentSection } from "../../components/ListPageContentSection";
import { useVirtualWindow } from "../../components/useVirtualWindow";
import { Button } from "../../components/ui/Button";
import type {
  Member,
  Phase,
  ProjectAssignment,
  ProjectEvent,
} from "../../types/project";
import {
  isCurrentMonthSlot,
  isDateInWeekSlot,
  type WeekSlot,
} from "../../utils/projectUtils";
import { CrossProjectProjectRow } from "./CrossProjectProjectRow";
import {
  getGroupCellClassName,
  getGroupRowClassName,
  getToggleButtonClassName,
  type EmptyStateContent,
} from "./crossProjectViewHelpers";
import type { CrossProjectRow } from "./useCrossProjectRows";
import type { CrossProjectTimeScale } from "./useCrossProjectView";
import styles from "./CrossProjectViewPage.module.css";

interface CrossProjectTimelineSectionProps {
  emptyState: EmptyStateContent | null;
  getMemberById: (memberId: string) => Member | undefined;
  getProjectAssignments: (projectId: string) => ProjectAssignment[];
  getProjectEvents: (projectId: string) => ProjectEvent[];
  getProjectPhases: (projectId: string) => Phase[];
  isCompactMode: boolean;
  isFilterVisible: boolean;
  isGroupedByPrimarySystem: boolean;
  isStructureVisible: boolean;
  members: Member[];
  rows: CrossProjectRow[];
  setIsCompactMode: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFilterVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setIsGroupedByPrimarySystem: React.Dispatch<React.SetStateAction<boolean>>;
  setIsStructureVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setTimeScale: (value: CrossProjectTimeScale) => void;
  tableWrapRef: React.RefObject<HTMLDivElement | null>;
  timeScale: CrossProjectTimeScale;
  timelineSlots: WeekSlot[];
}

export function CrossProjectTimelineSection({
  emptyState,
  getMemberById,
  getProjectAssignments,
  getProjectEvents,
  getProjectPhases,
  isCompactMode,
  isFilterVisible,
  isGroupedByPrimarySystem,
  isStructureVisible,
  members,
  rows,
  setIsCompactMode,
  setIsFilterVisible,
  setIsGroupedByPrimarySystem,
  setIsStructureVisible,
  setTimeScale,
  tableWrapRef,
  timeScale,
  timelineSlots,
}: CrossProjectTimelineSectionProps) {
  const getRowSize = useCallback(
    (index: number) => {
      const row = rows[index];

      if (!row) {
        return 0;
      }

      if (row.type === "group") {
        return 44;
      }

      if (isStructureVisible) {
        return isCompactMode ? 220 : 260;
      }

      return isCompactMode ? 96 : 144;
    },
    [isCompactMode, isStructureVisible, rows],
  );
  const { startIndex, endIndex, paddingTop, paddingBottom } = useVirtualWindow({
    containerRef: tableWrapRef,
    itemCount: rows.length,
    getItemSize: getRowSize,
    overscan: 6,
  });
  const visibleRows = endIndex >= startIndex ? rows.slice(startIndex, endIndex + 1) : [];
  const columnCount = timelineSlots.length + 1;

  return (
    <ListPageContentSection
      actions={
        <div className={styles.timelineToolbar}>
          <div className={styles.timelineToolbarGroup}>
            <FilterVisibilityToggleButton
              hideLabel="絞り込みを閉じる"
              isVisible={isFilterVisible}
              onToggle={() => setIsFilterVisible((current) => !current)}
            />
          </div>
          <div className={styles.timelineToolbarGroup}>
            <Button
              aria-pressed={timeScale === "week"}
              className={getToggleButtonClassName(timeScale === "week", styles)}
              onClick={() => setTimeScale("week")}
              size="small"
              variant="secondary"
            >
              {"週表示"}
            </Button>
            <Button
              aria-pressed={timeScale === "month"}
              className={getToggleButtonClassName(
                timeScale === "month",
                styles,
              )}
              onClick={() => setTimeScale("month")}
              size="small"
              variant="secondary"
            >
              {"月表示"}
            </Button>
            <Button
              aria-pressed={isStructureVisible}
              className={getToggleButtonClassName(isStructureVisible, styles)}
              onClick={() => setIsStructureVisible((current) => !current)}
              size="small"
              variant="secondary"
            >
              {`体制: ${isStructureVisible ? "ON" : "OFF"}`}
            </Button>
            <Button
              aria-pressed={!isCompactMode}
              className={getToggleButtonClassName(!isCompactMode, styles)}
              onClick={() => setIsCompactMode((current) => !current)}
              size="small"
              variant="secondary"
            >
              {`詳細表示: ${isCompactMode ? "OFF" : "ON"}`}
            </Button>
            <Button
              aria-pressed={isGroupedByPrimarySystem}
              className={getToggleButtonClassName(
                isGroupedByPrimarySystem,
                styles,
              )}
              onClick={() => setIsGroupedByPrimarySystem((current) => !current)}
              size="small"
              variant="secondary"
            >
              {`システムグルーピング: ${isGroupedByPrimarySystem ? "ON" : "OFF"}`}
            </Button>
          </div>
        </div>
      }
      className={styles.section}
      description={
        "案件ごとの進行フェーズとイベントを横断で比較できます。週表示では密度を、月表示では全体傾向を確認できます。"
      }
      emptyState={emptyState}
      title={"横断案件タイムライン"}
    >
      <p className={styles.timelineToolbarHint}>
        {
          "表示切替はタイムライン右上で変更できます。負荷の高い箇所を見つけたら、詳細表示や体制表示を組み合わせて確認してください。"
        }
      </p>
      <div
        className={styles.tableWrap}
        data-testid="cross-project-table-wrap"
        ref={tableWrapRef}
      >
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.stickyColumn}>{"案件"}</th>
              {timelineSlots.map((slot) => {
                const isCurrentSlot =
                  timeScale === "month"
                    ? isCurrentMonthSlot(slot.startDate, slot.endDate)
                    : isDateInWeekSlot(slot.startDate);

                return (
                  <th
                    key={slot.index}
                    className={
                      isCurrentSlot ? styles.currentWeekHeader : undefined
                    }
                    data-testid={
                      isCurrentSlot
                        ? `cross-project-current-${timeScale}-${slot.index}`
                        : undefined
                    }
                  >
                    <span className={styles.weekLabel}>{slot.label}</span>
                    <span className={styles.weekDate}>{slot.subLabel}</span>
                    {isCurrentSlot ? (
                      <span className={styles.currentWeekBadge}>
                        {timeScale === "month" ? "今月" : "今週"}
                      </span>
                    ) : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paddingTop > 0 ? (
              <tr aria-hidden="true" className={styles.spacerRow}>
                <td colSpan={columnCount} style={{ height: `${paddingTop}px`, padding: 0 }} />
              </tr>
            ) : null}
            {visibleRows.map((row) => {
              if (row.type === "group") {
                return (
                  <tr
                    className={getGroupRowClassName(row.toneIndex, styles)}
                    key={`group-${row.label}`}
                  >
                    <td
                      className={getGroupCellClassName(row.toneIndex, styles)}
                      data-testid={`cross-project-group-${row.label}`}
                    >
                      {`主システム: ${row.label}`}
                    </td>
                    <td
                      className={styles.groupFillCell}
                      colSpan={timelineSlots.length}
                    />
                  </tr>
                );
              }

              return (
                <CrossProjectProjectRow
                  getMemberById={getMemberById}
                  getProjectAssignments={getProjectAssignments}
                  getProjectEvents={getProjectEvents}
                  getProjectPhases={getProjectPhases}
                  isCompactMode={isCompactMode}
                  isGroupedByPrimarySystem={isGroupedByPrimarySystem}
                  isStructureVisible={isStructureVisible}
                  key={row.project.projectNumber}
                  members={members}
                  project={row.project}
                  timeScale={timeScale}
                  timelineSlots={timelineSlots}
                  toneIndex={row.toneIndex}
                />
              );
            })}
            {paddingBottom > 0 ? (
              <tr aria-hidden="true" className={styles.spacerRow}>
                <td colSpan={columnCount} style={{ height: `${paddingBottom}px`, padding: 0 }} />
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </ListPageContentSection>
  );
}
