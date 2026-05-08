import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  message,
  Popconfirm,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { TableProps } from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  StopOutlined,
} from "@ant-design/icons";
import AppConsoleMenu from "@components/AppConsoleMenu";
import AppFooter from "@components/AppFooter";
import StatusBadge from "@components/StatusBadge";
import {
  DEPLOYMENT_STATUS_COLORS,
  DEPLOYMENT_STATUS_LABELS,
  RELEASE_STAGE_LABELS,
  RELEASE_STATUS_COLORS,
  RELEASE_STATUS_LABELS,
} from "@constants";
import {
  cancelRelease,
  createDeployment,
  getDeploymentLogs,
  getReleaseDetail,
  listDeployments,
  listEnvironments,
  markReleaseReady,
  startDeployment,
  startReleaseBuild,
  type DeploymentRecord,
  type EnvironmentRecord,
  type ReleaseRecord,
  type TargetServer,
} from "@service/api";
import { listServers } from "@service/api/server";
import styles from "./styles.module.less";

const { Title, Text } = Typography;

// ── Deploy Environment Card ──────────────────────────────
type EnvCardProps = {
  env: EnvironmentRecord;
  deployment?: DeploymentRecord;
  onDeploy: (env: EnvironmentRecord) => void;
};

function EnvCard({ env, deployment, onDeploy }: EnvCardProps) {
  const statusColor = deployment
    ? (DEPLOYMENT_STATUS_COLORS[deployment.status] ?? "default")
    : "default";
  const statusLabel = deployment
    ? (DEPLOYMENT_STATUS_LABELS[deployment.status] ?? deployment.status)
    : "未部署";

  return (
    <div className={styles.envCard} onClick={() => onDeploy(env)}>
      <div className={styles.envCardHeader}>
        <Tag color={env.type === "prod" ? "red" : env.type === "staging" ? "orange" : "blue"}>
          {env.name}
        </Tag>
        <Badge color={statusColor} text={statusLabel} />
      </div>
      {deployment && (
        <div className={styles.envCardMeta}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {deployment.createdAt
              ? new Date(deployment.createdAt).toLocaleString()
              : ""}
          </Text>
        </div>
      )}
      {!deployment && (
        <div className={styles.envCardEmpty}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            点击发起部署
          </Text>
        </div>
      )}
    </div>
  );
}

// ── Deploy Drawer ────────────────────────────────────────
type DeployDrawerProps = {
  open: boolean;
  releaseId: string;
  env: EnvironmentRecord | null;
  deployments: DeploymentRecord[];
  onClose: () => void;
  onRefresh: () => void;
};

