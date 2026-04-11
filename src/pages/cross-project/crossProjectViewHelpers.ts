import type { Project } from "../../types/project";

export interface EmptyStateContent {
  title: string;
  description: string;
}

export type CrossProjectToneIndex = 0 | 1 | 2 | 3;

type CssModuleClasses = Record<string, string>;

interface EmptyStateParams {
  hasNoProjectsInMode: boolean;
  hasNoSearchResults: boolean;
  hasNoStatusMatches: boolean;
  hasNoStatusesSelected: boolean;
  isBookmarkMode: boolean;
  scopedProjectCount: number;
  selectedSystemId: string;
  selectedSystemLabel: string | null;
}

interface StickyProjectCellClassNameParams {
  hasReportItems?: boolean;
  isGrouped: boolean;
  toneIndex: CrossProjectToneIndex;
  styles: CssModuleClasses;
}

interface TimelineCellClassNameParams {
  busy: boolean;
  isCurrentSlot: boolean;
  styles: CssModuleClasses;
}

function joinClassNames(
  ...classNames: Array<string | false | null | undefined>
) {
  return classNames.filter(Boolean).join(" ");
}

export function getToneIndex(index: number): CrossProjectToneIndex {
  return (index % 4) as CrossProjectToneIndex;
}

export function getToggleButtonClassName(
  isActive: boolean,
  styles: CssModuleClasses,
) {
  return joinClassNames(
    styles.toggleStateButton,
    isActive && styles.toggleStateButtonActive,
  );
}

export function getViewModeButtonClassName(
  isActive: boolean,
  styles: CssModuleClasses,
) {
  return joinClassNames(styles.toggle, isActive && styles.toggleActive);
}

export function getGroupRowClassName(
  toneIndex: CrossProjectToneIndex,
  styles: CssModuleClasses,
) {
  return joinClassNames(styles.groupRow, styles[`groupTone${toneIndex}`]);
}

export function getGroupCellClassName(
  toneIndex: CrossProjectToneIndex,
  styles: CssModuleClasses,
) {
  return joinClassNames(
    styles.stickyColumn,
    styles.groupCell,
    styles[`groupCellTone${toneIndex}`],
  );
}

export function getStickyProjectCellClassName({
  hasReportItems,
  isGrouped,
  toneIndex,
  styles,
}: StickyProjectCellClassNameParams) {
  return joinClassNames(
    styles.stickyColumn,
    hasReportItems && styles.stickyColumnAlert,
    isGrouped && styles.groupedProjectCell,
    isGrouped && styles[`groupedProjectCellTone${toneIndex}`],
  );
}

export function getProjectInfoClassName(
  isCompactMode: boolean,
  styles: CssModuleClasses,
) {
  return joinClassNames(
    styles.projectInfo,
    isCompactMode && styles.projectInfoCompact,
  );
}

export function getTimelineCellClassName({
  busy,
  isCurrentSlot,
  styles,
}: TimelineCellClassNameParams) {
  return joinClassNames(
    styles.cell,
    busy && styles.busy,
    isCurrentSlot && styles.currentWeekCell,
  );
}

export function getSelectedSystemLabel(
  selectedSystemId: string,
  systemNameById: Map<string, string>,
) {
  if (!selectedSystemId) {
    return null;
  }

  return `${selectedSystemId} / ${systemNameById.get(selectedSystemId) ?? selectedSystemId}`;
}

export function getScopedProjects(
  projects: Project[],
  selectedSystemId: string,
) {
  if (!selectedSystemId) {
    return projects;
  }

  return projects.filter(
    (project) => project.relatedSystemIds?.[0] === selectedSystemId,
  );
}

export function getEmptyState({
  hasNoProjectsInMode,
  hasNoSearchResults,
  hasNoStatusMatches,
  hasNoStatusesSelected,
  isBookmarkMode,
  scopedProjectCount,
  selectedSystemId,
  selectedSystemLabel,
}: EmptyStateParams): EmptyStateContent | null {
  if (isBookmarkMode && hasNoProjectsInMode) {
    return {
      title: "ブックマーク案件はまだありません",
      description:
        "案件一覧または案件詳細から案件をブックマークすると、この横断ビューで確認できます。",
    };
  }

  if (hasNoStatusesSelected) {
    return {
      title: "状態フィルターが未選択です",
      description:
        "表示したい状態を選ぶと、対象の案件だけを横断ビューに表示できます。",
    };
  }

  if (hasNoStatusMatches) {
    return {
      title: "条件に一致する案件はありません",
      description: "状態フィルターや表示モードの条件を見直してください。",
    };
  }

  if (hasNoSearchResults) {
    return {
      title: "検索条件に一致する案件はありません",
      description: "案件番号または案件名を調整して再度検索してください。",
    };
  }

  if (selectedSystemId && scopedProjectCount === 0) {
    return {
      title: "対象システムに一致する案件はありません",
      description: `${selectedSystemLabel ?? selectedSystemId} を主システムに持つ案件は、現在の表示条件では見つかりません。`,
    };
  }

  return null;
}
