import { useMemo, useState, type ReactNode } from "react";
import { Button } from "../../components/ui/Button";
import { SearchSelect } from "../../components/ui/SearchSelect";
import type {
  ManagedSystem,
  Phase,
  Project,
  ProjectLink,
  ProjectStatusEntry,
  ProjectStatusOverride,
} from "../../types/project";
import { getPhaseToneKey } from "../../utils/projectPhasePresets";
import { formatPeriod } from "../../utils/projectUtils";
import styles from "../projects/ProjectDetailPage.module.css";

interface ScheduleDraft {
  startDate: string;
  endDate: string;
}

interface ProjectSummaryDraft {
  projectNumber: string;
  name: string;
}

interface ProjectDetailMetaGridProps {
  currentPhase?: Phase;
  currentPhaseChanged: boolean;
  currentPhaseDraftId: string;
  currentPhaseError: string | null;
  isCurrentPhaseEditing: boolean;
  isProjectSummaryEditing: boolean;
  isProjectLinksEditing: boolean;
  isProjectNoteEditing: boolean;
  isProjectStatusEntriesEditing: boolean;
  isProjectReportStatusEditing: boolean;
  isProjectStatusEditing: boolean;
  isProjectSystemsEditing: boolean;
  isSavingCurrentPhase: boolean;
  isSavingProjectSummary: boolean;
  isSavingProjectLinks: boolean;
  isSavingProjectNote: boolean;
  isSavingProjectStatusEntries: boolean;
  isSavingProjectReportStatus: boolean;
  isSavingProjectStatusOverride: boolean;
  isSavingProjectSystems: boolean;
  isSavingSchedule: boolean;
  isScheduleEditing: boolean;
  availableSystems: ManagedSystem[];
  onProjectSummaryCancel: () => void;
  onProjectSummaryDraftChange: (patch: Partial<ProjectSummaryDraft>) => void;
  onProjectSummaryEdit: () => void;
  onProjectSummarySave: () => void;
  onAddProjectLink: () => void;
  onCurrentPhaseCancel: () => void;
  onCurrentPhaseDraftChange: (phaseId: string) => void;
  onCurrentPhaseEdit: () => void;
  onCurrentPhaseSave: () => void;
  onProjectLinkDraftChange: (
    index: number,
    patch: Partial<ProjectLink>,
  ) => void;
  onProjectLinksCancel: () => void;
  onProjectLinksEdit: () => void;
  onProjectLinksSave: () => void;
  onProjectNoteCancel: () => void;
  onProjectNoteDraftChange: (note: string) => void;
  onProjectNoteEdit: () => void;
  onProjectNoteSave: () => void;
  onAddProjectStatusEntry: () => void;
  onProjectStatusEntryDraftChange: (
    index: number,
    patch: Partial<ProjectStatusEntry>,
  ) => void;
  onProjectStatusEntryMove: (index: number, direction: "up" | "down") => void;
  onProjectStatusEntriesCancel: () => void;
  onProjectStatusEntriesEdit: () => void;
  onProjectStatusEntriesSave: () => void;
  onProjectReportStatusCancel: () => void;
  onProjectReportStatusDraftChange: (hasReportItems: boolean) => void;
  onProjectReportStatusEdit: () => void;
  onProjectReportStatusSave: () => void;
  onProjectStatusCancel: () => void;
  onProjectStatusBulkApplyChange: (checked: boolean) => void;
  onProjectStatusOverrideDraftChange: (
    status: ProjectStatusOverride | null,
  ) => void;
  onProjectStatusEdit: () => void;
  onProjectStatusSave: () => void;
  onProjectSystemsCancel: () => void;
  onProjectSystemsEdit: () => void;
  onProjectSystemsSave: () => void;
  onProjectSystemChange: (systemId: string) => void;
  onRemoveProjectLink: (index: number) => void;
  onRemoveProjectStatusEntry: (index: number) => void;
  onScheduleCancel: () => void;
  onScheduleDraftChange: (patch: Partial<ScheduleDraft>) => void;
  onScheduleEdit: () => void;
  onScheduleSave: () => void;
  pmName?: string;
  project: Project;
  projectSummaryChanged: boolean;
  projectSummaryDraft: ProjectSummaryDraft;
  projectSummaryError: string | null;
  projectLinksChanged: boolean;
  projectLinksDraft: ProjectLink[];
  projectLinksError: string | null;
  projectNoteChanged: boolean;
  projectNoteDraft: string;
  projectNoteError: string | null;
  projectStatusEntriesChanged: boolean;
  projectStatusEntriesDraft: ProjectStatusEntry[];
  projectStatusEntriesError: string | null;
  projectReportStatusChanged: boolean;
  projectReportStatusDraft: boolean;
  projectReportStatusError: string | null;
  projectStatusOverrideChanged: boolean;
  projectStatusBulkApplyEnabled: boolean;
  projectStatusOverrideDraft: ProjectStatusOverride | null;
  projectStatusOverrideError: string | null;
  projectPhases: Phase[];
  projectSystemIdsDraft: string[];
  projectSystemsChanged: boolean;
  projectSystemsError: string | null;
  scheduleChanged: boolean;
  scheduleDraft: ScheduleDraft;
  scheduleError: string | null;
}

