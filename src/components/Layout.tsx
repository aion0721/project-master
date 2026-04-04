import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Button } from './ui/Button'
import { useUserSession } from '../store/useUserSession'
import styles from './Layout.module.css'

const navigationItems = [
  { to: '/projects', label: '案件一覧' },
  { to: '/projects/new', label: '案件追加' },
  { to: '/cross-project', label: '横断ビュー' },
]

export function Layout() {
  const { currentUser, isLoading, error, login, logout } = useUserSession()
  const [username, setUsername] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleLogin() {
    if (!username.trim()) {
      setSubmitError('ユーザー名を入力してください。')
      return
    }

    setSubmitError(null)

    try {
      await login(username)
      setUsername('')
    } catch (caughtError) {
      setSubmitError(caughtError instanceof Error ? caughtError.message : 'ログインに失敗しました。')
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
              案件の進捗、担当体制、週次フェーズを一画面で確認できる管理アプリ
            </p>
          </div>
        </div>

        <nav className={styles.navigation}>
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarCard}>
          <p className={styles.sidebarCardLabel}>運用メモ</p>
          <p className={styles.sidebarCardText}>
            案件追加後は詳細画面からフェーズ期間、進捗、プロジェクト体制を更新できます。横断ビューでは週次の重なりも確認できます。
          </p>
        </div>

        <div className={styles.userCard}>
          <p className={styles.userCardLabel}>ユーザー</p>

          {currentUser ? (
            <>
              <div className={styles.userSummary}>
                <strong className={styles.username}>{currentUser.username}</strong>
                <span className={styles.userMeta}>
                  ブックマーク {currentUser.bookmarkedProjectIds.length} 件
                </span>
              </div>
              <p className={styles.userCardText}>
                一覧と横断ビューで「ブックマーク」を選ぶと、自分が追っている案件だけに絞れます。
              </p>
              <Button onClick={logout} size="small" variant="secondary">
                ログアウト
              </Button>
            </>
          ) : (
            <>
              <label className={styles.userField}>
                <span className={styles.userFieldLabel}>username</span>
                <input
                  className={styles.userInput}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="例: demo"
                  value={username}
                />
              </label>
              <Button disabled={isLoading} onClick={() => void handleLogin()} size="small">
                {isLoading ? 'ログイン中...' : 'ログイン'}
              </Button>
              <p className={styles.userCardText}>
                認証はありません。ユーザー名を入れると、その人用のブックマーク案件が使えます。
              </p>
            </>
          )}

          {submitError || error ? (
            <p className={styles.userError}>{submitError ?? error}</p>
          ) : null}
        </div>
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
