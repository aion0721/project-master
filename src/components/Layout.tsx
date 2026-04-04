import { NavLink, Outlet } from 'react-router-dom'
import styles from './Layout.module.css'

const navigationItems = [
  { to: '/projects', label: '案件一覧' },
  { to: '/projects/new', label: '案件追加' },
  { to: '/cross-project', label: '横断ビュー' },
]

export function Layout() {
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
            案件追加後は詳細画面からフェーズ期間とプロジェクト体制を更新できます。横断ビューで週次の重なりも確認できます。
          </p>
        </div>
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