function getCurrentPhaseCardClassName(phase?: Phase) {
  if (!phase) {
    return undefined;
  }

  switch (getPhaseToneKey(phase.name)) {
    case "preStudy":
      return styles.metaCardPhaseTonePreStudy;
    case "discovery":
      return styles.metaCardPhaseToneDiscovery;
    case "basicDesign":
      return styles.metaCardPhaseToneBasicDesign;
    case "detailDesign":
      return styles.metaCardPhaseToneDetailDesign;
    case "ct":
      return styles.metaCardPhaseToneCt;
    case "ita":
      return styles.metaCardPhaseToneIta;
    case "itb":
      return styles.metaCardPhaseToneItb;
    case "uat":
      return styles.metaCardPhaseToneUat;
    case "migration":
      return styles.metaCardPhaseToneMigration;
    case "defaultTone":
    default:
      return styles.metaCardPhaseToneDefault;
  }
}

function getProjectStatusCardClassName(status?: Project["status"]) {
  switch (status) {
    case "進行中":
      return styles.metaCardPhaseInProgress;
    case "完了":
      return styles.metaCardPhaseCompleted;
    case "遅延":
      return styles.metaCardPhaseDelayed;
    case "中止":
      return styles.metaCardStatusCancelled;
    case "未着手":
    default:
      return styles.metaCardPhaseNotStarted;
  }
}

function MetaCard({
  children,
  className,
  testId,
  label,
}: {
  children: ReactNode;
  className?: string;
  testId?: string;
  label: string;
}) {
  return (
    <article
      className={
        className ? `${styles.metaCard} ${className}` : styles.metaCard
      }
      data-testid={testId}
    >
      <span className={styles.metaLabel}>{label}</span>
      {children}
    </article>
  );
}

