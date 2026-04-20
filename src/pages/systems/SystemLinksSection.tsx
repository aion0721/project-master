import { useEffect, useRef, useState } from 'react'
import { LinkTargetEditorList } from '../../components/LinkTargetEditorList'
import { LinkTargetList } from '../../components/LinkTargetList'
import { Button } from '../../components/ui/Button'
import { Panel } from '../../components/ui/Panel'
import pageStyles from '../../styles/page.module.css'
import type { ManagedSystem, ProjectLink } from '../../types/project'
import { buildLinkDrafts } from './systemDetailUtils'
import styles from './SystemDetailPage.module.css'

interface SystemLinksSectionProps {
  onSave: (links: ProjectLink[]) => Promise<void>
  system: ManagedSystem
}

export function SystemLinksSection({ onSave, system }: SystemLinksSectionProps) {
  const [isLinksEditing, setIsLinksEditing] = useState(false)
  const [linkDrafts, setLinkDrafts] = useState<ProjectLink[]>(() => buildLinkDrafts(system.systemLinks))
  const [linkError, setLinkError] = useState<string | null>(null)
  const [isSavingLinks, setIsSavingLinks] = useState(false)
  const previousSystemIdRef = useRef(system.id)

  useEffect(() => {
    setLinkDrafts(buildLinkDrafts(system.systemLinks))
    setLinkError(null)
  }, [system.id, system.systemLinks])

  useEffect(() => {
    if (previousSystemIdRef.current !== system.id) {
      setIsLinksEditing(false)
      previousSystemIdRef.current = system.id
    }
  }, [system.id])

  function updateLinkDraft(index: number, patch: Partial<ProjectLink>) {
    setLinkDrafts((current) =>
      current.map((link, currentIndex) => (currentIndex === index ? { ...link, ...patch } : link)),
    )
  }

  function addLinkDraft() {
    setLinkDrafts((current) => current.concat({ label: '', url: '' }))
  }

  function removeLinkDraft(index: number) {
    setLinkDrafts((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  function handleCancel() {
    setLinkDrafts(buildLinkDrafts(system.systemLinks))
    setIsLinksEditing(false)
    setLinkError(null)
  }

  async function handleSaveLinks() {
    const sanitizedLinks = linkDrafts
      .map((link) => ({
        label: link.label.trim(),
        url: link.url.trim(),
      }))
      .filter((link) => link.label || link.url)

    if (sanitizedLinks.some((link) => !link.label || !link.url)) {
      setLinkError('関連リンクは名称とURLを両方入力してください。')
      return
    }

    setLinkError(null)
    setIsSavingLinks(true)

    try {
      await onSave(sanitizedLinks)
      setIsLinksEditing(false)
    } catch (caughtError) {
      setLinkError(caughtError instanceof Error ? caughtError.message : '関連リンクの保存に失敗しました。')
    } finally {
      setIsSavingLinks(false)
    }
  }

  return (
    <Panel className={styles.section}>
      <div className={pageStyles.sectionHeader}>
        <div>
          <h2 className={pageStyles.sectionTitle}>関連リンク</h2>
          <p className={pageStyles.sectionDescription}>
            運用Wiki、設計資料、共有フォルダへの導線です。
          </p>
        </div>
        {isLinksEditing ? (
          <div className={styles.headerActions}>
            <Button onClick={addLinkDraft} size="small" variant="secondary">
              追加
            </Button>
            <Button disabled={isSavingLinks} onClick={() => void handleSaveLinks()} size="small">
              {isSavingLinks ? '保存中...' : '保存'}
            </Button>
            <Button onClick={handleCancel} size="small" variant="secondary">
              キャンセル
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsLinksEditing(true)} size="small" variant="secondary">
            編集
          </Button>
        )}
      </div>

      {isLinksEditing ? (
        <div className={styles.linkEditorList}>
          <LinkTargetEditorList
            labelFieldAriaLabel={(index) => `関連リンク名 ${index + 1}`}
            labelInputClassName={styles.input}
            labelInputPlaceholder="リンク名"
            labelTestIdPrefix="system-link-label"
            links={linkDrafts}
            listClassName={styles.linkEditorList}
            onChange={updateLinkDraft}
            onRemove={removeLinkDraft}
            removeButtonTestIdPrefix="system-link-remove"
            rowClassName={styles.linkEditorRow}
            urlFieldAriaLabel={(index) => `関連リンクURL ${index + 1}`}
            urlInputClassName={styles.input}
            urlInputPlaceholder="https://example.com または \\\\sample-server\\share"
            urlTestIdPrefix="system-link-url"
          />
          {linkDrafts.length === 0 ? <p className={styles.emptyText}>関連リンクは未設定です。</p> : null}
          {linkError ? <p className={styles.errorText}>{linkError}</p> : null}
        </div>
      ) : system.systemLinks && system.systemLinks.length > 0 ? (
        <LinkTargetList
          emptyContent={<p className={styles.emptyText}>関連リンクは未設定です。</p>}
          linkClassName={styles.externalLink}
          links={system.systemLinks}
          listClassName={styles.linkList}
          rowClassName={styles.linkDisplayRow}
          testIdPrefix="system-link"
          valueClassName={styles.linkValue}
        />
      ) : (
        <p className={styles.emptyText}>関連リンクは未設定です。</p>
      )}
    </Panel>
  )
}
