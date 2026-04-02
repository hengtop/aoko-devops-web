import { useEffect, useState } from "react";
import styles from "./styles.module.less";

const REVEAL_DELAY_MS = 180;

export default function AppLoading() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(true);
    }, REVEAL_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className={styles.loadingPage} aria-busy="true" aria-live="polite">
      <div className={styles.pageGlow} aria-hidden="true" />
      <div className={styles.pageGrid} aria-hidden="true" />

      <div className={`${styles.loadingShell} ${visible ? styles.loadingShellVisible : ""}`}>
        <div className={styles.loadingCore} aria-hidden="true">
          <span className={styles.loadingCorePulse} />
          <span className={styles.loadingCoreBeam} />
          <span className={styles.loadingCoreBeamSecondary} />
        </div>

        <div className={styles.loadingBrand}>AOKO DevOps</div>
        <div className={styles.loadingTitle}>正在载入页面</div>
        <div className={styles.loadingHint}>准备界面资源与工作区状态</div>
      </div>
    </div>
  );
}
