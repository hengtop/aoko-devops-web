import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { Button, Card, Space, Tabs, Tag } from "antd";
import AppConsoleMenu from "../../components/AppConsoleMenu";
import AppFooter from "../../components/AppFooter";
import styles from "./styles.module.less";

const iterationStatus = [
  {
    name: "迭代 3.12.0",
    owner: "平台中台组",
    status: "部署成功",
    tone: "success",
  },
  {
    name: "迭代 3.13.0",
    owner: "业务增长组",
    status: "正在部署",
    tone: "warning",
  },
  {
    name: "迭代 3.13.1",
    owner: "体验优化组",
    status: "部署失败",
    tone: "danger",
  },
];

const activities = [
  {
    title: "审批消息",
    items: [
      "发布单 #2026-0317 等待你审批",
      "紧急回滚申请已提交",
      "资源扩容申请已通过",
    ],
  },
  {
    title: "告警提示",
    items: [
      "订单链路延迟升高（P95 1.8s）",
      "核心网关 2 节点 CPU 超 80%",
      "Kafka 集群积压 12.4W",
    ],
  },
  {
    title: "Commit 动态",
    items: [
      "feat: 增加发布审批白名单",
      "fix: 回滚流程超时修复",
      "chore: 更新镜像版本到 1.22.4",
    ],
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const tabItems = useMemo(
    () => [
      {
        key: "products",
        label: "产品",
        children: (
          <div className={styles.tabPlaceholder}>
            你的产品矩阵正在同步中，请稍后查看
          </div>
        ),
      },
      {
        key: "apps",
        label: "应用",
        children: (
          <div className={styles.tabPlaceholder}>
            应用列表即将接入统一管理视图
          </div>
        ),
      },
      {
        key: "iterations",
        label: "迭代",
        children: (
          <div className={styles.iterationGrid}>
            {iterationStatus.map((item) => (
              <Card
                key={item.name}
                className={styles.iterationCard}
                variant="borderless"
              >
                <div className={styles.iterationHeader}>
                  <div>
                    <div className={styles.iterationTitle}>{item.name}</div>
                    <div className={styles.iterationOwner}>{item.owner}</div>
                  </div>
                  <span
                    className={`${styles.statusDot} ${styles[item.tone]}`}
                    aria-label={item.status}
                  />
                </div>
                <Space className={styles.iterationStatus} size={8}>
                  <Tag className={styles.statusTag}>{item.status}</Tag>
                  <span className={styles.iterationMeta}>
                    上次部署：2026-03-16 21:40
                  </span>
                </Space>
              </Card>
            ))}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardBody}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>菜单</div>
          <AppConsoleMenu />
          <div className={styles.sidebarPlaceholder}>
            当前工作台聚合产品、应用与迭代信息，可从左侧进入模版配置等模块。
          </div>
        </aside>

        <main className={styles.mainSection}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>工作台</div>
              <div className={styles.sectionSubtitle}>
                统一掌控产品、应用与迭代节奏
              </div>
            </div>
            <Space className={styles.quickActions}>
              <Button type="primary">创建部署</Button>
              <Button type="default" onClick={() => navigate("/template")}>
                进入模版配置
              </Button>
            </Space>
          </div>

          <Card className={styles.panelCard} variant="borderless">
            <Tabs
              className={styles.panelTabs}
              defaultActiveKey="iterations"
              items={tabItems}
            />
          </Card>
        </main>

        <aside className={styles.activityPanel}>
          <div className={styles.activityHeader}>活动信息</div>
          <div className={styles.activityList}>
            {activities.map((block) => (
              <Card
                key={block.title}
                className={styles.activityBlock}
                variant="borderless"
                title={<span className={styles.activityTitle}>{block.title}</span>}
              >
                <ul className={styles.activityItems}>
                  {block.items.map((item) => (
                    <li key={item} className={styles.activityItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </aside>
      </div>

      <AppFooter />
    </div>
  );
}
