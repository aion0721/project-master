import { useEffect, useRef, useState } from 'react'
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
          <p className={pageStyles.sectionDescription}>運用Wikiや設計資料への導線です。</p>
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
          {linkDrafts.map((link, index) => (
            <div className={styles.linkEditorRow} key={`system-link-${index}`}>
              <input
                aria-label={`関連リンク名 ${index + 1}`}
                className={styles.input}
                data-testid={`system-link-label-${index}`}
                onChange={(event) => updateLinkDraft(index, { label: event.target.value })}
                placeholder="リンク名"
                value={link.label}
              />
              <input
                aria-label={`関連リンクURL ${index + 1}`}
                className={styles.input}
                data-testid={`system-link-url-${index}`}
                onChange={(event) => updateLinkDraft(index, { url: event.target.value })}
                placeholder="https://example.com"
                type="url"
                value={link.url}
              />
              <Button
                data-testid={`system-link-remove-${index}`}
                onClick={() => removeLinkDraft(index)}
                size="small"
                variant="danger"
              >
                削除
              </Button>
            </div>
          ))}
          {linkDrafts.length === 0 ? <p className={styles.emptyText}>関連リンクは未設定です。</p> : null}
          {linkError ? <p className={styles.errorText}>{linkError}</p> : null}
        </div>
      ) : system.systemLinks && system.systemLinks.length > 0 ? (
        <div className={styles.linkList}>
          {system.systemLinks.map((link, index) => (
            <a
              className={styles.externalLink}
              data-testid={`system-link-anchor-${index}`}
              href={link.url}
              key={`${link.label}-${link.url}`}
              rel="noreferrer"
              target="_blank"
            >
              {link.label}
            </a>
          ))}
        </div>
      ) : (
        <p className={styles.emptyText}>関連リンクは未設定です。</p>
      )}
    </Panel>
  )
}
