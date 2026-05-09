import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
  Card,
  Collapse,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Select,
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
  FileTextOutlined,
  MinusCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
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
  updateRelease,
  type BuildConfig,
  type DeploymentRecord,
  type EnvironmentRecord,
  type ReleaseRecord,
  type TargetServer,
} from "@service/api";
import { listServers } from "@service/api/server";
import { useLogStream } from "../../hooks/useLogStream";
import LogViewer from "@components/LogViewer";
import styles from "./styles.module.less";

const { Title, Text } = Typography;

// ── Deploy Environment Card ──────────────────────────────
type EnvCardProps = {
  env: EnvironmentRecord;
  deployment?: DeploymentRecord;
  onDeploy: (env: EnvironmentRecord) => void;
  disabled?: boolean;
};

function EnvCard({ env, deployment, onDeploy, disabled }: EnvCardProps) {
  const statusColor = deployment
    ? (DEPLOYMENT_STATUS_COLORS[deployment.status] ?? "default")
    : "default";
  const statusLabel = deployment
    ? (DEPLOYMENT_STATUS_LABELS[deployment.status] ?? deployment.status)
    : "未部署";

  return (
    <div
      className={styles.envCard}
      onClick={() => !disabled && onDeploy(env)}
      style={{ cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1 }}
    >
      <div className={styles.envCardHeader}>
        <Tag color={env.type === "prod" ? "red" : env.type === "staging" ? "orange" : env.type === "build" ? "purple" : "blue"}>
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

// ── BuildConfigDrawer ─────────────────────────────────────
type BuildConfigDrawerProps = {
  open: boolean;
  releaseId: string;
  appId: string;
  initialEnvironmentId?: string;
  initialBuildConfig?: BuildConfig;
  onClose: () => void;
  onSuccess: () => void;
};

type BuildConfigFormValues = {
  environmentId?: string;
  buildCommandsRaw: string;
  artifactPath?: string;
  artifactType?: string;
  dockerfilePath?: string;
  imageRepo?: string;
  timeoutSec?: number;
  workDir?: string;
  envVars?: { key: string; value: string }[];
};

function BuildConfigDrawer({
  open,
  releaseId,
  appId,
  initialEnvironmentId,
  initialBuildConfig,
  onClose,
  onSuccess,
}: BuildConfigDrawerProps) {
  const [form] = Form.useForm<BuildConfigFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [envs, setEnvs] = useState<EnvironmentRecord[]>([]);
  const [loadingEnvs, setLoadingEnvs] = useState(false);
  const watchedArtifactType = Form.useWatch("artifactType", form);

  useEffect(() => {
    if (open) {
      setLoadingEnvs(true);
      listEnvironments({ applicationId: appId, pageNum: 1, pageSize: 50 })
        .then((res) => { if (res.success) setEnvs(res.data?.list ?? []); })
        .finally(() => setLoadingEnvs(false));

      form.setFieldsValue({
        environmentId: initialEnvironmentId,
        buildCommandsRaw: initialBuildConfig?.buildCommands?.join("\n") ?? "",
        artifactPath: initialBuildConfig?.artifactPath ?? "dist/",
        artifactType: initialBuildConfig?.artifactType ?? "zip",
        dockerfilePath: initialBuildConfig?.dockerfilePath ?? "Dockerfile",
        imageRepo: initialBuildConfig?.imageRepo,
        timeoutSec: initialBuildConfig?.timeoutSec ?? 600,
        workDir: initialBuildConfig?.workDir,
        envVars: Object.entries(initialBuildConfig?.envVars ?? {}).map(([key, value]) => ({ key, value })),
      });
    }
  }, [open, appId, initialEnvironmentId, initialBuildConfig, form]);

  async function handleSubmit(values: BuildConfigFormValues) {
    setSubmitting(true);
    try {
      const buildCommands = (values.buildCommandsRaw ?? "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (buildCommands.length === 0) {
        message.error("请至少输入一条构建命令");
        return;
      }
      const envVarsObj: Record<string, string> = {};
      (values.envVars ?? []).forEach(({ key, value }) => { if (key) envVarsObj[key] = value; });
      const buildConfig: BuildConfig = {
        buildCommands,
        artifactPath: values.artifactPath,
        artifactType: values.artifactType,
        dockerfilePath: values.artifactType === "docker-image" ? values.dockerfilePath : undefined,
        imageRepo: values.artifactType === "docker-image" ? values.imageRepo : undefined,
        timeoutSec: values.timeoutSec,
        workDir: values.workDir || undefined,
        envVars: Object.keys(envVarsObj).length > 0 ? envVarsObj : undefined,
      };
      const res = await updateRelease(releaseId, { environmentId: values.environmentId, buildConfig });
      if (res.success) {
        message.success("构建配置已保存");
        onSuccess();
        onClose();
      } else {
        message.error(Array.isArray(res.msg) ? res.msg.join("，") : (res.msg ?? "保存失败"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer
      title="编辑构建配置"
      open={open}
      onClose={onClose}
      width={540}
      destroyOnClose
      footer={
        <Space style={{ justifyContent: "flex-end", width: "100%", display: "flex" }}>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={submitting} onClick={() => form.submit()}>保存</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item label="构建环境" name="environmentId" rules={[{ required: true, message: "请选择构建环境" }]}>
          <Select
            placeholder="选择此迭代的构建服务器环境"
            loading={loadingEnvs}
            allowClear
            options={envs.map((e) => ({ value: e.id ?? e._id ?? "", label: e.name }))}
          />
        </Form.Item>

        <Form.Item
          label="构建命令"
          name="buildCommandsRaw"
          rules={[{ required: true, message: "请输入构建命令" }]}
          extra="每行一条命令，按顺序执行"
        >
          <Input.TextArea rows={5} placeholder={"npm ci\nnpm run build"} style={{ fontFamily: "monospace" }} />
        </Form.Item>

        <Form.Item label="产物类型" name="artifactType">
          <Select
            options={[
              { value: "zip", label: "ZIP 压缩包" },
              { value: "docker-image", label: "Docker 镜像" },
              { value: "binary", label: "二进制文件" },
              { value: "static", label: "静态资源" },
            ]}
          />
        </Form.Item>

        {watchedArtifactType === "docker-image" ? (
          <>
            <Form.Item label="Dockerfile 路径" name="dockerfilePath" extra="相对于工作目录">
              <Input placeholder="Dockerfile" />
            </Form.Item>
            <Form.Item label="镜像仓库地址" name="imageRepo" extra="例如 registry.example.com/my-app">
              <Input placeholder="留空使用应用名" />
            </Form.Item>
          </>
        ) : (
          <Form.Item label="产物路径" name="artifactPath" extra="构建输出目录，相对于工作目录">
            <Input placeholder="dist/" />
          </Form.Item>
        )}

        <Collapse ghost size="small" style={{ marginBottom: 12 }}>
          <Collapse.Panel header="高级配置" key="advanced">
            <Form.Item label="超时时间（秒）" name="timeoutSec">
              <InputNumber min={60} max={7200} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="工作目录" name="workDir" extra="留空使用默认目录 /opt/builds/{appCode}">
              <Input placeholder="/opt/builds/my-app" />
            </Form.Item>

            <Form.Item label="构建环境变量">
              <Form.List name="envVars">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field) => (
                      <Space key={field.key} align="baseline" style={{ display: "flex", marginBottom: 4 }}>
                        <Form.Item {...field} name={[field.name, "key"]} noStyle>
                          <Input placeholder="KEY" style={{ width: 140 }} />
                        </Form.Item>
                        <Form.Item {...field} name={[field.name, "value"]} noStyle>
                          <Input placeholder="VALUE" style={{ width: 200 }} />
                        </Form.Item>
                        <MinusCircleOutlined onClick={() => remove(field.name)} style={{ color: "var(--color-error)" }} />
                      </Space>
                    ))}
                    <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} size="small">
                      添加环境变量
                    </Button>
                  </>
                )}
              </Form.List>
            </Form.Item>
          </Collapse.Panel>
        </Collapse>
      </Form>
    </Drawer>
  );
}

// ── BuildLogDrawer ────────────────────────────────────────
type BuildLogDrawerProps = {
  open: boolean;
  releaseId: string;
  isBuilding: boolean;
  /** 当前最新构建轮次（来自 release.buildRound） */
  totalRounds: number;
  onClose: () => void;
};

function BuildLogDrawer({ open, releaseId, isBuilding, totalRounds, onClose }: BuildLogDrawerProps) {
  // 默认展示最新轮次；关闭时重置回最新
  const [selectedRound, setSelectedRound] = useState<number>(totalRounds || 1);

  // totalRounds 更新时（新一轮构建触发），自动跳到最新轮次
  useEffect(() => {
    if (totalRounds > 0) setSelectedRound(totalRounds);
  }, [totalRounds]);

  // 关闭时重置
  useEffect(() => {
    if (!open) setSelectedRound(totalRounds || 1);
  }, [open, totalRounds]);

  const { logs, status, isStreaming, clear } = useLogStream(
    releaseId,
    open,
    selectedRound > 0 ? selectedRound : undefined,
  );

  // 切换轮次时清空旧日志
  const handleRoundChange = (round: number) => {
    clear();
    setSelectedRound(round);
  };

  const statusTag = isStreaming
    ? <Tag color="processing">实时连接中</Tag>
    : status === "done"
      ? <Tag color="success">已完成</Tag>
      : status === "failed"
        ? <Tag color="error">连接失败</Tag>
        : null;

  function handleCopy() {
    const text = logs.map((l) => `[${l.level}] ${l.source ? `[${l.source}] ` : ""}${l.message}`).join("\n");
    navigator.clipboard.writeText(text).then(() => message.success("已复制到剪贴板"));
  }

  // 构建轮次选项：第 1 轮 … 第 N 轮
  const roundOptions = Array.from({ length: totalRounds }, (_, i) => ({
    label: `第 ${i + 1} 次构建`,
    value: i + 1,
  })).reverse(); // 最新轮次在顶部

  return (
    <Drawer
      title={
        <Space>
          <FileTextOutlined />
          构建日志
          {isBuilding && <Tag color="processing">构建中…</Tag>}
          {statusTag}
        </Space>
      }
      open={open}
      onClose={onClose}
      width={800}
      destroyOnClose
      extra={
        <Space size={4}>
          {totalRounds > 0 && (
            <Select
              size="small"
              value={selectedRound}
              onChange={handleRoundChange}
              options={roundOptions}
              style={{ width: 140 }}
            />
          )}
          <Button size="small" onClick={handleCopy} disabled={logs.length === 0}>
            复制全文
          </Button>
          <Button size="small" danger onClick={clear} disabled={logs.length === 0}>
            清空
          </Button>
        </Space>
      }
      styles={{ body: { padding: 16, display: "flex", flexDirection: "column", height: "100%" } }}
    >
      <LogViewer
        logs={logs}
        loading={isStreaming}
        height="calc(100vh - 120px)"
      />
    </Drawer>
  );
}

export default function ReleaseDetail() {
  const navigate = useNavigate();
  const { appId = "", releaseId = "" } = useParams<{ appId: string; releaseId: string }>();

  const [release, setRelease] = useState<ReleaseRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [environments, setEnvironments] = useState<EnvironmentRecord[]>([]);
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState<EnvironmentRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [buildConfigOpen, setBuildConfigOpen] = useState(false);
  const [buildLogOpen, setBuildLogOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [releaseId]);

  // 构建中时每 5s 轮询状态
  useEffect(() => {
    if (release?.status === "building") {
      pollRef.current = setInterval(() => { loadRelease(); }, 5000);
    } else {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [release?.status]);

  useEffect(() => {
    if (release?.applicationId) {
      listEnvironments({ applicationId: release.applicationId, pageNum: 1, pageSize: 20 }).then(
        (res) => { if (res.success) setEnvironments(res.data?.list ?? []); },
      );
    }
  }, [release?.applicationId]);

  const handleEnvClick = useCallback((env: EnvironmentRecord) => {
    if (release?.status !== "ready") return;
    setSelectedEnv(env);
    setDrawerOpen(true);
  }, [release?.status]);

  async function handleBuild() {
    if (!releaseId) return;
    // 前置校验
    if (!release?.environmentId) {
      message.warning("请先配置构建环境，点击「配置构建」设置");
      setBuildConfigOpen(true);
      return;
    }
    if (!release?.buildConfig?.buildCommands?.length) {
      message.warning("请先配置构建命令，点击「配置构建」设置");
      setBuildConfigOpen(true);
      return;
    }
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

  const status = release?.status;
  const isBuilding = status === "building";
  const isBuildFailed = status === "build_failed";
  const isPending = status === "pending";
  const isBuildSuccess = status === "build_success";
  const isCancelled = status === "cancelled" || status === "archived";
  const isReady = status === "ready";
  // draft/pending/build_failed 均可触发构建（后端 startBuild 内部处理 draft→pending→building）
  const canBuild = status === "draft" || isPending || isBuildFailed;
  const canMarkReady = isBuildSuccess;
  const canCancel = !isCancelled;
  const canDeploy = isReady;

  const latestDeploymentByEnv = environments.reduce<Record<string, DeploymentRecord>>(
    (acc, env) => {
      const envId = env.id ?? env._id ?? "";
      const envDeploys = deployments
        .filter((d) => d.environment === env.type)
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
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
                <Tooltip title="编辑构建配置">
                  <Button
                    icon={<SettingOutlined />}
                    disabled={isCancelled || isBuilding || isReady}
                    onClick={() => setBuildConfigOpen(true)}
                  >
                    配置构建
                  </Button>
                </Tooltip>
                <Tooltip title="查看构建日志">
                  <Button icon={<FileTextOutlined />} onClick={() => setBuildLogOpen(true)}>
                    构建日志
                  </Button>
                </Tooltip>
                <Tooltip title={isBuilding ? "构建中…" : isBuildFailed ? "重新构建" : "触发构建"}>
                  <Button
                    icon={<PlayCircleOutlined />}
                    loading={actionLoading || isBuilding}
                    disabled={!canBuild || isBuilding}
                    onClick={handleBuild}
                  >
                    {isBuilding ? "构建中…" : isBuildFailed ? "重新构建" : "构建"}
                  </Button>
                </Tooltip>
                <Tooltip title="标记构建产物就绪，允许发起部署">
                  <Button
                    icon={<CheckCircleOutlined />}
                    loading={actionLoading}
                    disabled={!canMarkReady}
                    onClick={handleMarkReady}
                  >
                    标记就绪
                  </Button>
                </Tooltip>
                <Tooltip title="刷新">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => { loadRelease(); loadDeployments(); }}
                  />
                </Tooltip>
                <Popconfirm title="确认取消本次迭代？" onConfirm={handleCancel} disabled={!canCancel}>
                  <Button danger icon={<StopOutlined />} loading={actionLoading} disabled={!canCancel}>
                    取消迭代
                  </Button>
                </Popconfirm>
              </Space>
            </div>

            {/* Basic Info Card */}
            {release && (
              <Card className={styles.infoCard} size="small">
                <Descriptions size="small" column={4}>
                  <Descriptions.Item label="版本">{release.version}</Descriptions.Item>
                  <Descriptions.Item label="分支">{release.git?.branch ?? "—"}</Descriptions.Item>
                  <Descriptions.Item label="Commit">
                    <code style={{ fontSize: 12 }}>{release.git?.commitHash?.slice(0, 10) || "—"}</code>
                  </Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {release.createdAt ? new Date(release.createdAt).toLocaleString() : "—"}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Build Info Card */}
            {release && (
              <Card
                className={styles.infoCard}
                size="small"
                title={<Space><PlayCircleOutlined />构建信息</Space>}
                extra={
                  <Space size={4}>
                    {!release.environmentId && !isCancelled && (
                      <Tag color="warning">未配置构建环境</Tag>
                    )}
                    {!release.buildConfig?.buildCommands?.length && !isCancelled && (
                      <Tag color="warning">未配置构建命令</Tag>
                    )}
                  </Space>
                }
              >
                {isBuildFailed && release.errorMessage && (
                  <Alert
                    type="error"
                    message="构建失败"
                    description={release.errorMessage}
                    showIcon
                    style={{ marginBottom: 12 }}
                  />
                )}
                <Descriptions size="small" column={4}>
                  <Descriptions.Item label="构建状态">
                    <StatusBadge
                      label={RELEASE_STATUS_LABELS[release.status] ?? release.status}
                      color={RELEASE_STATUS_COLORS[release.status]}
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="构建环境">
                    {release.environmentId
                      ? (environments.find((e) => (e.id ?? e._id) === release.environmentId)?.name ?? release.environmentId)
                      : <span style={{ color: "var(--color-warning)" }}>未配置</span>
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="开始时间">
                    {release.buildStartedAt ? new Date(release.buildStartedAt).toLocaleString() : "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="完成时间">
                    {release.buildCompletedAt ? new Date(release.buildCompletedAt).toLocaleString() : "—"}
                  </Descriptions.Item>
                </Descriptions>
                {release.buildArtifact && (
                  <Descriptions size="small" column={3} style={{ marginTop: 8 }}>
                    <Descriptions.Item label="产物类型">
                      <Tag>{release.buildArtifact.type}</Tag>
                    </Descriptions.Item>
                    {release.buildArtifact.packageUrl && (
                      <Descriptions.Item label="产物地址">
                        <code style={{ fontSize: 11 }}>{release.buildArtifact.packageUrl}</code>
                      </Descriptions.Item>
                    )}
                    {release.buildArtifact.dockerImage && (
                      <Descriptions.Item label="Docker 镜像">
                        <code style={{ fontSize: 11 }}>{release.buildArtifact.dockerImage}</code>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                )}
                {release.buildConfig && (
                  <Descriptions size="small" column={1} style={{ marginTop: 8 }}>
                    <Descriptions.Item label="构建命令">
                      <code style={{ fontSize: 11 }}>{release.buildConfig.buildCommands?.join(" && ") ?? "—"}</code>
                    </Descriptions.Item>
                  </Descriptions>
                )}
              </Card>
            )}

            {/* Deploy Pipeline Flow */}
            <div className={styles.sectionTitle}>
              <Title level={5} style={{ margin: 0 }}>
                部署流水线
              </Title>
              {!canDeploy && !isCancelled && (
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                  （需先标记为「就绪」才可发起部署）
                </Text>
              )}
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
                      <EnvCard
                        env={env}
                        deployment={latestDeploy}
                        onDeploy={handleEnvClick}
                        disabled={!canDeploy}
                      />
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
        onRefresh={() => { loadDeployments(); loadRelease(); }}
      />

      <BuildConfigDrawer
        open={buildConfigOpen}
        releaseId={releaseId}
        appId={appId}
        initialEnvironmentId={release?.environmentId}
        initialBuildConfig={release?.buildConfig}
        onClose={() => setBuildConfigOpen(false)}
        onSuccess={loadRelease}
      />

      <BuildLogDrawer
        open={buildLogOpen}
        releaseId={releaseId}
        isBuilding={isBuilding}
        totalRounds={release?.buildRound ?? 0}
        onClose={() => setBuildLogOpen(false)}
      />
    </div>
  );
}
