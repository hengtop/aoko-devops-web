import {
  BellOutlined,
  BulbOutlined,
  LogoutOutlined,
  MoonOutlined,
  RightOutlined,
  SunOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { Avatar, Badge, Button, Dropdown, Empty, Popover, Select, Spin, Tag } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore, useMessageInboxStore } from "../../store";
import { logout } from "../../service/api";
import { clearAccessToken } from "../../service/request";
import { useAppTheme } from "../../theme";
import {
  buildMessageSummary,
  formatMessageDateTime,
  getReadStatusLabel,
} from "../../utils/message";
import styles from "./styles.module.less";

const workspaceOptions = [
  { value: "workspace", label: "默认工作区" },
  { value: "settings", label: "个人设置" },
  { value: "switch", label: "切换空间" },
];

export default function AppTopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const unreadCount = useMessageInboxStore((state) => state.unreadCount);
  const recentMessages = useMessageInboxStore((state) => state.recentMessages);
  const initialized = useMessageInboxStore((state) => state.initialized);
  const loading = useMessageInboxStore((state) => state.loading);
  const refreshInbox = useMessageInboxStore((state) => state.refreshInbox);
  const resetInbox = useMessageInboxStore((state) => state.resetInbox);
  const { mode, isDark, toggleTheme } = useAppTheme();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPathname, setPopoverPathname] = useState(location.pathname);
  const [loggingOut, setLoggingOut] = useState(false);
  const resolvedPopoverOpen = popoverOpen && popoverPathname === location.pathname;

  useEffect(() => {
    if (!token) {
      resetInbox();
      return;
    }

    if (initialized) {
      return;
    }

    void refreshInbox();
  }, [initialized, refreshInbox, resetInbox, token]);

  function handleOpenChange(nextOpen: boolean) {
    setPopoverOpen(nextOpen);
    setPopoverPathname(location.pathname);

    if (nextOpen && token) {
      void refreshInbox();
    }
  }

  function handleMessageNavigate(messageId?: string) {
    if (!messageId) {
      return;
    }

    setPopoverOpen(false);
    navigate(`/message/${messageId}`);
  }

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      if (token) {
        const response = await logout();

        if (!response.success) {
          return;
        }
      }

      setPopoverOpen(false);
      navigate("/login", {
        replace: true,
      });
      clearAccessToken();
    } catch (error) {
      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }
    } finally {
      setPopoverOpen(false);
      setLoggingOut(false);
    }
  }

  function handleThemeToggle(event: React.MouseEvent<HTMLElement>) {
    toggleTheme({
      x: event.clientX,
      y: event.clientY,
    });
  }

  const userMenuItems = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: loggingOut ? "退出中..." : "退出登录",
      danger: true,
      disabled: loggingOut,
      className: styles.logoutMenuItem,
      onClick: () => {
        void handleLogout();
      },
    },
  ];

  const messagePopoverContent = (
    <div className={styles.messagePopover}>
      <div className={styles.messagePopoverHeader}>
        <div>
          <div className={styles.messagePopoverTitle}>消息中心</div>
          <div className={styles.messagePopoverSubtitle}>未读 {unreadCount} 条</div>
        </div>
        <Button
          type="link"
          className={styles.messagePopoverLink}
          onClick={() => {
            setPopoverOpen(false);
            navigate("/message");
          }}
        >
          查看全部
        </Button>
      </div>

      {loading && !initialized ? (
        <div className={styles.messagePopoverLoading}>
          <Spin size="small" />
          <span>正在同步消息摘要...</span>
        </div>
      ) : recentMessages.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span className={styles.messagePopoverEmpty}>暂时没有消息</span>}
        />
      ) : (
        <div className={styles.messagePreviewList}>
          {recentMessages.map((item) => {
            const senderLabel = item.sender?.name?.trim()
              ? `发送人 ${item.sender.name.trim()}`
              : "系统消息";

            return (
              <button
                key={item.id}
                type="button"
                className={styles.messagePreviewItem}
                onClick={() => handleMessageNavigate(item.id)}
              >
                <div className={styles.messagePreviewMeta}>
                  <Tag
                    variant="filled"
                    className={
                      item.read_status === "read"
                        ? styles.messageReadTag
                        : styles.messageUnreadTag
                    }
                  >
                    {getReadStatusLabel(item.read_status)}
                  </Tag>
                  <span className={styles.messagePreviewTime}>
                    {formatMessageDateTime(item.sentAt)}
                  </span>
                </div>
                <div className={styles.messagePreviewTitle}>{item.title}</div>
                <div className={styles.messagePreviewSummary}>
                  {buildMessageSummary(item.summary, item.content)}
                </div>
                <div className={styles.messagePreviewFooter}>
                  <span>{senderLabel}</span>
                  <RightOutlined />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

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
        <Button
          type="text"
          className={styles.themeToggle}
          aria-label={isDark ? "切换到浅色模式" : "切换到深色模式"}
          title={isDark ? "切换到浅色模式" : "切换到深色模式"}
          onClick={handleThemeToggle}
        >
          <span className={styles.themeToggleTrack}>
            <span className={styles.themeToggleIcon}>
              {isDark ? <MoonOutlined /> : <SunOutlined />}
            </span>
            <span className={styles.themeToggleCopy}>
              <span className={styles.themeToggleLabel}>Theme</span>
              <span className={styles.themeToggleValue}>
                {mode === "dark" ? "深色模式" : "浅色模式"}
              </span>
            </span>
            <BulbOutlined className={styles.themeToggleAccent} />
          </span>
        </Button>

        <Popover
          trigger="click"
          placement="bottomRight"
          open={resolvedPopoverOpen}
          onOpenChange={handleOpenChange}
          content={messagePopoverContent}
          overlayClassName={styles.messagePopoverOverlay}
        >
          <Button
            type="text"
            className={styles.messageButton}
            aria-label="查看消息摘要"
          >
            <Badge count={unreadCount} size="small" overflowCount={99}>
              <BellOutlined className={styles.messageIcon} />
            </Badge>
          </Button>
        </Popover>

        <Dropdown
          trigger={["click"]}
          placement="bottomRight"
          menu={{ items: userMenuItems }}
          classNames={{ root: styles.userMenuOverlay }}
        >
          <Button type="text" className={styles.avatarButton} aria-label="打开账户菜单">
            <Avatar className={styles.avatar} size={36}>
              ZH
            </Avatar>
          </Button>
        </Dropdown>
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
