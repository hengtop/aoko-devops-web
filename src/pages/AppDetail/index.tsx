import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Avatar,
  Button,
  message,
  Spin,
  Tabs,
  Tag,
  Typography,
} from "antd";
import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import AppConsoleMenu from "@components/AppConsoleMenu";
import AppFooter from "@components/AppFooter";
import { buildReleaseCreatePath } from "@constants";
import { getApplicationDetail, type ApplicationRecord } from "@service/api";
import TabOverview from "./TabOverview";
import TabReleases from "./TabReleases";
import TabPipelines from "./TabPipelines";
import TabEnvironments from "./TabEnvironments";
import TabSettings from "./TabSettings";
import styles from "./styles.module.less";

const { Title, Text } = Typography;

export default function AppDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<ApplicationRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getApplicationDetail({ id });
      if (res.success && res.data) {
        setApp(res.data);
      } else {
        message.error("获取应用详情失败");
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.layout}>
        <div className={styles.body}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>菜单</div>
            <AppConsoleMenu />
          </aside>
          <div className={styles.main}>
            <Spin />
          </div>
        </div>
      </div>
    );
  }

  if (!app) return null;

  const tabItems = [
    {
      key: "overview",
      label: "概览",
      children: <TabOverview app={app} />,
    },
    {
      key: "releases",
      label: "迭代",
      children: <TabReleases appId={id} />,
    },
    {
      key: "pipelines",
      label: "流水线",
      children: <TabPipelines appId={id} />,
    },
    {
      key: "environments",
      label: "环境",
      children: <TabEnvironments appId={id} />,
    },
    {
      key: "settings",
      label: "设置",
      icon: <SettingOutlined />,
      children: <TabSettings appId={id} />,
    },
  ];

  return (
    <div className={styles.layout}>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>菜单</div>
          <AppConsoleMenu />
        </aside>
        <div className={styles.main}>
          <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: 16 }}
        >
          返回
        </Button>

        <div className={styles.appHeader}>
          <Avatar
            shape="square"
            size={52}
            style={{
              background: "var(--ant-color-primary-bg)",
              color: "var(--ant-color-primary)",
            }}
            icon={<AppstoreOutlined />}
          />
          <div className={styles.appHeaderInfo}>
            <Title level={4} style={{ margin: 0 }}>
              {app.name}
            </Title>
            <div className={styles.appMeta}>
              <Tag color="blue">{app.code}</Tag>
              {app.structure && <Tag>{app.structure}</Tag>}
              {app.level && <Tag color="orange">{app.level}</Tag>}
            </div>
            {app.description && (
              <Text type="secondary" style={{ fontSize: 13 }}>
                {app.description}
              </Text>
            )}
          </div>
          <div className={styles.appHeaderActions}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate(buildReleaseCreatePath(id))}
            >
              创建迭代
            </Button>
          </div>
        </div>

        <div className={styles.tabsWrapper}>
          <Tabs items={tabItems} />
        </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
