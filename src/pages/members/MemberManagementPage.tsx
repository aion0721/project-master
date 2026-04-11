import { useMemo, useState } from "react";
import { ListPageContentSection } from "../../components/ListPageContentSection";
import { ListPageFilterSection } from "../../components/ListPageFilterSection";
import { ListPageHero } from "../../components/ListPageHero";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";
import { SearchSelect } from "../../components/ui/SearchSelect";
import { useProjectData } from "../../store/useProjectData";
import pageStyles from "../../styles/page.module.css";
import formStyles from "../../styles/form.module.css";
import { formatMemberShortLabel } from "./memberFormUtils";
import styles from "./MemberManagementPage.module.css";

export function MemberManagementPage() {
  const {
    members,
    projects,
    assignments,
    isLoading,
    error,
    deleteMember,
  } = useProjectData();
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const memberById = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members],
  );

  const projectCountByMemberId = useMemo(() => {
    const projectIdsByMember = new Map<string, Set<string>>();

    projects.forEach((project) => {
      const bucket =
        projectIdsByMember.get(project.pmMemberId) ?? new Set<string>();
      bucket.add(project.projectNumber);
      projectIdsByMember.set(project.pmMemberId, bucket);
    });

    assignments.forEach((assignment) => {
      const bucket =
        projectIdsByMember.get(assignment.memberId) ?? new Set<string>();
      bucket.add(assignment.projectId);
      projectIdsByMember.set(assignment.memberId, bucket);
    });

    return new Map(
      [...projectIdsByMember.entries()].map(([memberId, projectIds]) => [
        memberId,
        projectIds.size,
      ]),
    );
  }, [assignments, projects]);

  const sortedMembers = useMemo(
    () =>
      [...members].sort((left, right) =>
        left.name.localeCompare(right.name, "ja"),
      ),
    [members],
  );

  const roleOptions = useMemo(
    () =>
      [
        ...new Set(members.map((member) => member.role.trim()).filter(Boolean)),
      ].sort((left, right) => left.localeCompare(right, "ja")),
    [members],
  );

  const keywordOptions = useMemo(() => {
    const values = new Map<string, { value: string; label: string }>();

    sortedMembers.forEach((member) => {
      values.set(`member:${member.id}`, {
        value: member.id,
        label: `${member.id} / ${member.name}`,
      });
      values.set(`department:${member.departmentName}`, {
        value: member.departmentName,
        label: member.departmentName,
      });
    });

    return [...values.values()];
  }, [sortedMembers]);

  const roleSearchOptions = useMemo(
    () =>
      roleOptions.map((role) => ({
        value: role,
        label: role,
      })),
    [roleOptions],
  );

  const filteredMembers = useMemo(() => {
    const normalizedKeyword = filterKeyword.trim().toLowerCase();

    return sortedMembers.filter((member) => {
      const searchableText =
        `${member.id} ${member.departmentName}`.toLowerCase();
      const matchesKeyword =
        !normalizedKeyword || searchableText.includes(normalizedKeyword);
      const matchesRole = !filterRole || member.role === filterRole;

      return matchesKeyword && matchesRole;
    });
  }, [filterKeyword, filterRole, sortedMembers]);

  const memberSummary = useMemo(
    () => ({
      total: members.length,
      assigned: members.filter(
        (member) => (projectCountByMemberId.get(member.id) ?? 0) > 0,
      ).length,
      roles: roleOptions.length,
    }),
    [members, projectCountByMemberId, roleOptions.length],
  );

  async function handleDelete(memberId: string) {
    const member = memberById.get(memberId);

    if (
      !window.confirm(
        `メンバー ${member?.id ?? memberId} / ${member?.name ?? ""} を削除しますか？`,
      )
    ) {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await deleteMember(memberId);
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error
          ? caughtError.message
          : "メンバーの削除に失敗しました。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>
          メンバー一覧を読み込み中です
        </h1>
        <p className={pageStyles.emptyStateText}>
          バックエンドからメンバー情報を取得しています。
        </p>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>
          メンバー一覧を表示できませんでした
        </h1>
        <p className={pageStyles.emptyStateText}>{error}</p>
      </Panel>
    );
  }

  const keywordSummary = filterKeyword.trim()
    ? ` / "${filterKeyword.trim()}"`
    : "";
  const roleSummary = filterRole ? ` / ${filterRole}` : "";
  const filterSummaryText = `${filteredMembers.length} 件表示${roleSummary}${keywordSummary}`;

  return (
    <div className={pageStyles.page}>
      <ListPageHero
        action={<Button to="/members/new">新規メンバー</Button>}
        className={styles.hero}
        collapsible
        description="利用中のメンバーを一覧で管理します。検索、ロール確認、上下関係の整理、担当案件数の確認をこの画面から行えます。"
        eyebrow="Member Directory"
        iconKind="member"
        storageKey="project-master:hero-collapsed:members"
        stats={[
          { label: "登録メンバー", value: memberSummary.total },
          { label: "担当案件あり", value: memberSummary.assigned },
          { label: "ロール種別", value: memberSummary.roles },
        ]}
        title="メンバー一覧"
      />

      <ListPageFilterSection
        className={styles.controls}
        topRow={
          <div className={styles.headerActions}>
            <label className={`${formStyles.field} ${styles.filterField}`}>
              <span className={formStyles.label}>絞り込み</span>
              <SearchSelect
                allowFreeText
                ariaLabel="メンバーIDまたは部署名で絞り込み"
                className={formStyles.control}
                onChange={setFilterKeyword}
                options={keywordOptions}
                placeholder="例: m1 / 営業本部"
                value={filterKeyword}
              />
            </label>
            <label className={`${formStyles.field} ${styles.filterField}`}>
              <span className={formStyles.label}>ロール</span>
              <SearchSelect
                ariaLabel="ロールで絞り込み"
                className={formStyles.control}
                onChange={setFilterRole}
                options={roleSearchOptions}
                placeholder="ロールを検索"
                value={filterRole}
              />
            </label>
          </div>
        }
        summary={
          <div className={styles.filterSummary}>
            <span className={styles.filterSummaryLabel}>表示件数</span>
            <span className={styles.filterSummaryValue}>
              {filterSummaryText}
            </span>
          </div>
        }
        visible={isFilterVisible}
      />

      <ListPageContentSection
        actions={
          <Button
            aria-expanded={isFilterVisible}
            onClick={() => setIsFilterVisible((current) => !current)}
            size="small"
            variant="secondary"
          >
            {isFilterVisible ? "絞り込みを非表示" : "絞り込みを表示"}
          </Button>
        }
        description="部署コード、ロール、上長、関連案件数を比較しながら確認できます。詳細画面から個別編集し、一覧では比較と導線確認に集中できます。"
        emptyState={
          filteredMembers.length === 0
            ? {
                title: "条件に一致するメンバーはありません",
                description:
                  "絞り込み条件やロールを見直して、表示されるメンバーを確認してください。",
              }
            : null
        }
        title="管理対象メンバー"
      >
        {submitError ? <p className={styles.errorText}>{submitError}</p> : null}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>メンバーID</th>
                <th>氏名</th>
                <th>部署コード</th>
                <th>部署名</th>
                <th>ロール</th>
                <th>上長</th>
                <th>関連案件数</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => {
                const manager = member.managerId
                  ? memberById.get(member.managerId)
                  : null;

                return (
                  <tr data-testid={`member-row-${member.id}`} key={member.id}>
                    <td className={styles.idCell}>{member.id}</td>
                    <td>{member.name}</td>
                    <td>{member.departmentCode}</td>
                    <td>{member.departmentName}</td>
                    <td>{member.role}</td>
                    <td>{manager ? formatMemberShortLabel(manager) : "未設定"}</td>
                    <td>{projectCountByMemberId.get(member.id) ?? 0}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <Button
                          size="small"
                          to={`/members/${member.id}`}
                          variant="secondary"
                        >
                          詳細
                        </Button>
                        <Button
                          data-testid={`delete-member-${member.id}`}
                          disabled={isSubmitting}
                          onClick={() => void handleDelete(member.id)}
                          size="small"
                          variant="danger"
                        >
                          削除
                        </Button>
                      </div>
                    </td>
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