export function ProjectDetailMetaGrid({
  currentPhase,
  currentPhaseChanged,
  currentPhaseDraftId,
  currentPhaseError,
  isCurrentPhaseEditing,
  isProjectSummaryEditing,
  isProjectLinksEditing,
  isProjectNoteEditing,
  isProjectStatusEntriesEditing,
  isProjectReportStatusEditing,
  isProjectStatusEditing,
  isProjectSystemsEditing,
  isSavingCurrentPhase,
  isSavingProjectSummary,
  isSavingProjectLinks,
  isSavingProjectNote,
  isSavingProjectStatusEntries,
  isSavingProjectReportStatus,
  isSavingProjectStatusOverride,
  isSavingProjectSystems,
  isSavingSchedule,
  isScheduleEditing,
  availableSystems,
  onProjectSummaryCancel,
  onProjectSummaryDraftChange,
  onProjectSummaryEdit,
  onProjectSummarySave,
  onAddProjectLink,
  onCurrentPhaseCancel,
  onCurrentPhaseDraftChange,
  onCurrentPhaseEdit,
  onCurrentPhaseSave,
  onProjectLinkDraftChange,
  onProjectLinksCancel,
  onProjectLinksEdit,
  onProjectLinksSave,
  onProjectNoteCancel,
  onProjectNoteDraftChange,
  onProjectNoteEdit,
  onProjectNoteSave,
  onAddProjectStatusEntry,
  onProjectStatusEntryDraftChange,
  onProjectStatusEntryMove,
  onProjectStatusEntriesCancel,
  onProjectStatusEntriesEdit,
  onProjectStatusEntriesSave,
  onProjectReportStatusCancel,
  onProjectReportStatusDraftChange,
  onProjectReportStatusEdit,
  onProjectReportStatusSave,
  onProjectStatusCancel,
  onProjectStatusBulkApplyChange,
  onProjectStatusOverrideDraftChange,
  onProjectStatusEdit,
  onProjectStatusSave,
  onProjectSystemsCancel,
  onProjectSystemsEdit,
  onProjectSystemsSave,
  onProjectSystemChange,
  onRemoveProjectLink,
  onRemoveProjectStatusEntry,
  onScheduleCancel,
  onScheduleDraftChange,
  onScheduleEdit,
  onScheduleSave,
  pmName,
  project,
  projectSummaryChanged,
  projectSummaryDraft,
  projectSummaryError,
  projectLinksChanged,
  projectLinksDraft,
  projectLinksError,
  projectNoteChanged,
  projectNoteDraft,
  projectNoteError,
  projectStatusEntriesChanged,
  projectStatusEntriesDraft,
  projectStatusEntriesError,
  projectReportStatusChanged,
  projectReportStatusDraft,
  projectReportStatusError,
  projectStatusOverrideChanged,
  projectStatusBulkApplyEnabled,
  projectStatusOverrideDraft,
  projectStatusOverrideError,
  projectPhases,
  projectSystemIdsDraft,
  projectSystemsChanged,
  projectSystemsError,
  scheduleChanged,
  scheduleDraft,
  scheduleError,
}: ProjectDetailMetaGridProps) {
  const [statusEntriesSortOrder, setStatusEntriesSortOrder] = useState<
    "desc" | "asc"
  >("desc");
  const selectedSystems = availableSystems.filter((system) =>
    (project.relatedSystemIds ?? []).includes(system.id),
  );
  const sortedStatusEntries = useMemo(() => {
    const entries = [...(project.statusEntries ?? [])];
    entries.sort((left, right) =>
      statusEntriesSortOrder === "desc"
        ? right.date.localeCompare(left.date)
        : left.date.localeCompare(right.date),
    );
    return entries;
  }, [project.statusEntries, statusEntriesSortOrder]);

  return (
    <div className={styles.metaGrid}>
      <MetaCard className={styles.metaCardStandard} label="基本情報">
        {isProjectSummaryEditing ? (
          <div className={styles.phaseMetaEditor}>
            <label className={styles.formField}>
              <span className={styles.formLabel}>プロジェクト番号</span>
              <input
                aria-label="プロジェクト番号"
                className={styles.selectInput}
                data-testid="project-summary-number"
                onChange={(event) =>
                  onProjectSummaryDraftChange({
                    projectNumber: event.target.value,
                  })
                }
                type="text"
                value={projectSummaryDraft.projectNumber}
              />
            </label>
            <label className={styles.formField}>
              <span className={styles.formLabel}>プロジェクト名</span>
              <input
                aria-label="プロジェクト名"
                className={styles.selectInput}
                data-testid="project-summary-name"
                onChange={(event) =>
                  onProjectSummaryDraftChange({ name: event.target.value })
                }
                type="text"
                value={projectSummaryDraft.name}
              />
            </label>
            <div className={styles.phaseMetaActions}>
              <Button
                data-testid="project-summary-save-button"
                disabled={isSavingProjectSummary || !projectSummaryChanged}
                onClick={onProjectSummarySave}
                size="small"
              >
                {isSavingProjectSummary ? "保存中..." : "保存"}
              </Button>
              <Button
                data-testid="project-summary-cancel-button"
                onClick={onProjectSummaryCancel}
                size="small"
                variant="secondary"
              >
                キャンセル
              </Button>
            </div>
            {projectSummaryError ? (
              <p className={styles.metaError}>{projectSummaryError}</p>
            ) : null}
          </div>
        ) : (
          <div className={styles.phaseMetaDisplay}>
            <div className={styles.phaseMetaEditor}>
              <strong
                className={styles.metaValue}
                data-testid="project-summary-name-value"
              >
                {project.name}
              </strong>
              <span
                className={styles.metaSubtle}
                data-testid="project-summary-number-value"
              >
                {project.projectNumber}
              </span>
              <span
                className={styles.metaSubtle}
                data-testid="project-summary-pm-value"
              >
                PM: {pmName ?? "未設定"}
              </span>
            </div>
            <Button
              data-testid="project-summary-edit-button"
              onClick={onProjectSummaryEdit}
              size="small"
              variant="secondary"
            >
              編集
            </Button>
          </div>
        )}
      </MetaCard>

      <MetaCard className={styles.metaCardStandard} label="期間">
        {isScheduleEditing ? (
          <div className={styles.phaseMetaEditor}>
            <label className={styles.formField}>
              <span className={styles.visuallyHidden}>開始日</span>
              <input
                aria-label="開始日"
                className={styles.selectInput}
                data-testid="project-schedule-start"
                onChange={(event) =>
                  onScheduleDraftChange({ startDate: event.target.value })
                }
                type="date"
                value={scheduleDraft.startDate}
              />
            </label>
            <label className={styles.formField}>
              <span className={styles.visuallyHidden}>終了日</span>
              <input
                aria-label="終了日"
                className={styles.selectInput}
                data-testid="project-schedule-end"
                onChange={(event) =>
                  onScheduleDraftChange({ endDate: event.target.value })
                }
                type="date"
                value={scheduleDraft.endDate}
              />
            </label>
            <div className={styles.phaseMetaActions}>
              <Button
                data-testid="project-schedule-save-button"
                disabled={isSavingSchedule || !scheduleChanged}
                onClick={onScheduleSave}
                size="small"
              >
                {isSavingSchedule ? "保存中..." : "保存"}
              </Button>
              <Button
                data-testid="project-schedule-cancel-button"
                onClick={onScheduleCancel}
                size="small"
                variant="secondary"
              >
                キャンセル
              </Button>
            </div>
            {scheduleError ? (
              <p className={styles.metaError}>{scheduleError}</p>
            ) : null}
          </div>
        ) : (
          <div className={styles.phaseMetaDisplay}>
            <strong
              className={styles.metaValue}
              data-testid="project-schedule-value"
            >
              {formatPeriod(project.startDate, project.endDate)}
            </strong>
            <Button
              data-testid="project-schedule-edit-button"
              onClick={onScheduleEdit}
              size="small"
              variant="secondary"
            >
              編集
            </Button>
          </div>
        )}
      </MetaCard>

      <MetaCard className={styles.metaCardStandard} label="主システム">
        {isProjectSystemsEditing ? (
          <div className={styles.phaseMetaEditor}>
            <div className={styles.systemSelectionList}>
              {availableSystems.length > 0 ? (
                <label className={styles.formField}>
                  <span className={styles.visuallyHidden}>主システム</span>
                  <SearchSelect
                    ariaLabel="主システム"
                    className={styles.selectInput}
                    dataTestId="project-system-select"
                    onChange={onProjectSystemChange}
                    options={availableSystems.map((system) => ({
                      value: system.id,
                      label: `${system.id} / ${system.name}`,
                      keywords: [system.name, system.category],
                    }))}
                    placeholder="システムを検索"
                    value={projectSystemIdsDraft[0] ?? ""}
                  />
                </label>
              ) : (
                <p className={styles.emptyText}>
                  選択可能なシステムがありません。
                </p>
              )}
            </div>
            <div className={styles.phaseMetaActions}>
              <Button
                data-testid="project-systems-save-button"
                disabled={isSavingProjectSystems || !projectSystemsChanged}
                onClick={onProjectSystemsSave}
                size="small"
              >
                {isSavingProjectSystems ? "保存中..." : "保存"}
              </Button>
              <Button
                data-testid="project-systems-cancel-button"
                onClick={onProjectSystemsCancel}
                size="small"
                variant="secondary"
              >
                キャンセル
              </Button>
            </div>
            {projectSystemsError ? (
              <p className={styles.metaError}>{projectSystemsError}</p>
            ) : null}
          </div>
        ) : (
          <div className={styles.phaseMetaDisplay}>
            {selectedSystems.length > 0 ? (
              <strong
                className={styles.metaValue}
                data-testid="project-system-value"
              >
                {selectedSystems[0]?.id} / {selectedSystems[0]?.name}
              </strong>
            ) : (
              <strong
                className={styles.metaValue}
                data-testid="project-system-empty"
              >
                未設定
              </strong>
            )}
            <Button
              data-testid="project-systems-edit-button"
              onClick={onProjectSystemsEdit}
              size="small"
              variant="secondary"
            >
              編集
            </Button>
          </div>
        )}
      </MetaCard>

      <MetaCard
        className={`${styles.metaCardStandard} ${styles.metaCardCurrentPhase} ${getCurrentPhaseCardClassName(currentPhase) ?? ""}`.trim()}
        label="現在フェーズ"
        testId="current-phase-card"
      >
        {isCurrentPhaseEditing ? (
          <div className={styles.phaseMetaEditor}>
            <label className={styles.formField}>
              <span className={styles.visuallyHidden}>現在フェーズ</span>
              <select
                aria-label="現在フェーズ"
                className={styles.selectInput}
                data-testid="current-phase-select"
                onChange={(event) =>
                  onCurrentPhaseDraftChange(event.target.value)
                }
                value={currentPhaseDraftId}
              >
                <option value="">選択してください</option>
                {projectPhases.map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.name}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.phaseMetaActions}>
              <Button
                data-testid="current-phase-save-button"
                disabled={isSavingCurrentPhase || !currentPhaseChanged}
                onClick={onCurrentPhaseSave}
                size="small"
              >
                {isSavingCurrentPhase ? "保存中..." : "保存"}
              </Button>
              <Button
                data-testid="current-phase-cancel-button"
                onClick={onCurrentPhaseCancel}
                size="small"
                variant="secondary"
              >
                キャンセル
              </Button>
            </div>
            {currentPhaseError ? (
              <p className={styles.metaError}>{currentPhaseError}</p>
            ) : null}
          </div>
        ) : (
          <div className={styles.phaseMetaDisplay}>
            <strong
              className={styles.metaValue}
              data-testid="current-phase-value"
            >
              {currentPhase?.name ?? "未設定"}
            </strong>
            <Button
              data-testid="current-phase-edit-button"
              onClick={onCurrentPhaseEdit}
              size="small"
              variant="secondary"
            >
              編集
            </Button>
          </div>
        )}
      </MetaCard>

      <MetaCard
        className={`${styles.metaCardStandard} ${styles.metaCardProjectStatus} ${getProjectStatusCardClassName(project.status) ?? ""}`.trim()}
        label="案件状態"
        testId="project-status-card"
      >
        {isProjectStatusEditing ? (
          <div className={styles.phaseMetaEditor}>
            <label className={styles.formField}>
              <span className={styles.visuallyHidden}>案件状態</span>
              <select
                aria-label="案件状態"
                className={styles.selectInput}
                data-testid="project-status-override-select"
                onChange={(event) =>
                  onProjectStatusOverrideDraftChange(
                    event.target.value
                      ? (event.target.value as ProjectStatusOverride)
                      : null,
                  )
                }
                value={projectStatusOverrideDraft ?? ""}
              >
                <option value="">自動</option>
                <option value="未着手">未着手</option>
                <option value="進行中">進行中</option>
                <option value="完了">完了</option>
                <option value="遅延">遅延</option>
                <option value="中止">中止</option>
              </select>
            </label>
            {projectStatusOverrideDraft === "未着手" ||
            projectStatusOverrideDraft === "完了" ? (
              <label className={styles.statusSyncOption}>
                <input
                  checked={projectStatusBulkApplyEnabled}
                  data-testid="project-status-apply-all-phases"
                  onChange={(event) =>
                    onProjectStatusBulkApplyChange(event.target.checked)
                  }
                  type="checkbox"
                />
                <span>
                  この状態を全フェーズへ反映
                  <span className={styles.statusSyncHint}>
                    {projectStatusOverrideDraft === "完了"
                      ? "全フェーズを完了 / 進捗100%にします。"
                      : "全フェーズを未着手 / 進捗0%にします。"}
                  </span>
                </span>
              </label>
            ) : null}
            <div className={styles.phaseMetaActions}>
              <Button
                data-testid="project-status-override-save-button"
                disabled={
                  isSavingProjectStatusOverride ||
                  !(
                    projectStatusOverrideChanged ||
                    projectStatusBulkApplyEnabled
                  )
                }
                onClick={onProjectStatusSave}
                size="small"
              >
                {isSavingProjectStatusOverride ? "保存中..." : "保存"}
              </Button>
              <Button
                data-testid="project-status-override-cancel-button"
                onClick={onProjectStatusCancel}
                size="small"
                variant="secondary"
              >
                キャンセル
              </Button>
            </div>
            {projectStatusOverrideError ? (
              <p className={styles.metaError}>{projectStatusOverrideError}</p>
            ) : null}
          </div>
        ) : (
          <div className={styles.phaseMetaDisplay}>
            <div className={styles.projectStatusDisplay}>
              <strong
                className={styles.metaValue}
                data-testid="project-status-value"
              >
                {project.status}
              </strong>
              <span
                className={styles.metaHelperText}
                data-testid="project-status-mode"
              >
                {project.statusOverride ? "手動上書き" : "自動判定"}
              </span>
            </div>
            <Button
              data-testid="project-status-edit-button"
              onClick={onProjectStatusEdit}
              size="small"
              variant="secondary"
            >
              編集
            </Button>
          </div>
        )}
      </MetaCard>

      <MetaCard className={`${styles.metaCardTwoColumn} ${styles.metaCardSupport}`} label="メモ">
        {isProjectNoteEditing ? (
          <div className={styles.phaseMetaEditor}>
            <label className={styles.formField}>
              <span className={styles.visuallyHidden}>メモ</span>
              <textarea
                aria-label="メモ"
                className={`${styles.selectInput} ${styles.memoInput}`}
                data-testid="project-note-input"
                onChange={(event) =>
                  onProjectNoteDraftChange(event.target.value)
                }
                placeholder="状況、課題、次回アクションを入力"
                value={projectNoteDraft}
              />
            </label>
            <div className={styles.phaseMetaActions}>
              <Button
                data-testid="project-note-save-button"
                disabled={isSavingProjectNote || !projectNoteChanged}
                onClick={onProjectNoteSave}
                size="small"
              >
                {isSavingProjectNote ? "保存中..." : "保存"}
              </Button>
              <Button
                data-testid="project-note-cancel-button"
                onClick={onProjectNoteCancel}
                size="small"
                variant="secondary"
              >
                キャンセル
              </Button>
            </div>
            {projectNoteError ? (
              <p className={styles.metaError}>{projectNoteError}</p>
            ) : null}
          </div>
        ) : (
          <div className={styles.projectNoteDisplay}>
            <strong
              className={styles.metaValue}
              data-testid="project-note-value"
            >
              {project.note?.trim() || "未設定"}
            </strong>
            <Button
              data-testid="project-note-edit-button"
              onClick={onProjectNoteEdit}
              size="small"
              variant="secondary"
            >
              編集
            </Button>
          </div>
        )}
      </MetaCard>

      <MetaCard className={`${styles.metaCardTwoColumn} ${styles.metaCardSupport}`} label="案件リンク">
        {isProjectLinksEditing ? (
          <div className={styles.phaseMetaEditor}>
            <div className={styles.projectLinksHeader}>
              <span className={styles.metaHelperText}>
                リンク名と URL をセットで入力します。
              </span>
              <Button
                onClick={onAddProjectLink}
                size="small"
                variant="secondary"
              >
                追加
              </Button>
            </div>

            <div className={styles.projectLinksEditorList}>
              {projectLinksDraft.map((link, index) => (
                <div
                  key={`project-link-draft-${index}`}
                  className={styles.projectLinkEditorRow}
                >
                  <label className={styles.formField}>
                    <span className={styles.visuallyHidden}>
                      案件リンク名 {index + 1}
                    </span>
                    <input
                      aria-label={`案件リンク名 ${index + 1}`}
                      className={styles.selectInput}
                      data-testid={`project-link-label-${index}`}
                      onChange={(event) =>
                        onProjectLinkDraftChange(index, {
                          label: event.target.value,
                        })
                      }
                      placeholder="リンク名"
                      value={link.label}
                    />
                  </label>
                  <label className={styles.formField}>
                    <span className={styles.visuallyHidden}>
                      案件リンクURL {index + 1}
                    </span>
                    <input
                      aria-label={`案件リンクURL ${index + 1}`}
                      className={styles.selectInput}
                      data-testid={`project-link-url-${index}`}
                      onChange={(event) =>
                        onProjectLinkDraftChange(index, {
                          url: event.target.value,
                        })
                      }
                      placeholder="https://example.com/projects/PRJ-001"
                      type="url"
                      value={link.url}
                    />
                  </label>
                  <Button
                    data-testid={`project-link-remove-${index}`}
                    onClick={() => onRemoveProjectLink(index)}
                    size="small"
                    variant="danger"
                  >
                    削除
                  </Button>
                </div>
              ))}
            </div>

            <div className={styles.phaseMetaActions}>
              <Button
                data-testid="project-links-save-button"
                disabled={isSavingProjectLinks || !projectLinksChanged}
                onClick={onProjectLinksSave}
                size="small"
              >
                {isSavingProjectLinks ? "保存中..." : "保存"}
              </Button>
              <Button
                data-testid="project-links-cancel-button"
                onClick={onProjectLinksCancel}
                size="small"
                variant="secondary"
              >
                キャンセル
              </Button>
            </div>
            {projectLinksError ? (
              <p className={styles.metaError}>{projectLinksError}</p>
            ) : null}
          </div>
        ) : (
          <div className={styles.projectLinksDisplay}>
            {project.projectLinks.length > 0 ? (
              <div className={styles.projectLinksList}>
                {project.projectLinks.map((link, index) => (
                  <a
                    key={`${link.label}-${link.url}-${index}`}
                    className={styles.externalLink}
                    data-testid={`project-link-anchor-${index}`}
                    href={link.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ) : (
              <strong
                className={styles.metaValue}
                data-testid="project-link-empty"
              >
                未設定
              </strong>
            )}
            <Button
              data-testid="project-links-edit-button"
              onClick={onProjectLinksEdit}
              size="small"
              variant="secondary"
            >
              編集
            </Button>
          </div>
        )}
      </MetaCard>

      <MetaCard className={styles.metaCardWide} label="状況">
        {isProjectStatusEntriesEditing ? (
          <div className={styles.phaseMetaEditor}>
            <div className={styles.statusEntryList}>
              {projectStatusEntriesDraft.map((entry, index) => (
                <div
                  className={styles.statusEntryRow}
                  key={`status-entry-${index}`}
                >
                  <label className={styles.formField}>
                    <span className={styles.visuallyHidden}>
                      状況日付 {index + 1}
                    </span>
                    <input
                      aria-label={`状況日付 ${index + 1}`}
                      className={styles.selectInput}
                      data-testid={`project-status-entry-date-${index}`}
                      onChange={(event) =>
                        onProjectStatusEntryDraftChange(index, {
                          date: event.target.value,
                        })
                      }
                      type="date"
                      value={entry.date}
                    />
                  </label>
                  <label
                    className={`${styles.formField} ${styles.statusEntryContentField}`}
                  >
                    <span className={styles.visuallyHidden}>
                      状況内容 {index + 1}
                    </span>
                    <textarea
                      aria-label={`状況内容 ${index + 1}`}
                      className={`${styles.selectInput} ${styles.statusEntryContentInput}`}
                      data-testid={`project-status-entry-content-${index}`}
                      onChange={(event) =>
                        onProjectStatusEntryDraftChange(index, {
                          content: event.target.value,
                        })
                      }
                      placeholder="状況の内容を入力してください"
                      value={entry.content}
                    />
                  </label>
                  <div className={styles.statusEntryRowActions}>
                    <Button
                      data-testid={`project-status-entry-move-up-${index}`}
                      disabled={index === 0}
                      onClick={() => onProjectStatusEntryMove(index, "up")}
                      size="small"
                      variant="secondary"
                    >
                      上へ
                    </Button>
                    <Button
                      data-testid={`project-status-entry-move-down-${index}`}
                      disabled={index === projectStatusEntriesDraft.length - 1}
                      onClick={() => onProjectStatusEntryMove(index, "down")}
                      size="small"
                      variant="secondary"
                    >
                      下へ
                    </Button>
                    <Button
                      data-testid={`project-status-entry-remove-${index}`}
                      onClick={() => onRemoveProjectStatusEntry(index)}
                      size="small"
                      variant="secondary"
                    >
                      削除
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.phaseMetaActions}>
              <Button
                data-testid="project-status-entry-add-button"
                onClick={onAddProjectStatusEntry}
                size="small"
                variant="secondary"
              >
                行追加
              </Button>
              <Button
                data-testid="project-status-entries-save-button"
                disabled={
                  isSavingProjectStatusEntries || !projectStatusEntriesChanged
                }
                onClick={onProjectStatusEntriesSave}
                size="small"
              >
                {isSavingProjectStatusEntries ? "保存中..." : "保存"}
              </Button>
              <Button
                data-testid="project-status-entries-cancel-button"
                onClick={onProjectStatusEntriesCancel}
                size="small"
                variant="secondary"
              >
                キャンセル
              </Button>
            </div>
            {projectStatusEntriesError ? (
              <p className={styles.metaError}>{projectStatusEntriesError}</p>
            ) : null}
          </div>
        ) : (
          <div className={styles.statusEntriesDisplay}>
            {project.statusEntries && project.statusEntries.length > 0 ? (
              <>
                <div className={styles.statusEntriesToolbar}>
                  <Button
                    data-testid="project-status-entries-sort-button"
                    onClick={() =>
                      setStatusEntriesSortOrder((current) =>
                        current === "desc" ? "asc" : "desc",
                      )
                    }
                    size="small"
                    variant="secondary"
                  >
                    {statusEntriesSortOrder === "desc"
                      ? "日付: 新しい順"
                      : "日付: 古い順"}
                  </Button>
                </div>
                <div className={styles.statusEntriesList}>
                  {sortedStatusEntries.map((entry, index) => (
                    <div
                      className={styles.statusEntryCard}
                      key={`${entry.date}-${index}`}
                    >
                      <span className={styles.statusEntryDate}>
                        {entry.date}
                      </span>
                      <strong
                        className={styles.metaValue}
                        data-testid={`project-status-entry-value-${index}`}
                      >
                        {entry.content}
                      </strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <strong
                className={styles.metaValue}
                data-testid="project-status-entries-empty"
              >
                未設定
              </strong>
            )}
            <Button
              data-testid="project-status-entries-edit-button"
              onClick={onProjectStatusEntriesEdit}
              size="small"
              variant="secondary"
            >
              編集
            </Button>
          </div>
        )}
      </MetaCard>

      <MetaCard
        className={
          project.hasReportItems
            ? `${styles.metaCardStandard} ${styles.metaCardReport} ${styles.metaCardReportActive}`
            : `${styles.metaCardStandard} ${styles.metaCardReport}`
        }
        label="報告事項"
        testId="project-report-status-card"
      >
        {isProjectReportStatusEditing ? (
          <div className={styles.phaseMetaEditor}>
            <label className={styles.formField}>
              <span className={styles.visuallyHidden}>報告事項の有無</span>
              <select
                aria-label="報告事項の有無"
                className={styles.selectInput}
                data-testid="project-report-status-select"
                onChange={(event) =>
                  onProjectReportStatusDraftChange(
                    event.target.value === "true",
                  )
                }
                value={String(projectReportStatusDraft)}
              >
                <option value="false">なし</option>
                <option value="true">あり</option>
              </select>
            </label>
            <div className={styles.phaseMetaActions}>
              <Button
                data-testid="project-report-status-save-button"
                disabled={
                  isSavingProjectReportStatus || !projectReportStatusChanged
                }
                onClick={onProjectReportStatusSave}
                size="small"
              >
                {isSavingProjectReportStatus ? "保存中..." : "保存"}
              </Button>
              <Button
                data-testid="project-report-status-cancel-button"
                onClick={onProjectReportStatusCancel}
                size="small"
                variant="secondary"
              >
                キャンセル
              </Button>
            </div>
            {projectReportStatusError ? (
              <p className={styles.metaError}>{projectReportStatusError}</p>
            ) : null}
          </div>
        ) : (
          <div className={styles.phaseMetaDisplay}>
            <strong
              className={styles.metaValue}
              data-testid="project-report-status-value"
            >
              {project.hasReportItems ? "あり" : "なし"}
            </strong>
            <Button
              data-testid="project-report-status-edit-button"
              onClick={onProjectReportStatusEdit}
              size="small"
              variant="secondary"
            >
              編集
            </Button>
          </div>
        )}
      </MetaCard>
    </div>
  );
}
