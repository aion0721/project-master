import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MemberHierarchyFlow } from '../../components/MemberHierarchyFlow'
import { ListPageContentSection } from '../../components/ListPageContentSection'
import { ListPageHero } from '../../components/ListPageHero'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import { useProjectData } from '../../store/useProjectData'
import pageStyles from '../../styles/page.module.css'
import styles from './MemberDetailPage.module.css'

interface RelatedProjectItem {
  projectNumber: string
  name: string
  roles: string[]
}

interface RelatedSystemItem {
  id: string
  name: string
  category: string
  roles: string[]
}

function formatManagerLabel(name: string | undefined) {
  return name ?? '未設定'
}

export function MemberDetailPage() {
  const { memberId } = useParams()
  const { members, projects, assignments, systems, systemAssignments, isLoading, error, getMemberById } =
    useProjectData()

  const member = memberId ? getMemberById(memberId) : undefined

  const manager = useMemo(
    () => (member?.managerId ? members.find((item) => item.id === member.managerId) : undefined),
    [member, members],
  )

  const directReports = useMemo(
    () =>
      members
        .filter((item) => item.managerId === member?.id)
        .sort((left, right) => left.name.localeCompare(right.name, 'ja')),
    [member?.id, members],
  )

  const departmentMembers = useMemo(
    () =>
      member
        ? members
            .filter((item) => item.departmentName === member.departmentName)
            .sort((left, right) => left.name.localeCompare(right.name, 'ja'))
        : [],
    [member, members],
  )

  const relatedProjects = useMemo<RelatedProjectItem[]>(() => {
    if (!member) {
      return []
    }

    const rolesByProjectId = new Map<string, Set<string>>()

    projects.forEach((project) => {
      if (project.pmMemberId === member.id) {
        const bucket = rolesByProjectId.get(project.projectNumber) ?? new Set<string>()
        bucket.add('PM')
        rolesByProjectId.set(project.projectNumber, bucket)
      }
    })

    assignments.forEach((assignment) => {
      if (assignment.memberId !== member.id) {
        return
      }

      const bucket = rolesByProjectId.get(assignment.projectId) ?? new Set<string>()
      bucket.add(assignment.responsibility)
      rolesByProjectId.set(assignment.projectId, bucket)
    })

    return [...rolesByProjectId.entries()]
      .map(([projectNumber, roles]) => {
        const project = projects.find((item) => item.projectNumber === projectNumber)

        if (!project) {
          return null
        }

        return {
          projectNumber: project.projectNumber,
          name: project.name,
          roles: [...roles],
        }
      })
      .filter((item): item is RelatedProjectItem => Boolean(item))
      .sort((left, right) => left.projectNumber.localeCompare(right.projectNumber, 'ja'))
  }, [assignments, member, projects])

  const relatedSystems = useMemo<RelatedSystemItem[]>(() => {
    if (!member) {
      return []
    }

    const rolesBySystemId = new Map<string, Set<string>>()

    systems.forEach((system) => {
      if (system.ownerMemberId === member.id) {
        const bucket = rolesBySystemId.get(system.id) ?? new Set<string>()
        bucket.add('オーナー')
        rolesBySystemId.set(system.id, bucket)
      }
    })

    systemAssignments.forEach((assignment) => {
      if (assignment.memberId !== member.id) {
        return
      }

      const bucket = rolesBySystemId.get(assignment.systemId) ?? new Set<string>()
      bucket.add(assignment.responsibility)
      rolesBySystemId.set(assignment.systemId, bucket)
    })

    return [...rolesBySystemId.entries()]
      .map(([systemId, roles]) => {
        const system = systems.find((item) => item.id === systemId)

        if (!system) {
          return null
        }

        return {
          id: system.id,
          name: system.name,
          category: system.category,
          roles: [...roles],
        }
      })
      .filter((item): item is RelatedSystemItem => Boolean(item))
      .sort((left, right) => left.name.localeCompare(right.name, 'ja'))
  }, [member, systemAssignments, systems])

  if (isLoading) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>メンバー詳細を読み込み中です</h1>
        <p className={pageStyles.emptyStateText}>データ取得が完了するまで少し待ってください。</p>
      </Panel>
    )
  }

  if (error) {
    return (
      <Panel>
        <h1 className={pageStyles.emptyStateTitle}>メンバー詳細を表示できませんでした</h1>
        <p className={pageStyles.emptyStateText}>{error}</p>
      </Panel>
    )
  }

  if (!member) {
    return (
      <Panel className={styles.notFound}>
        <h1 className={styles.notFoundTitle}>該当メンバーが見つかりません</h1>
        <p className={styles.notFoundText}>
          指定したメンバーIDは存在しないか、まだ読み込みできていません。
        </p>
        <div className={styles.heroActions}>
          <Button to="/members" variant="secondary">
            メンバー一覧へ戻る
          </Button>
        </div>
      </Panel>
    )
  }

  return (
    <div className={pageStyles.page}>
      <ListPageHero
        action={
          <div className={styles.heroActions}>
            <Button to="/members" variant="secondary">
              メンバー一覧
            </Button>
            <Button
              to={`/members/hierarchy?departmentName=${encodeURIComponent(member.departmentName)}&memberId=${member.id}`}
              variant="secondary"
            >
              階層図
            </Button>
          </div>
        }
        className={styles.hero}
        collapsible
        description={`${member.departmentName} の ${member.role} に関する詳細情報です。案件、システム、上下関係をまとめて確認できます。`}
        eyebrow="Member Detail"
        iconKind="member"
        stats={[
          { label: 'メンバーID', value: member.id },
          { label: '参加案件', value: relatedProjects.length },
          { label: '担当システム', value: relatedSystems.length },
          { label: '直下メンバー', value: directReports.length },
        ]}
        storageKey={`project-master:hero-collapsed:member-detail:${member.id}`}
        title={member.name}
      >
        <div className={styles.heroMeta}>
          <span className={styles.roleBadge}>{member.role}</span>
          <span className={styles.departmentBadge}>{member.departmentCode}</span>
          {member.lineLabel ? <span className={styles.lineBadge}>{member.lineLabel}</span> : null}
        </div>
      </ListPageHero>

      <ListPageContentSection
        description="個人情報、所属、ライン情報、上司を確認できます。"
        title="基本情報"
      >
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>氏名</span>
            <strong className={styles.infoValue}>{member.name}</strong>
          </div>
          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>ロール</span>
            <strong className={styles.infoValue}>{member.role}</strong>
          </div>
          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>部署コード</span>
            <strong className={styles.infoValue}>{member.departmentCode}</strong>
          </div>
          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>部署名</span>
            <strong className={styles.infoValue}>{member.departmentName}</strong>
          </div>
          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>ライン名</span>
            <strong className={styles.infoValue}>{member.lineLabel || '未設定'}</strong>
          </div>
          <div className={styles.infoCard}>
            <span className={styles.infoLabel}>上司</span>
            {manager ? (
              <Link className={styles.inlineLink} to={`/members/${manager.id}`}>
                {manager.name}
              </Link>
            ) : (
              <strong className={styles.infoValue}>{formatManagerLabel(undefined)}</strong>
            )}
          </div>
        </div>
      </ListPageContentSection>

      <ListPageContentSection
        description="直上の上司と直下のメンバーを確認できます。"
        title="上下関係"
      >
        <div className={styles.relationshipGrid}>
          <div className={styles.relationshipCard}>
            <h3 className={styles.relationshipTitle}>上司</h3>
            {manager ? (
              <Link className={styles.memberLinkCard} to={`/members/${manager.id}`}>
                <span className={styles.memberLinkName}>{manager.name}</span>
                <span className={styles.memberLinkMeta}>{manager.role}</span>
              </Link>
            ) : (
              <p className={styles.emptyText}>上司は設定されていません。</p>
            )}
          </div>
          <div className={styles.relationshipCard}>
            <h3 className={styles.relationshipTitle}>直下メンバー</h3>
            {directReports.length > 0 ? (
              <div className={styles.memberList}>
                {directReports.map((report) => (
                  <Link className={styles.memberLinkCard} key={report.id} to={`/members/${report.id}`}>
                    <span className={styles.memberLinkName}>{report.name}</span>
                    <span className={styles.memberLinkMeta}>{report.role}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>直下メンバーはいません。</p>
            )}
          </div>
        </div>
      </ListPageContentSection>

      <ListPageContentSection
        description="所属部署の中での位置を体制図で確認できます。編集は専用の体制図ページから行えます。"
        title="体制図"
      >
        <div className={styles.hierarchySection}>
          <div className={styles.hierarchyHeader}>
            <p className={styles.hierarchyText}>
              {member.departmentName} のメンバーを表示し、{member.name} を起点として強調しています。
            </p>
            <Button
              to={`/members/hierarchy?departmentName=${encodeURIComponent(member.departmentName)}&memberId=${member.id}`}
              variant="secondary"
            >
              体制図ページで開く
            </Button>
          </div>
          <div className={styles.hierarchyCanvas} data-testid="member-detail-hierarchy">
            <MemberHierarchyFlow members={departmentMembers} selectedMemberId={member.id} />
          </div>
        </div>
      </ListPageContentSection>

      <ListPageContentSection
        description="PM担当とアサイン責務をまとめて表示します。"
        emptyState={
          relatedProjects.length === 0
            ? {
                title: '関連案件はありません',
                description: 'このメンバーに紐づく案件アサインはまだ登録されていません。',
              }
            : null
        }
        title="関連案件"
      >
        <div className={styles.itemList}>
          {relatedProjects.map((project) => (
            <Link className={styles.itemCard} key={project.projectNumber} to={`/projects/${project.projectNumber}`}>
              <div className={styles.itemHeader}>
                <strong className={styles.itemTitle}>{project.name}</strong>
                <span className={styles.itemSubtle}>{project.projectNumber}</span>
              </div>
              <div className={styles.chipRow}>
                {project.roles.map((role) => (
                  <span className={styles.roleChip} key={`${project.projectNumber}-${role}`}>
                    {role}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </ListPageContentSection>

      <ListPageContentSection
        description="オーナー担当と個別責務をまとめて表示します。"
        emptyState={
          relatedSystems.length === 0
            ? {
                title: '関連システムはありません',
                description: 'このメンバーに紐づくシステム担当はまだ登録されていません。',
              }
            : null
        }
        title="関連システム"
      >
        <div className={styles.itemList}>
          {relatedSystems.map((system) => (
            <Link className={styles.itemCard} key={system.id} to={`/systems/${system.id}`}>
              <div className={styles.itemHeader}>
                <strong className={styles.itemTitle}>{system.name}</strong>
                <span className={styles.itemSubtle}>{system.category}</span>
              </div>
              <div className={styles.chipRow}>
                {system.roles.map((role) => (
                  <span className={styles.roleChip} key={`${system.id}-${role}`}>
                    {role}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </ListPageContentSection>
    </div>
  )
}
