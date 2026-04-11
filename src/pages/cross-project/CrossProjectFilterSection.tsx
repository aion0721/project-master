import { Link } from "react-router-dom";
import { ListPageFilterSection } from "../../components/ListPageFilterSection";
import { Button } from "../../components/ui/Button";
import type { Member, Project } from "../../types/project";
import { allWorkStatuses } from "../../utils/userPreferences";
import { getViewModeButtonClassName } from "./crossProjectViewHelpers";
import type { CrossProjectViewMode } from "./useCrossProjectView";
import styles from "./CrossProjectViewPage.module.css";

interface CrossProjectFilterSectionProps {
  currentUser: Member | null;
  isFilterVisible: boolean;
  isSavingDefaults: boolean;
  keyword: string;
  saveFeedback: string | null;
  selectedStatuses: Project["status"][];
  selectedSystemLabel: string | null;
  setKeyword: (value: string) => void;
  setViewMode: (mode: CrossProjectViewMode) => void;
  handleSaveDefaults: () => Promise<void>;
  handleStatusToggle: (status: Project["status"]) => void;
  viewMode: CrossProjectViewMode;
}

export function CrossProjectFilterSection({
  currentUser,
  isFilterVisible,
  isSavingDefaults,
  keyword,
  saveFeedback,
  selectedStatuses,
  selectedSystemLabel,
  setKeyword,
  setViewMode,
  handleSaveDefaults,
  handleStatusToggle,
  viewMode,
}: CrossProjectFilterSectionProps) {
  return (
    <ListPageFilterSection
      className={styles.controls}
      topRow={
        <div className={styles.filterTopRow}>
          <div className={styles.toggleGroup}>
            <button
              className={getViewModeButtonClassName(viewMode === "all", styles)}
              onClick={() => setViewMode("all")}
              type="button"
            >
              {"全案件"}
            </button>
            <button
              className={getViewModeButtonClassName(
                viewMode === "bookmarks",
                styles,
              )}
              disabled={!currentUser}
              onClick={() => setViewMode("bookmarks")}
              type="button"
            >
              {"ブックマーク"}
            </button>
          </div>

          <p className={styles.filterHint}>
            {currentUser
              ? `${currentUser.name} さんのブックマーク ${currentUser.bookmarkedProjectIds.length} 件`
              : "利用メンバーを選ぶと、ブックマーク案件だけに切り替えられます。"}
          </p>

          <label className={styles.searchField}>
            <span className={styles.searchLabel}>{"案件フィルター"}</span>
            <input
              aria-label={"プロジェクト番号または案件名でフィルター"}
              className={styles.searchInput}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={"例: PRJ-001 / 販売管理刷新"}
              type="search"
              value={keyword}
            />
          </label>
        </div>
      }
      summary={
        <div className={styles.filterSummaryRow}>
          <div className={styles.filterSummaryHeading}>
            <p className={styles.statusFilterTitle}>{"状態フィルター"}</p>
            <p className={styles.statusFilterHint}>
              {
                "横断表示では複数案件を同時に比較します。不要な状態を外すと、見たい案件に集中できます。"
              }
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
              {"主システム絞り込み中"}: {selectedSystemLabel}{" "}
              <Link className={styles.projectLink} to="/cross-project">
                {"解除"}
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
      visible={isFilterVisible}
    />
  );
}
