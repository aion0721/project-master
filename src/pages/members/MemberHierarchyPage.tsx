import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { Connection } from "@xyflow/react";
import type { MemberHierarchyFlowHandle } from "../../components/MemberHierarchyFlow";
import { MemberHierarchyFlowFallback } from "../../components/MemberHierarchyFlowFallback";
import { MemberHierarchyTree } from "../../components/MemberHierarchyTree";
import { ListPageHero } from "../../components/ListPageHero";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { SearchSelect } from "../../components/ui/SearchSelect";
import { useProjectData } from "../../store/useProjectData";
import type { Member, UpdateMemberInput } from "../../types/project";
import { validateHierarchyConnection } from "../../utils/hierarchyConnectionUtils";
import {
  buildMemberHierarchyLevels,
  createsMemberHierarchyCycle,
  type MemberHierarchyNode,
} from "../../utils/memberHierarchyUtils";
import formStyles from "../../styles/form.module.css";
import pageStyles from "../../styles/page.module.css";
import styles from "./MemberHierarchyPage.module.css";

const MemberHierarchyFlow = lazy(() =>
  import("../../components/MemberHierarchyFlow").then((module) => ({
    default: module.MemberHierarchyFlow,
  })),
);

type HierarchyViewMode = "tree" | "flow" | "pyramid";
const flowMemberLimit = 1000;

interface MemberLevelCardProps {
  member: Member;
  isSelected: boolean;
  isPathNode: boolean;
}

function renderMemberLevelCard({
  member,
  isSelected,
  isPathNode,
}: MemberLevelCardProps) {
  return (
    <article
      className={[
        styles.levelCard,
        isSelected ? styles.selectedCard : "",
        isPathNode ? styles.pathCard : "",
      ]
        .filter(Boolean)
        .join(" ")}
      key={member.id}
    >
      <div className={styles.levelCardHeader}>
        <div className={styles.memberNameRow}>
          <span className={styles.memberName}>{member.name}</span>
          {isSelected ? (
            <span className={styles.selectedBadge}>選択中</span>
          ) : null}
        </div>
        <div className={styles.memberMeta}>
          <span>{member.id}</span>
          <span>{member.departmentName}</span>
          <span>{member.role}</span>
        </div>
      </div>
      <Link className={styles.levelCardLink} to={`/members/${member.id}`}>
        個人ページへ
      </Link>
    </article>
  );
}

