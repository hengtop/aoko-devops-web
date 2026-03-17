import { Avatar, Select } from "antd";
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
        <Avatar className={styles.avatar} size={36}>
          ZH
        </Avatar>
        <Select
          className={styles.userSelect}
          defaultValue="workspace"
          options={workspaceOptions}
          classNames={{ popup: { root: styles.userSelectDropdown } }}
        />
      </div>
    </header>
  );
}
