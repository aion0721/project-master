import { NavLink, Outlet } from 'react-router-dom'
import styles from './Layout.module.css'

const navigationItems = [
  { to: '/projects', label: '案件一覧' },
  { to: '/cross-project', label: '横断ビュー' },
]

export function Layout() {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandBadge}>MVP</span>
          <div>
            <p className={styles.brandTitle}>案件管理ダッシュボード</p>
            <p className={styles.brandText}>進捗、担当、体制を同じ視点で確認</p>
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
          <p className={styles.sidebarCardLabel}>閲覧ポイント</p>
          <p className={styles.sidebarCardText}>遅延案件、OS担当、上下関係を同じ画面で確認できます。</p>
        </div>
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
