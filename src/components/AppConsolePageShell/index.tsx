import type { ReactNode } from "react";
import AppConsoleMenu from "../AppConsoleMenu";
import AppFooter from "../AppFooter";
import styles from "./styles.module.less";

interface AppConsolePageShellProps {
  title: string;
  subtitle: string;
  note: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function AppConsolePageShell({
  title,
  subtitle,
  note,
  actions,
  children,
}: AppConsolePageShellProps) {
  return (
    <div className={styles.page}>
      <div className={styles.pageBody}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>菜单</div>
          <AppConsoleMenu />
          <div className={styles.sidebarNote}>{note}</div>
        </aside>

        <main className={styles.mainSection}>
          <section className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>{title}</div>
              <div className={styles.sectionSubtitle}>{subtitle}</div>
            </div>
            {actions ? <div className={styles.quickActions}>{actions}</div> : null}
          </section>

          {children}
        </main>
      </div>

      <AppFooter />
    </div>
  );
}