function DeployDrawer({
  open,
  releaseId,
  env,
  deployments,
  onClose,
  onRefresh,
}: DeployDrawerProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [logContent, setLogContent] = useState("");
  const [logLoading, setLogLoading] = useState(false);
  const [selectedDeployId, setSelectedDeployId] = useState<string | null>(null);

  const envDeployments = deployments.filter(
    (d) => d.environment === env?.type,
  );

  async function handleDeploy(_values: { description?: string }) {
    if (!env) return;
    setSubmitting(true);
    try {
      // 从环境的 serverIds 拉取服务器详情，构建 TargetServer[]
      let targetServers: TargetServer[] = [];
      if (env.serverIds && env.serverIds.length > 0) {
        const sRes = await listServers({ pageNum: 1, pageSize: 200 });
        if (sRes.success) {
          const serverMap = new Map(
            (sRes.data?.list ?? []).map((s) => [s.id ?? s._id ?? "", s]),
          );
          targetServers = env.serverIds
            .map((sid) => {
              const s = serverMap.get(sid);
              if (!s) return null;
              return {
                serverId: sid,
                serverName: s.name,
                ip: s.ip ?? "",
              } satisfies TargetServer;
            })
            .filter((x): x is TargetServer => x !== null);
        }
      }
      if (targetServers.length === 0) {
        message.warning("该环境未绑定任何服务器，请先在环境配置中绑定服务器");
        return;
      }
      const createRes = await createDeployment({
        releaseId,
        environment: env.type,
        deployStrategy: "rolling",
        targetServers,
        deployConfig: {},
      });
      if (createRes.success && createRes.data) {
        const deployId = createRes.data.id ?? createRes.data._id ?? "";
        const startRes = await startDeployment(deployId);
        if (startRes.success) {
          message.success("部署已触发");
          form.resetFields();
          onRefresh();
        } else {
          const msg = Array.isArray(startRes.msg) ? startRes.msg.join("，") : (startRes.msg ?? "启动部署失败");
          message.error(msg);
        }
      } else {
        const msg = Array.isArray(createRes.msg) ? createRes.msg.join("，") : (createRes.msg ?? "创建部署失败");
        message.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function loadLogs(deployId: string) {
    setSelectedDeployId(deployId);
    setLogLoading(true);
    try {
      const res = await getDeploymentLogs({ deploymentId: deployId });
      if (res.success && res.data) {
        setLogContent(typeof res.data === "string" ? res.data : JSON.stringify(res.data, null, 2));
      } else {
        message.error("获取日志失败");
      }
    } finally {
      setLogLoading(false);
    }
  }

  const deployColumns: TableProps<DeploymentRecord>["columns"] = [
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (v: DeploymentRecord["status"]) => (
        <StatusBadge
          label={DEPLOYMENT_STATUS_LABELS[v] ?? v}
          color={DEPLOYMENT_STATUS_COLORS[v]}
        />
      ),
    },
    {
      title: "触发时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => (v ? new Date(v).toLocaleString() : "—"),
    },
    {
      title: "日志",
      key: "logs",
      render: (_: unknown, record) => (
        <Button
          size="small"
          type="link"
          onClick={() => loadLogs(record.id ?? record._id ?? "")}
        >
          查看日志
        </Button>
      ),
    },
  ];

  return (
    <Drawer
      title={env ? `部署到 ${env.name}` : "部署"}
      open={open}
      onClose={onClose}
      width={640}
      styles={{ body: { padding: 20 } }}
    >
      <Form form={form} layout="vertical" onFinish={handleDeploy} style={{ marginBottom: 24 }}>
        <Form.Item label="备注说明" name="description">
          <Input placeholder="本次部署说明（选填）" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} icon={<PlayCircleOutlined />}>
            发起部署
          </Button>
        </Form.Item>
      </Form>

      {envDeployments.length > 0 && (
        <>
          <Title level={5}>历史部署记录</Title>
          <Table
            columns={deployColumns}
            dataSource={envDeployments}
            rowKey={(r) => r.id ?? r._id ?? ""}
            size="small"
            pagination={false}
            style={{ marginBottom: 16 }}
          />
        </>
      )}

      {selectedDeployId && (
        <div className={styles.logBox}>
          {logLoading ? (
            <Spin size="small" />
          ) : (
            <pre className={styles.logPre}>{logContent || "暂无日志"}</pre>
          )}
        </div>
      )}
    </Drawer>
  );
}

// ── Main ReleaseDetail Page ──────────────────────────────
export default function ReleaseDetail() {
  const navigate = useNavigate();
  const { releaseId = "" } = useParams<{ appId: string; releaseId: string }>();

  const [release, setRelease] = useState<ReleaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [environments, setEnvironments] = useState<EnvironmentRecord[]>([]);
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState<EnvironmentRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadRelease() {
    if (!releaseId) return;
    const res = await getReleaseDetail(releaseId);
    if (res.success && res.data) {
      setRelease(res.data);
    }
    setLoading(false);
  }

  async function loadDeployments() {
    if (!releaseId) return;
    const res = await listDeployments({ releaseId, pageNum: 1, pageSize: 50 });
    if (res.success) setDeployments(res.data?.list ?? []);
  }

  useEffect(() => {
    loadRelease();
    loadDeployments();
  }, [releaseId]);

  useEffect(() => {
    if (release?.applicationId) {
      listEnvironments({ applicationId: release.applicationId, pageNum: 1, pageSize: 20 }).then(
        (res) => {
          if (res.success) setEnvironments(res.data?.list ?? []);
        },
      );
    }
  }, [release?.applicationId]);

  const handleEnvClick = useCallback((env: EnvironmentRecord) => {
    setSelectedEnv(env);
    setDrawerOpen(true);
  }, []);

  async function handleBuild() {
    if (!releaseId) return;
    setActionLoading(true);
    try {
      const res = await startReleaseBuild(releaseId);
      if (res.success) {
        message.success("构建已触发");
        loadRelease();
      } else {
        message.error(Array.isArray(res.msg) ? res.msg.join("，") : (res.msg ?? "构建触发失败"));
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkReady() {
    if (!releaseId) return;
    setActionLoading(true);
    try {
      const res = await markReleaseReady(releaseId);
      if (res.success) {
        message.success("已标记为就绪");
        loadRelease();
      } else {
        message.error(Array.isArray(res.msg) ? res.msg.join("，") : (res.msg ?? "操作失败"));
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!releaseId) return;
    setActionLoading(true);
    try {
      const res = await cancelRelease(releaseId);
      if (res.success) {
        message.success("迭代已取消");
        loadRelease();
      } else {
        message.error(Array.isArray(res.msg) ? res.msg.join("，") : (res.msg ?? "取消失败"));
      }
    } finally {
      setActionLoading(false);
    }
  }

  const latestDeploymentByEnv = environments.reduce<Record<string, DeploymentRecord>>(
    (acc, env) => {
      const envId = env.id ?? env._id ?? "";
      const envDeploys = deployments
        .filter((d) => d.environment === env.type)
        .sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
        );
      if (envDeploys.length > 0) acc[envId] = envDeploys[0];
      return acc;
    },
    {},
  );

  if (loading) {
    return (
      <div className={styles.pageLayout}>
        <div className={styles.pageBody}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>菜单</div>
            <AppConsoleMenu />
          </aside>
          <div className={styles.pageMain}>
            <div className={styles.loadingCenter}>
              <Spin size="large" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageLayout}>
      <div className={styles.pageBody}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>菜单</div>
          <AppConsoleMenu />
        </aside>
        <div className={styles.pageMain}>
        <div className={styles.pageContent}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              返回
            </Button>
            <div className={styles.headerInfo}>
              <Space align="center" size={12}>
                <Title level={4} style={{ margin: 0 }}>
                  {release?.version} · {release?.title}
                </Title>
                {release && (
                  <StatusBadge
                    label={RELEASE_STATUS_LABELS[release.status] ?? release.status}
                    color={RELEASE_STATUS_COLORS[release.status]}
                  />
                )}
                {release && (
                  <Tag>{RELEASE_STAGE_LABELS[release.currentStage] ?? release.currentStage}</Tag>
                )}
              </Space>
            </div>
            <Space>
              <Tooltip title="触发构建">
                <Button
                  icon={<PlayCircleOutlined />}
                  loading={actionLoading}
                  onClick={handleBuild}
                >
                  构建
                </Button>
              </Tooltip>
              <Tooltip title="标记构建产物就绪">
                <Button icon={<CheckCircleOutlined />} loading={actionLoading} onClick={handleMarkReady}>
                  标记就绪
                </Button>
              </Tooltip>
              <Tooltip title="刷新">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    loadRelease();
                    loadDeployments();
                  }}
                />
              </Tooltip>
              <Popconfirm title="确认取消本次迭代？" onConfirm={handleCancel}>
                <Button danger icon={<StopOutlined />} loading={actionLoading}>
                  取消迭代
                </Button>
              </Popconfirm>
            </Space>
          </div>

          {/* Info Card */}
          {release && (
            <Card className={styles.infoCard} size="small">
              <Descriptions size="small" column={4}>
                <Descriptions.Item label="版本">{release.version}</Descriptions.Item>
                <Descriptions.Item label="分支">{release.git?.branch ?? "—"}</Descriptions.Item>
                <Descriptions.Item label="Commit">
                  <code style={{ fontSize: 12 }}>{release.git?.commitHash || "—"}</code>
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {release.createdAt ? new Date(release.createdAt).toLocaleString() : "—"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* Deploy Pipeline Flow */}
          <div className={styles.sectionTitle}>
            <Title level={5} style={{ margin: 0 }}>
              部署流水线
            </Title>
          </div>

          {environments.length === 0 ? (
            <Card className={styles.emptyFlow}>
              <Text type="secondary">暂未配置环境，请先在「环境」Tab 中创建环境。</Text>
            </Card>
          ) : (
            <div className={styles.deployFlow}>
              {environments.map((env, idx) => {
                const envId = env.id ?? env._id ?? "";
                const latestDeploy = latestDeploymentByEnv[envId];
                return (
                  <div key={envId} className={styles.deployFlowItem}>
                    <EnvCard env={env} deployment={latestDeploy} onDeploy={handleEnvClick} />
                    {idx < environments.length - 1 && (
                      <ArrowRightOutlined className={styles.deployFlowArrow} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </div>
      <AppFooter />

      <DeployDrawer
        open={drawerOpen}
        releaseId={releaseId}
        env={selectedEnv}
        deployments={deployments}
        onClose={() => setDrawerOpen(false)}
        onRefresh={() => {
          loadDeployments();
          loadRelease();
        }}
      />
    </div>
  );
}
