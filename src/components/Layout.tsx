import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useUserSession } from '../store/useUserSession'
import { EntityIcon, type EntityIconKind } from './EntityIcon'
import { Button } from './ui/Button'
import styles from './Layout.module.css'

interface NavigationItem {
  to: string
  label: string
  icon: EntityIconKind
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
        icon: 'project',
        isActive: (pathname) => pathname === '/projects' || /^\/projects\/[^/]+$/.test(pathname),
      },
      {
        to: '/cross-project',
        label: '横断ビュー',
        icon: 'project',
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
        icon: 'member',
        isActive: (pathname) => pathname === '/members' || pathname === '/members/new',
      },
      {
        to: '/members/hierarchy',
        label: '体制図',
        icon: 'member',
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
        icon: 'system',
        isActive: (pathname) => pathname === '/systems' || pathname === '/systems/new',
      },
      {
        to: '/systems/relations',
        label: '関係一覧',
        icon: 'system',
        isActive: (pathname) => pathname === '/systems/relations',
      },
      {
        to: '/systems/diagram',
        label: '関連図',
        icon: 'system',
        isActive: (pathname) => pathname === '/systems/diagram',
      },
    ],
  },
]

const sidebarPinnedStorageKey = 'project-master:sidebar-pinned'

export function Layout() {
  const location = useLocation()
  const { currentUser, isLoading, error, login, logout } = useUserSession()
  const [memberKey, setMemberKey] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem(sidebarPinnedStorageKey) === 'true'
  })
  const [isSidebarPreviewed, setIsSidebarPreviewed] = useState(false)
  const isSidebarExpanded = isSidebarPinned || isSidebarPreviewed

  useEffect(() => {
    window.localStorage.setItem(sidebarPinnedStorageKey, String(isSidebarPinned))
  }, [isSidebarPinned])

  async function handleLogin() {
    if (!memberKey.trim()) {
      setSubmitError('利用メンバー ID または名前を入力してください。')
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

  function previewSidebar() {
    if (!isSidebarPinned) {
      setIsSidebarPreviewed(true)
    }
  }

  function collapseSidebarPreview() {
    if (!isSidebarPinned) {
      setIsSidebarPreviewed(false)
    }
  }

  return (
    <div className={`${styles.shell} ${isSidebarExpanded ? styles.shellExpanded : styles.shellRail}`}>
      <aside
        className={`${styles.sidebar} ${
          isSidebarExpanded ? styles.sidebarExpanded : styles.sidebarRail
        }`}
        data-state={isSidebarExpanded ? 'expanded' : 'rail'}
        onBlur={(event) => {
          if (!isSidebarPinned && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsSidebarPreviewed(false)
          }
        }}
        onFocus={previewSidebar}
        onMouseEnter={previewSidebar}
        onMouseLeave={collapseSidebarPreview}
      >
        <button
          aria-label={isSidebarPinned ? 'サイドバーの固定を解除する' : 'サイドバーを固定する'}
          className={styles.sidebarPinButton}
          data-testid="layout-sidebar-pin"
          onClick={() => setIsSidebarPinned((current) => !current)}
          type="button"
        >
          <span aria-hidden="true" className={styles.sidebarPinIcon}>
            {isSidebarPinned ? '📌' : '📍'}
          </span>
          <span className={styles.sidebarPinLabel}>{isSidebarPinned ? '固定解除' : '固定'}</span>
        </button>

        <div className={styles.brand}>
          <img alt="Project Master" className={styles.brandLogo} src="/logo.svg" />
          <div className={styles.brandCopy}>
            <p className={styles.brandTitle}>Project Master</p>
            <p className={styles.brandText}>案件、体制、システムを一画面で比較できる管理アプリ</p>
          </div>
        </div>

        <div className={styles.sidebarScrollable}>
          <nav className={styles.navigation}>
            {navigationSections.map((section) => (
              <div className={styles.navSection} key={section.title}>
                <p className={styles.navSectionTitle}>{section.title}</p>
                <div className={styles.navSectionItems}>
                  {section.items.map((item) => {
                    const isActive = item.isActive(location.pathname)

                    return (
                      <NavLink
                        aria-label={item.label}
                        className={() => (isActive ? `${styles.navItem} ${styles.active}` : styles.navItem)}
                        key={item.to}
                        to={item.to}
                      >
                        <EntityIcon className={styles.navItemIcon} kind={item.icon} />
                        <span className={styles.navItemLabel}>{item.label}</span>
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
              案件一覧では進捗と PM、横断ビューでは案件の重なり、システム一覧では影響範囲を比較できます。
            </p>
          </div>
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
                一覧と横断ビューでブックマーク案件と既定値フィルターを利用できます。
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

      <main className={`${styles.content} ${isSidebarExpanded ? '' : styles.contentExpanded}`}>
        <Outlet />
      </main>
    </div>
  )
}
