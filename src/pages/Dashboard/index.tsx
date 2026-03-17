import AppFooter from "../../components/AppFooter";
import AppTopBar from "../../components/AppTopBar";
import styles from "./styles.module.less";

const tabs = [
  { key: "products", label: "产品" },
  { key: "apps", label: "应用" },
  { key: "iterations", label: "迭代" },
];

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
  return (
    <div className={styles.dashboard}>
      <AppTopBar />

      <div className={styles.dashboardBody}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>菜单</div>
          <div className={styles.sidebarPlaceholder}>内容暂时留空</div>
        </aside>

        <main className={styles.mainSection}>
          <div className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>工作台</div>
              <div className={styles.sectionSubtitle}>
                统一掌控产品、应用与迭代节奏
              </div>
            </div>
            <div className={styles.quickActions}>
              <button className={styles.primaryButton} type="button">
                创建部署
              </button>
              <button className={styles.ghostButton} type="button">
                查看详情
              </button>
            </div>
          </div>

          <section className={styles.panelCard}>
            <div className={styles.panelTabs}>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  className={
                    tab.key === "iterations"
                      ? styles.tabActive
                      : styles.tabButton
                  }
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className={styles.tabContent}>
              <div className={styles.iterationGrid}>
                {iterationStatus.map((item) => (
                  <div key={item.name} className={styles.iterationCard}>
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
                    <div className={styles.iterationStatus}>{item.status}</div>
                    <div className={styles.iterationMeta}>
                      上次部署：2026-03-16 21:40
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        <aside className={styles.activityPanel}>
          <div className={styles.activityHeader}>活动信息</div>
          <div className={styles.activityList}>
            {activities.map((block) => (
              <div key={block.title} className={styles.activityBlock}>
                <div className={styles.activityTitle}>{block.title}</div>
                <ul className={styles.activityItems}>
                  {block.items.map((item) => (
                    <li key={item} className={styles.activityItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <AppFooter />
    </div>
  );
}
