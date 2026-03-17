import styles from "./styles.module.less";

const workspaceOptions = [
  { value: "workspace", label: "默认工作区" },
  { value: "settings", label: "个人设置" },
  { value: "switch", label: "切换空间" },
];

export default function AppTopBar() {
  return (
    <header className={styles.topBar}>
      <div className={styles.logoGroup}>
        <div className={styles.logoMark}>AO</div>
        <div>
          <div className={styles.logoTitle}>AOKO DevOps</div>
          <div className={styles.logoSub}>DevOps 工作台</div>
        </div>
      </div>

      <div className={styles.userArea}>
        <div className={styles.avatar} aria-label="个人头像">
          ZH
        </div>
        <select className={styles.userSelect} defaultValue="workspace">
          {workspaceOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
