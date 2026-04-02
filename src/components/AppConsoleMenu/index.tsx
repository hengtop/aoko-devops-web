import {
  AppstoreOutlined,
  CloudServerOutlined,
  DeploymentUnitOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./styles.module.less";

const menuItems = [
  {
    key: "/dashboard",
    label: "工作台",
    hint: "总览与活动信息",
    icon: AppstoreOutlined,
  },
  {
    key: "/template",
    label: "模版配置",
    hint: "模版与仓库绑定",
    icon: DeploymentUnitOutlined,
  },
  {
    key: "/configuration",
    label: "配置管理",
    hint: "配置文件与状态维护",
    icon: FileTextOutlined,
  },
  {
    key: "/server",
    label: "服务器管理",
    hint: "服务器与连接操作",
    icon: CloudServerOutlined,
  },
];

function isActiveMenu(currentPath: string, targetPath: string) {
  if (targetPath === "/dashboard") {
    return currentPath === targetPath;
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

export default function AppConsoleMenu() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className={styles.menu} aria-label="控制台菜单">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const active = isActiveMenu(location.pathname, item.key);

        return (
          <button
            key={item.key}
            type="button"
            className={`${styles.menuItem} ${active ? styles.menuItemActive : ""}`}
            onClick={() => navigate(item.key)}
          >
            <span className={styles.menuIcon} aria-hidden="true">
              <Icon />
            </span>
            <span className={styles.menuContent}>
              <span className={styles.menuLabel}>{item.label}</span>
              <span className={styles.menuHint}>{item.hint}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
