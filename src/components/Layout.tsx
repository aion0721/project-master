import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useUserSession } from '../store/useUserSession'
import { Button } from './ui/Button'
import styles from './Layout.module.css'

interface NavigationItem {
  to: string
  label: string
  isActive: (pathname: string) => boolean
}

interface NavigationSection {
  title: string
  items: NavigationItem[]
}

const navigationSections: NavigationSection[] = [
  {
    title: '案件管理',
    items: [
      {
        to: '/projects',
        label: '一覧',
        isActive: (pathname) => pathname === '/projects' || /^\/projects\/[^/]+$/.test(pathname),
      },
      {
        to: '/cross-project',
        label: '横断ビュー',
        isActive: (pathname) => pathname === '/cross-project',
      },
    ],
  },
  {
    title: 'メンバー管理',
    items: [
      {
        to: '/members',
        label: 'メンバー一覧',
        isActive: (pathname) => pathname === '/members',
      },
      {
        to: '/members/hierarchy',
        label: '体制図',
        isActive: (pathname) => pathname === '/members/hierarchy',
      },
    ],
  },
  {
    title: 'システム管理',
    items: [
      {
        to: '/systems',
        label: 'システム一覧',
        isActive: (pathname) => pathname === '/systems',
      },
      {
        to: '/systems/diagram',
        label: '関連図',
        isActive: (pathname) => pathname === '/systems/diagram',
      },
    ],
  },
]

export function Layout() {
  const location = useLocation()
  const { currentUser, isLoading, error, login, logout } = useUserSession()
  const [memberKey, setMemberKey] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleLogin() {
    if (!memberKey.trim()) {
      setSubmitError('利用メンバーIDまたは名前を入力してください。')
      return
    }

    setSubmitError(null)

    try {
      await login(memberKey)
      setMemberKey('')
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error ? caughtError.message : '利用メンバーの選択に失敗しました。',
      )
    }
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <img alt="Project Master" className={styles.brandLogo} src="/logo.svg" />
          <div>
            <p className={styles.brandTitle}>Project Master</p>
            <p className={styles.brandText}>
              案件、体制、システムを一画面で比較できる管理アプリ
            </p>
          </div>
        </div>

        <nav className={styles.navigation}>
          {navigationSections.map((section) => (
            <div className={styles.navSection} key={section.title}>
              <p className={styles.navSectionTitle}>{section.title}</p>
              <div className={styles.navSectionItems}>
                {section.items.map((item) => {
                  const isActive = item.isActive(location.pathname)

                  return (
                    <NavLink
                      key={item.to}
                      className={() => (isActive ? `${styles.navItem} ${styles.active}` : styles.navItem)}
                      to={item.to}
                    >
                      {item.label}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className={styles.sidebarCard}>
          <p className={styles.sidebarCardLabel}>表示メモ</p>
          <p className={styles.sidebarCardText}>
            案件一覧では進捗とPM、横断ビューでは案件の重なり、システム一覧では影響範囲を比較できます。
          </p>
        </div>

        <div className={styles.userCard}>
          <p className={styles.userCardLabel}>利用メンバー</p>

          {currentUser ? (
            <>
              <div className={styles.userSummary}>
                <strong className={styles.username}>{currentUser.name}</strong>
                <span className={styles.userMeta}>
                  {currentUser.id} / ブックマーク {currentUser.bookmarkedProjectIds.length} 件
                </span>
              </div>
              <p className={styles.userCardText}>
                一覧と横断ビューでブックマーク案件と既定フィルターを利用できます。
              </p>
              <Button onClick={logout} size="small" variant="secondary">
                利用解除
              </Button>
            </>
          ) : (
            <>
              <label className={styles.userField}>
                <span className={styles.userFieldLabel}>member</span>
                <input
                  className={styles.userInput}
                  onChange={(event) => setMemberKey(event.target.value)}
                  placeholder="例: m1 / 田中"
                  value={memberKey}
                />
              </label>
              <Button disabled={isLoading} onClick={() => void handleLogin()} size="small">
                {isLoading ? '選択中...' : '利用開始'}
              </Button>
              <p className={styles.userCardText}>
                利用メンバーを選ぶと、ブックマーク案件と既定フィルターを使えます。
              </p>
            </>
          )}

          {submitError || error ? <p className={styles.userError}>{submitError ?? error}</p> : null}
        </div>
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
