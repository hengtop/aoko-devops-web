import { useNavigate } from "react-router-dom";
import styles from "./styles.module.less";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className={styles.home}>
      <div className={styles.homeGlow} aria-hidden="true" />
      <div className={styles.homeGrid} aria-hidden="true" />
      <div className={styles.homeFacet} aria-hidden="true" />

      <header className={styles.homeHeader}>
        <div className={styles.homeBrand}>AOKO DevOps</div>
        <div className={styles.homeTagline}>你的私人应用管理平台</div>
      </header>

      <main className={styles.homeMain}>
        <section className={styles.hero}>
          <p className={styles.heroEyebrow}>Private DevOps Console</p>
          <h1 className={styles.heroTitle}>
            让应用管理更智能、更统一、更可控
            <span className={styles.heroTitleAccent}>AOKO DevOps</span>
          </h1>
          <p className={styles.heroSubtitle}>
            一站式掌握应用生命周期、环境与发布节奏。以清晰的视图和自动化能力，
            帮你快速落地高效的 DevOps 工作流。
          </p>

          <button
            className={styles.heroCta}
            type="button"
            onClick={() => navigate("/dashboard")}
          >
            开始
          </button>

          <div className={styles.heroCards}>
            <div className={styles.heroCard}>
              <div className={styles.heroCardTitle}>统一视图</div>
              <div className={styles.heroCardDesc}>
                运行、配置、发布状态一屏掌控
              </div>
            </div>
            <div className={styles.heroCard}>
              <div className={styles.heroCardTitle}>自动化流程</div>
              <div className={styles.heroCardDesc}>
                标准化流水线与可复用模板驱动交付
              </div>
            </div>
            <div className={styles.heroCard}>
              <div className={styles.heroCardTitle}>安全可控</div>
              <div className={styles.heroCardDesc}>
                环境与权限边界清晰，风险可追溯
              </div>
            </div>
          </div>
        </section>

        <section className={styles.caseSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>成功案例</h2>
            <p className={styles.sectionDesc}>
              以统一可观测、自动化发布与权限治理，帮助团队在复杂环境中保持高效交付。
            </p>
          </div>
          <div className={styles.caseGrid}>
            <div className={styles.caseCard}>
              <div className={styles.caseTag}>多环境发布</div>
              <div className={styles.caseTitle}>三线环境统一编排</div>
              <div className={styles.caseDesc}>
                基于模板化流水线缩短交付时间，发布回滚更可靠。
              </div>
              <div className={styles.caseMeta}>交付效率 +42%</div>
            </div>
            <div className={styles.caseCard}>
              <div className={styles.caseTag}>可观测治理</div>
              <div className={styles.caseTitle}>链路异常自动分流</div>
              <div className={styles.caseDesc}>
                统一告警与诊断面板，让关键链路稳定性可追踪。
              </div>
              <div className={styles.caseMeta}>告警噪音 -35%</div>
            </div>
            <div className={styles.caseCard}>
              <div className={styles.caseTag}>权限与合规</div>
              <div className={styles.caseTitle}>发布授权分级治理</div>
              <div className={styles.caseDesc}>
                角色边界与审批流程透明化，降低高风险变更。
              </div>
              <div className={styles.caseMeta}>风险回退 -28%</div>
            </div>
          </div>
        </section>

        <section className={styles.useSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>谁在用</h2>
            <p className={styles.sectionDesc}>
              来自不同规模团队的真实选择，持续扩展协作与可控性。
            </p>
          </div>
          <div className={styles.useGrid}>
            <article className={styles.useCard}>
              <div className={styles.useIcon} aria-hidden="true">
                <svg viewBox="0 0 48 48" className={styles.useIconSvg}>
                  <rect x="14" y="12" width="20" height="26" rx="2" />
                  <rect x="18" y="6" width="12" height="6" rx="1" />
                  <circle cx="24" cy="24" r="6" />
                  <path d="M24 24l4-2" />
                  <path d="M24 24v4" />
                  <path d="M18 16h12" />
                </svg>
              </div>
              <div>
                <div className={styles.useCardTitle}>时钟塔-魔术师协会</div>
                <div className={styles.useCardDesc}>
                  魔术师最高学府与研究中枢，统筹魔术学科与政策方向。
                </div>
              </div>
            </article>
            <article className={styles.useCard}>
              <div className={styles.useIcon} aria-hidden="true">
                <svg viewBox="0 0 48 48" className={styles.useIconSvg}>
                  <circle cx="24" cy="22" r="9" />
                  <circle cx="24" cy="22" r="3" />
                  <path d="M10 36h28" />
                  <path d="M16 36v6h16v-6" />
                  <path d="M24 10v6" />
                  <path d="M18 14l-4-4" />
                  <path d="M30 14l4-4" />
                </svg>
              </div>
              <div>
                <div className={styles.useCardTitle}>人理续存保障机构菲尼斯·迦勒底</div>
                <div className={styles.useCardDesc}>
                  各国联合建立的特务研究机构，融合魔术与科学保障人类史延续。
                </div>
              </div>
            </article>
            <article className={styles.useCard}>
              <div className={styles.useIcon} aria-hidden="true">
                <svg viewBox="0 0 48 48" className={styles.useIconSvg}>
                  <path d="M24 6v30" />
                  <path d="M16 18h16" />
                  <path d="M14 36h20" />
                  <path d="M20 36v6" />
                  <path d="M28 36v6" />
                </svg>
              </div>
              <div>
                <div className={styles.useCardTitle}>埋葬机关</div>
                <div className={styles.useCardDesc}>
                  圣堂教会最高位异端审问机关，处理极端威胁与高危事务。
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
