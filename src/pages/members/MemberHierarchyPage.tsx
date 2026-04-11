import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Connection } from "@xyflow/react";
import { MemberHierarchyFlow } from "../../components/MemberHierarchyFlow";
import { MemberHierarchyTree } from "../../components/MemberHierarchyTree";
import { ListPageHero } from "../../components/ListPageHero";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { useProjectData } from "../../store/useProjectData";
import type { Member, UpdateMemberInput } from "../../types/project";
import formStyles from "../../styles/form.module.css";
import pageStyles from "../../styles/page.module.css";
import styles from "./MemberHierarchyPage.module.css";

type HierarchyViewMode = "tree" | "flow" | "pyramid";

interface MemberLevelCardProps {
  member: Member;
  isSelected: boolean;
  isPathNode: boolean;
}

interface HierarchyGroup {
  member: Member;
  children: HierarchyGroup[];
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
    </article>
  );
}

function renderHierarchyGroup(group: HierarchyGroup, selectedMemberId: string) {
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

function buildHierarchyLevels(members: Member[], selectedMemberId: string) {
  const memberById = new Map(members.map((member) => [member.id, member]));
  const selectedMember = memberById.get(selectedMemberId);

  if (!selectedMember) {
    return null;
  }

  const childrenByManagerId = new Map<string | null, Member[]>();

  members.forEach((member) => {
    const bucket = childrenByManagerId.get(member.managerId) ?? [];
    bucket.push(member);
    childrenByManagerId.set(member.managerId, bucket);
  });

  childrenByManagerId.forEach((bucket, managerId) => {
    childrenByManagerId.set(
      managerId,
      [...bucket].sort((left, right) =>
        left.name.localeCompare(right.name, "ja"),
      ),
    );
  });

  const lineage: Member[] = [];
  let cursor: Member | undefined = selectedMember;

  while (cursor) {
    lineage.unshift(cursor);
    cursor = cursor.managerId ? memberById.get(cursor.managerId) : undefined;
  }

  function buildHierarchyGroup(member: Member): HierarchyGroup {
    return {
      member,
      children: (childrenByManagerId.get(member.id) ?? []).map((child) =>
        buildHierarchyGroup(child),
      ),
    };
  }

  return {
    lineage,
    descendantGroups: (childrenByManagerId.get(selectedMember.id) ?? []).map(
      (child) => buildHierarchyGroup(child),
    ),
  };
}

function createsCycle(
  members: Member[],
  memberId: string,
  nextManagerId: string,
) {
  const memberById = new Map(members.map((member) => [member.id, member]));
  let cursor = memberById.get(nextManagerId);

  while (cursor) {
    if (cursor.id === memberId) {
      return true;
    }

    cursor = cursor.managerId ? memberById.get(cursor.managerId) : undefined;
  }

  return false;
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
    lineLabel: member.lineLabel,
    managerId,
  };
}

