import {
  AppstoreOutlined,
  SafetyCertificateOutlined,
  CloudServerOutlined,
  DeploymentUnitOutlined,
  FileTextOutlined,
  NotificationOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./styles.module.less";

type MenuChildItem = {
  key: string;
  label: string;
  hint: string;
};

type MenuItem = {
  key: string;
  label: string;
  hint: string;
  icon: typeof AppstoreOutlined;
  children?: MenuChildItem[];
};

const menuItems: MenuItem[] = [
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
    key: "/approval",
    label: "审批中心",
    hint: "模板、策略、审批与任务",
    icon: SafetyCertificateOutlined,
    children: [
      {
        key: "/approval/template",
        label: "审批模板",
        hint: "维护节点与审批人",
      },
      {
        key: "/approval/policy",
        label: "审批策略",
        hint: "目标匹配与模板绑定",
      },
      {
        key: "/approval/instance",
        label: "审批单",
        hint: "发起与查看审批流程",
      },
      {
        key: "/approval/task",
        label: "审批任务",
        hint: "处理我的待办与已办",
      },
    ],
  },
  {
    key: "/server",
    label: "服务器管理",
    hint: "服务器与连接操作",
    icon: CloudServerOutlined,
  },
  {
    key: "/message/manage",
    label: "消息管理",
    hint: "公告发布与消息发送",
    icon: NotificationOutlined,
  },
];

function isActiveMenu(currentPath: string, targetPath: string) {
  if (targetPath === "/dashboard" || targetPath === "/approval") {
    return currentPath === targetPath;
  }

  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

function isActiveGroup(currentPath: string, targetPath: string) {
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

export default function AppConsoleMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedKeys, setExpandedKeys] = useState<string[]>(() =>
    menuItems
      .filter((item) => item.children?.length && isActiveGroup(location.pathname, item.key))
      .map((item) => item.key),
  );

  useEffect(() => {
    const activeGroupKeys = menuItems
      .filter((item) => item.children?.length && isActiveGroup(location.pathname, item.key))
      .map((item) => item.key);

    if (activeGroupKeys.length === 0) {
      return;
    }

    setExpandedKeys((prev) => Array.from(new Set([...prev, ...activeGroupKeys])));
  }, [location.pathname]);

  function handleToggleGroup(groupKey: string) {
    setExpandedKeys((prev) =>
      prev.includes(groupKey) ? prev.filter((item) => item !== groupKey) : [...prev, groupKey],
    );
  }

  return (
    <nav className={styles.menu} aria-label="控制台菜单">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const active = item.children?.length
          ? isActiveGroup(location.pathname, item.key)
          : isActiveMenu(location.pathname, item.key);

        if (item.children?.length) {
          const expanded = expandedKeys.includes(item.key);

          return (
            <div
              key={item.key}
              className={`${styles.menuGroup} ${active ? styles.menuGroupActive : ""}`}
            >
              <button
                type="button"
                className={`${styles.menuItem} ${active ? styles.menuItemActive : ""}`}
                aria-expanded={expanded}
                onClick={() => handleToggleGroup(item.key)}
              >
                <span className={styles.menuIcon} aria-hidden="true">
                  <Icon />
                </span>
                <span className={styles.menuContent}>
                  <span className={styles.menuLabel}>{item.label}</span>
                  <span className={styles.menuHint}>{item.hint}</span>
                </span>
                <span
                  className={`${styles.menuToggleIcon} ${
                    expanded ? styles.menuToggleIconExpanded : ""
                  }`}
                  aria-hidden="true"
                >
                  <span className={styles.menuToggleGlyph} />
                </span>
              </button>

              <div
                className={`${styles.subMenu} ${expanded ? styles.subMenuExpanded : ""}`}
                aria-label={`${item.label}二级菜单`}
                aria-hidden={!expanded}
              >
                {item.children.map((child) => {
                  const childActive = isActiveMenu(location.pathname, child.key);

                  return (
                    <button
                      key={child.key}
                      type="button"
                      className={`${styles.subMenuItem} ${
                        childActive ? styles.subMenuItemActive : ""
                      }`}
                      onClick={() => navigate(child.key)}
                    >
                      <span className={styles.subMenuLabel}>{child.label}</span>
                      <span className={styles.subMenuHint}>{child.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

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