function renderHierarchyGroup(group: MemberHierarchyNode, selectedMemberId?: string) {
  return (
    <div
      className={styles.groupNode}
      data-testid={`member-hierarchy-group-${group.member.id}`}
      key={group.member.id}
    >
      {renderMemberLevelCard({
        member: group.member,
        isSelected: group.member.id === selectedMemberId,
        isPathNode: false,
      })}

      {group.children.length > 0 ? (
        <div className={styles.groupChildrenSection}>
          <div aria-hidden="true" className={styles.groupConnector}>
            <span className={styles.groupConnectorLine} />
          </div>
          <div className={styles.groupChildrenRow}>
            {group.children.map((child) =>
              renderHierarchyGroup(child, selectedMemberId),
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function buildUpdateMemberInput(
  member: Member,
  managerId: string,
): UpdateMemberInput {
  return {
    name: member.name,
    departmentCode: member.departmentCode,
    departmentName: member.departmentName,
    role: member.role,
    tags: member.tags,
    lineLabel: member.lineLabel,
    managerId,
  };
}

export function MemberHierarchyPage() {
  const { members, isLoading, error, updateMember } = useProjectData();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedDepartmentName = searchParams.get("departmentName") ?? "";
  const requestedTag = searchParams.get("tag") ?? "";
  const [viewMode, setViewMode] = useState<HierarchyViewMode>(
    requestedDepartmentName || requestedTag ? "flow" : "tree",
  );
  const [relationshipMessage, setRelationshipMessage] = useState<string | null>(
    null,
  );
  const [relationshipError, setRelationshipError] = useState<string | null>(
    null,
  );
  const [isSavingRelation, setIsSavingRelation] = useState(false);
  const [isExportingFlowPdf, setIsExportingFlowPdf] = useState(false);
  const [flowExportError, setFlowExportError] = useState<string | null>(null);
  const flowRef = useRef<MemberHierarchyFlowHandle | null>(null);
  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );

  const sortedMembers = useMemo(
    () =>
      [...members].sort((left, right) =>
        left.name.localeCompare(right.name, "ja"),
      ),
    [members],
  );

  const departmentOptions = useMemo(
    () =>
      [
        ...new Set(
          sortedMembers
            .map((member) => member.departmentName.trim())
            .filter(Boolean),
        ),
      ]
        .sort((left, right) => left.localeCompare(right, "ja"))
        .map((departmentName) => ({
          value: departmentName,
          label: departmentName,
        })),
    [sortedMembers],
  );

  const tagOptions = useMemo(
    () =>
      [...new Set(sortedMembers.flatMap((member) => member.tags.map((tag) => tag.trim())).filter(Boolean))]
        .sort((left, right) => left.localeCompare(right, "ja"))
        .map((tag) => ({
          value: tag,
          label: tag,
        })),
    [sortedMembers],
  );

  const requestedMemberId = searchParams.get("memberId") ?? "";

  const visibleMembers = useMemo(
    () =>
      sortedMembers.filter((member) => {
        const matchesDepartment =
          !requestedDepartmentName || member.departmentName === requestedDepartmentName;
        const matchesTag = !requestedTag || member.tags.includes(requestedTag);

        return matchesDepartment && matchesTag;
      }),
    [requestedDepartmentName, requestedTag, sortedMembers],
  );

  const activeMemberId =
    requestedMemberId &&
    visibleMembers.some((member) => member.id === requestedMemberId)
      ? requestedMemberId
      : undefined;

  const hierarchyLevels = useMemo(
    () => buildMemberHierarchyLevels(visibleMembers, activeMemberId),
    [activeMemberId, visibleMembers],
  );

  const topLevelCount = useMemo(
    () => {
      const visibleMemberIds = new Set(visibleMembers.map((member) => member.id));
      return visibleMembers.filter(
        (member) => !member.managerId || !visibleMemberIds.has(member.managerId),
      ).length;
    },
    [visibleMembers],
  );

  const roleCount = useMemo(
    () =>
      new Set(
        visibleMembers.map((member) => member.role.trim()).filter(Boolean),
      ).size,
    [visibleMembers],
  );
  const isFilterSelected =
    requestedDepartmentName.trim().length > 0 || requestedTag.trim().length > 0;
  const canRenderFlow = isFilterSelected && visibleMembers.length <= flowMemberLimit;

  useEffect(() => {
    if (!canRenderFlow && viewMode === "flow") {
      setViewMode("tree");
    }
  }, [canRenderFlow, viewMode]);

  function updateHierarchyParams(next: {
    departmentName?: string;
    tag?: string;
    memberId?: string;
  }) {
    const params = new URLSearchParams();

    if (next.departmentName) {
      params.set("departmentName", next.departmentName);
    }

    if (next.tag) {
      params.set("tag", next.tag);
    }

    if (next.memberId) {
      params.set("memberId", next.memberId);
    }

    setSearchParams(params);
  }

  async function handleExportFlowPdf() {
    if (!flowRef.current || isExportingFlowPdf) {
      return;
    }

    setFlowExportError(null);
    setIsExportingFlowPdf(true);

    try {
      await flowRef.current.exportPdf();
    } catch (caughtError) {
      setFlowExportError(
        caughtError instanceof Error
          ? caughtError.message
          : "PDF の出力に失敗しました。",
      );
    } finally {
      setIsExportingFlowPdf(false);
    }
  }

  async function handleManagerConnect(connection: Connection) {
    const visibleMemberIds = new Set(visibleMembers.map((member) => member.id));
    const validation = validateHierarchyConnection({
      memberId: connection.target,
      managerId: connection.source,
      availableIds: visibleMemberIds,
      entityExists: (id) => memberById.has(id),
      getEntityLabel: (id) => memberById.get(id)?.name ?? id,
      getCurrentManagerId: (memberId) => memberById.get(memberId)?.managerId,
      createsCycle: (memberId, managerId) =>
        createsMemberHierarchyCycle(members, memberId, managerId),
      messages: {
        missingConnection: "接続元と接続先を正しく指定してください。",
        selfReference: "自分自身を上司には設定できません。",
        unavailableConnection: "表示中のメンバー同士だけ接続できます。",
        entityNotFound: "接続対象のメンバーが見つかりません。",
        cycleDetected: "循環する上下関係になるため、この接続はできません。",
        duplicateConnection: (memberLabel, managerLabel) =>
          `${memberLabel} はすでに ${managerLabel} 配下です。`,
      },
    });

    setRelationshipMessage(null);
    setRelationshipError(null);

    if (validation.kind === "error") {
      setRelationshipError(validation.message);
      return;
    }

    if (validation.kind === "noop") {
      setRelationshipMessage(validation.message);
      return;
    }

    const member = memberById.get(validation.memberId);
    const nextManager = memberById.get(validation.managerId);

    if (!member || !nextManager) {
      setRelationshipError("接続対象のメンバーが見つかりません。");
      return;
    }

    setIsSavingRelation(true);

    try {
      await updateMember(
        member.id,
        buildUpdateMemberInput(member, validation.managerId),
      );
      setRelationshipMessage(
        `${member.name} の上司を ${nextManager.name} に更新しました。`,
      );
    } catch (caughtError) {
      setRelationshipError(
        caughtError instanceof Error
          ? caughtError.message
          : "上下関係の更新に失敗しました。",
      );
    } finally {
      setIsSavingRelation(false);
    }
  }

  if (isLoading) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>体制図を読み込み中です</h1>
        <p className={pageStyles.emptyStateText}>
          メンバー情報の取得が完了するまで少し待ってください。
        </p>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>
          体制図を表示できませんでした
        </h1>
        <p className={pageStyles.emptyStateText}>{error}</p>
      </Panel>
    );
  }

  return (
    <div className={pageStyles.page}>
      <ListPageHero
        action={<Button to="/members">メンバー一覧</Button>}
        className={styles.hero}
        collapsible
        description="メンバーを起点に上下関係を表示できます。部署やタグで絞ってから、関係表示、フロー表示、階層図を切り替えながら確認できます。"
        eyebrow="Organization View"
        iconKind="member"
        storageKey="project-master:hero-collapsed:member-hierarchy"
        stats={[
          {
            label: isFilterSelected ? "表示メンバー" : "登録メンバー",
            value: visibleMembers.length,
          },
          { label: "最上位ノード", value: topLevelCount },
          { label: "ロール種別", value: roleCount },
        ]}
        title="メンバー体制図"
      />

      <Panel>
        <div className={pageStyles.sectionHeader}>
          <div>
            <h2 className={pageStyles.sectionTitle}>関係表示</h2>
            <p className={pageStyles.sectionDescription}>
              `managerId`
              を使った上下関係を表示します。案件体制とは別のビューです。
            </p>
          </div>
        </div>

        <div className={styles.hierarchySection}>
          <div className={styles.filterGrid}>
            <label className={formStyles.field}>
              <span className={formStyles.label}>部署名</span>
              <SearchSelect
                ariaLabel="部署名で絞り込み"
                className={formStyles.control}
                dataTestId="member-hierarchy-department-select"
                emptyMessage="該当する部署はありません"
                onChange={(departmentName) => {
                  updateHierarchyParams({
                    departmentName,
                    tag: requestedTag,
                  });
                  setRelationshipMessage(null);
                  setRelationshipError(null);
                }}
                options={departmentOptions}
                placeholder="部署を検索して選択"
                value={requestedDepartmentName}
              />
            </label>
            <label className={formStyles.field}>
              <span className={formStyles.label}>タグ</span>
              <SearchSelect
                ariaLabel="タグで絞り込み"
                className={formStyles.control}
                dataTestId="member-hierarchy-tag-select"
                emptyMessage="該当するタグはありません"
                onChange={(tag) => {
                  updateHierarchyParams({
                    departmentName: requestedDepartmentName,
                    tag,
                  });
                  setRelationshipMessage(null);
                  setRelationshipError(null);
                }}
                options={tagOptions}
                placeholder="タグを検索して選択"
                value={requestedTag}
              />
            </label>
          </div>

          <div
            aria-label="体制図の表示切替"
            className={styles.viewToggle}
            role="group"
          >
            <button
              aria-pressed={viewMode === "tree"}
              className={[
                styles.viewToggleButton,
                viewMode === "tree" ? styles.viewToggleButtonActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              data-testid="member-hierarchy-view-tree"
              onClick={() => setViewMode("tree")}
              type="button"
            >
              ツリー
            </button>
            <button
              aria-pressed={viewMode === "flow"}
              className={[
                styles.viewToggleButton,
                viewMode === "flow" ? styles.viewToggleButtonActive : "",
                !canRenderFlow ? styles.viewToggleButtonDisabled : "",
              ]
                .filter(Boolean)
                .join(" ")}
              data-testid="member-hierarchy-view-flow"
              disabled={!canRenderFlow}
              onClick={() => setViewMode("flow")}
              title={
                canRenderFlow
                  ? undefined
                  : isFilterSelected
                    ? `表示件数が多いため、フロー表示は ${flowMemberLimit} 名以下で利用してください。`
                    : "フロー表示は部署またはタグを選択してから利用してください。"
              }
              type="button"
            >
              フロー
            </button>
            <button
              aria-pressed={viewMode === "pyramid"}
              className={[
                styles.viewToggleButton,
                viewMode === "pyramid" ? styles.viewToggleButtonActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              data-testid="member-hierarchy-view-pyramid"
              onClick={() => setViewMode("pyramid")}
              type="button"
            >
              階層図
            </button>
          </div>

          {isFilterSelected && !canRenderFlow ? (
            <div className={styles.flowGuard}>
              <p className={styles.flowGuardTitle}>
                {"表示件数が多いため、フロー表示を停止しました。"}
              </p>
              <p className={styles.flowGuardText}>
                {`現在 ${visibleMembers.length} 名を表示しています。条件をさらに絞るか、ツリー表示・階層図で確認してください。`}
              </p>
            </div>
          ) : null}

          {viewMode === "flow" ? (
            <div className={styles.flowAssist}>
              <div className={styles.flowAssistHeader}>
                <p className={styles.flowAssistText}>
                  ノード下部の丸から別ノード上部の丸へドラッグすると、表示中のメンバー同士で上下関係を変更できます。部署やタグで絞ると、その条件に合うメンバーをまとめて編集できます。
                </p>
                <Button
                  className={styles.flowExportButton}
                  data-testid="member-hierarchy-export-pdf"
                  disabled={isSavingRelation || isExportingFlowPdf}
                  onClick={handleExportFlowPdf}
                  size="small"
                  variant="secondary"
                >
                  {isExportingFlowPdf ? "PDF 出力中..." : "PDF 出力"}
                </Button>
              </div>
              {isSavingRelation ? (
                <p className={styles.flowPending}>上下関係を保存中です...</p>
              ) : null}
              {isExportingFlowPdf ? (
                <p className={styles.flowPending}>
                  表示中の体制図を PDF に変換しています...
                </p>
              ) : null}
              {relationshipMessage ? (
                <p className={styles.flowSuccess}>{relationshipMessage}</p>
              ) : null}
              {relationshipError ? (
                <p className={styles.flowError}>{relationshipError}</p>
              ) : null}
              {flowExportError ? (
                <p className={styles.flowError}>{flowExportError}</p>
              ) : null}
            </div>
          ) : null}

          {!isFilterSelected ? (
            <p className={styles.emptyText}>
              部署またはタグを選択すると、該当メンバーの体制を表示できます。
            </p>
          ) : visibleMembers.length === 0 ? (
            <p className={styles.emptyText}>
              指定した条件に一致する表示対象のメンバーがいません。
            </p>
          ) : viewMode === "tree" ? (
            <MemberHierarchyTree
              members={visibleMembers}
              selectedMemberId={activeMemberId}
            />
          ) : viewMode === "flow" ? (
            <Suspense
              fallback={
                <MemberHierarchyFlowFallback message="フロー表示を準備しています..." />
              }
            >
              <MemberHierarchyFlow
                ref={flowRef}
                isEditable={!isSavingRelation}
                members={visibleMembers}
                onManagerConnect={handleManagerConnect}
                selectedMemberId={activeMemberId}
              />
            </Suspense>
          ) : hierarchyLevels ? (
            <div
              className={styles.pyramidWrap}
              data-testid="member-hierarchy-pyramid"
            >
              <div className={styles.pyramidLegend}>
                <span>
                  {activeMemberId
                    ? "上位から対象メンバー、その配下メンバーまで段階的に表示します。"
                    : "表示中メンバーの上下関係を階層図として表示します。"}
                </span>
              </div>

              <div className={styles.pyramidLevels}>
                {hierarchyLevels.lineage.map((member, index) => (
                  <div className={styles.levelRow} key={member.id}>
                    {renderMemberLevelCard({
                      member,
                      isSelected: member.id === activeMemberId,
                      isPathNode: true,
                    })}
                    {index < hierarchyLevels.lineage.length - 1 ? (
                      <div aria-hidden="true" className={styles.levelConnector}>
                        <span className={styles.levelConnectorLine} />
                        <span className={styles.levelConnectorArrow}>↓</span>
                      </div>
                    ) : null}
                  </div>
                ))}

                {hierarchyLevels.descendantGroups.length > 0 ? (
                  <div className={styles.descendantBlock}>
                    <div aria-hidden="true" className={styles.branchConnector}>
                      <span className={styles.branchConnectorLine} />
                    </div>
                    <div
                      className={styles.descendantRow}
                      data-testid="member-hierarchy-descendant-groups"
                    >
                      {hierarchyLevels.descendantGroups.map((group) =>
                        renderHierarchyGroup(group, activeMemberId),
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