export function MemberHierarchyPage() {
  const { members, isLoading, error, updateMember } = useProjectData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<HierarchyViewMode>("flow");
  const [relationshipMessage, setRelationshipMessage] = useState<string | null>(
    null,
  );
  const [relationshipError, setRelationshipError] = useState<string | null>(
    null,
  );
  const [isSavingRelation, setIsSavingRelation] = useState(false);

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
      ].sort((left, right) => left.localeCompare(right, "ja")),
    [sortedMembers],
  );

  const requestedDepartmentName = searchParams.get("departmentName") ?? "";
  const requestedMemberId = searchParams.get("memberId") ?? "";

  const visibleMembers = useMemo(
    () =>
      requestedDepartmentName
        ? sortedMembers.filter(
            (member) => member.departmentName === requestedDepartmentName,
          )
        : sortedMembers,
    [requestedDepartmentName, sortedMembers],
  );

  const activeMemberId =
    requestedMemberId &&
    visibleMembers.some((member) => member.id === requestedMemberId)
      ? requestedMemberId
      : (visibleMembers[0]?.id ?? "");

  const hierarchyLevels = useMemo(
    () => buildHierarchyLevels(visibleMembers, activeMemberId),
    [activeMemberId, visibleMembers],
  );

  const topLevelCount = useMemo(
    () => visibleMembers.filter((member) => !member.managerId).length,
    [visibleMembers],
  );

  const roleCount = useMemo(
    () =>
      new Set(
        visibleMembers.map((member) => member.role.trim()).filter(Boolean),
      ).size,
    [visibleMembers],
  );

  function updateHierarchyParams(next: {
    departmentName?: string;
    memberId?: string;
  }) {
    const params = new URLSearchParams();

    if (next.departmentName) {
      params.set("departmentName", next.departmentName);
    }

    if (next.memberId) {
      params.set("memberId", next.memberId);
    }

    setSearchParams(params);
  }

  async function handleManagerConnect(connection: Connection) {
    const nextManagerId = connection.source;
    const memberId = connection.target;

    setRelationshipMessage(null);
    setRelationshipError(null);

    if (!nextManagerId || !memberId) {
      setRelationshipError("接続元と接続先を正しく指定してください。");
      return;
    }

    if (nextManagerId === memberId) {
      setRelationshipError("自分自身を上司には設定できません。");
      return;
    }

    const visibleMemberIds = new Set(visibleMembers.map((member) => member.id));
    if (
      !visibleMemberIds.has(nextManagerId) ||
      !visibleMemberIds.has(memberId)
    ) {
      setRelationshipError("表示中の部署メンバー同士だけ接続できます。");
      return;
    }

    const member = members.find((item) => item.id === memberId);
    const nextManager = members.find((item) => item.id === nextManagerId);

    if (!member || !nextManager) {
      setRelationshipError("接続対象のメンバーが見つかりません。");
      return;
    }

    if (member.managerId === nextManagerId) {
      setRelationshipMessage(
        `${member.name} はすでに ${nextManager.name} 配下です。`,
      );
      return;
    }

    if (createsCycle(members, memberId, nextManagerId)) {
      setRelationshipError(
        "循環する上下関係になるため、この接続はできません。",
      );
      return;
    }

    setIsSavingRelation(true);

    try {
      await updateMember(
        member.id,
        buildUpdateMemberInput(member, nextManagerId),
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
        description="メンバーを起点に上下関係を表示できます。部署を絞ってから、関係表示、フロー表示、階層図を切り替えながら確認できます。"
        eyebrow="Organization View"
        iconKind="member"
        storageKey="project-master:hero-collapsed:member-hierarchy"
        stats={[
          {
            label: requestedDepartmentName ? "表示メンバー" : "登録メンバー",
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
              <select
                className={formStyles.control}
                data-testid="member-hierarchy-department-select"
                onChange={(event) => {
                  const departmentName = event.target.value;
                  const nextVisibleMembers = departmentName
                    ? sortedMembers.filter(
                        (member) => member.departmentName === departmentName,
                      )
                    : sortedMembers;
                  const nextMemberId = nextVisibleMembers.some(
                    (member) => member.id === activeMemberId,
                  )
                    ? activeMemberId
                    : (nextVisibleMembers[0]?.id ?? "");

                  updateHierarchyParams({
                    departmentName,
                    memberId: nextMemberId,
                  });
                  setRelationshipMessage(null);
                  setRelationshipError(null);
                }}
                value={requestedDepartmentName}
              >
                <option value="">全部署</option>
                {departmentOptions.map((departmentName) => (
                  <option key={departmentName} value={departmentName}>
                    {departmentName}
                  </option>
                ))}
              </select>
            </label>

            <label className={formStyles.field}>
              <span className={formStyles.label}>対象メンバー</span>
              <select
                className={formStyles.control}
                data-testid="member-hierarchy-select"
                onChange={(event) => {
                  updateHierarchyParams({
                    departmentName: requestedDepartmentName,
                    memberId: event.target.value,
                  });
                  setRelationshipMessage(null);
                  setRelationshipError(null);
                }}
                value={activeMemberId}
              >
                {visibleMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
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
              ]
                .filter(Boolean)
                .join(" ")}
              data-testid="member-hierarchy-view-flow"
              onClick={() => setViewMode("flow")}
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

          {viewMode === "flow" ? (
            <div className={styles.flowAssist}>
              <p className={styles.flowAssistText}>
                ノード下部の丸から別ノード上部の丸へドラッグすると、表示中のメンバー同士で上下関係を変更できます。
              </p>
              {isSavingRelation ? (
                <p className={styles.flowPending}>上下関係を保存中です...</p>
              ) : null}
              {relationshipMessage ? (
                <p className={styles.flowSuccess}>{relationshipMessage}</p>
              ) : null}
              {relationshipError ? (
                <p className={styles.flowError}>{relationshipError}</p>
              ) : null}
            </div>
          ) : null}

          {visibleMembers.length === 0 ? (
            <p className={styles.emptyText}>
              指定した部署に表示対象のメンバーがいません。
            </p>
          ) : viewMode === "tree" ? (
            <MemberHierarchyTree
              members={visibleMembers}
              selectedMemberId={activeMemberId}
            />
          ) : viewMode === "flow" ? (
            <MemberHierarchyFlow
              isEditable={!isSavingRelation}
              members={visibleMembers}
              onManagerConnect={handleManagerConnect}
              selectedMemberId={activeMemberId}
            />
          ) : hierarchyLevels ? (
            <div
              className={styles.pyramidWrap}
              data-testid="member-hierarchy-pyramid"
            >
              <div className={styles.pyramidLegend}>
                <span>
                  上位から対象メンバー、その配下メンバーまで段階的に表示します。
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
          ) : (
            <p className={styles.emptyText}>
              表示対象のメンバーを選択してください。
            </p>
          )}
        </div>
      </Panel>
    </div>
  );
}
