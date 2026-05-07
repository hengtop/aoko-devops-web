import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  Descriptions,
  Empty,
  message,
  Popconfirm,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { TableProps } from "antd";
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import AppConsoleMenu from "@components/AppConsoleMenu";
import AppFooter from "@components/AppFooter";
import StatusBadge from "@components/StatusBadge";
import {
  buildAppDetailPath,
  buildPipelineRunDetailPath,
  PIPELINE_RUN_STATUS_COLORS,
  PIPELINE_RUN_STATUS_LABELS,
  PIPELINE_TYPE_LABELS,
  TRIGGER_MODE_LABELS,
} from "@constants";
import {
  deletePipeline,
  getPipelineDetail,
  listPipelineRuns,
  togglePipeline,
  triggerPipelineRun,
  type PipelineRecord,
  type PipelineRunRecord,
  type PipelineStage,
} from "@service/api";
import styles from "./styles.module.less";

const { Title, Text } = Typography;

export default function PipelineDetail() {
  const navigate = useNavigate();
  const { id: appId = "", pipelineId = "" } = useParams<{
    id: string;
    pipelineId: string;
  }>();

  const [pipeline, setPipeline] = useState<PipelineRecord | null>(null);
  const [runs, setRuns] = useState<PipelineRunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function loadPipeline() {
    if (!pipelineId) return;
    setLoading(true);
    const res = await getPipelineDetail(pipelineId);
    if (res.success && res.data) setPipeline(res.data);
    setLoading(false);
  }

  async function loadRuns() {
    if (!pipelineId) return;
    const res = await listPipelineRuns({ pipelineId, pageNum: 1, pageSize: 20 });
    if (res.success) setRuns(res.data?.list ?? []);
  }

  useEffect(() => {
    loadPipeline();
    loadRuns();
  }, [pipelineId]);

  async function handleTrigger() {
    if (!pipelineId) return;
    setTriggering(true);
    const res = await triggerPipelineRun({ pipelineId });
    if (res.success && res.data) {
      message.success("流水线已触发");
      const runId = res.data.id ?? res.data._id ?? "";
      navigate(buildPipelineRunDetailPath(runId));
    }
    setTriggering(false);
  }

  async function handleToggle(enabled: boolean) {
    if (!pipelineId) return;
    setToggling(true);
    const res = await togglePipeline(pipelineId, enabled);
    if (res.success) {
      message.success(enabled ? "已启用" : "已禁用");
      setPipeline((p) => p ? { ...p, enabled } : p);
    }
    setToggling(false);
  }

  async function handleDelete() {
    if (!pipelineId) return;
    const res = await deletePipeline(pipelineId);
    if (res.success) {
      message.success("已删除");
      navigate(buildAppDetailPath(appId, "pipelines"));
    }
  }

  const runColumns: TableProps<PipelineRunRecord>["columns"] = [
    {
      title: "#",
      dataIndex: "runNumber",
      key: "runNumber",
      width: 60,
      render: (v: number) => <Text type="secondary">#{v}</Text>,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (v: PipelineRunRecord["status"]) => (
        <StatusBadge
          label={PIPELINE_RUN_STATUS_LABELS[v] ?? v}
          color={PIPELINE_RUN_STATUS_COLORS[v]}
        />
      ),
    },
    {
      title: "分支/Ref",
      dataIndex: "sourceRef",
      key: "sourceRef",
      render: (v?: string) => v ? <code>{v}</code> : "—",
    },
    {
      title: "耗时",
      dataIndex: "durationMs",
      key: "durationMs",
      render: (v?: number) => v ? `${Math.round(v / 1000)}s` : "—",
    },
    {
      title: "触发时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v?: string) => v ? new Date(v).toLocaleString() : "—",
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record) => {
        const runId = record.id ?? record._id ?? "";
        return (
          <Button
            size="small"
            type="link"
            onClick={() => navigate(buildPipelineRunDetailPath(runId))}
          >
            查看详情
          </Button>
        );
      },
    },
  ];

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
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(buildAppDetailPath(appId, "pipelines"))}
            >
              返回
            </Button>
            <div className={styles.headerInfo}>
              <Space align="center" size={12}>
                <Title level={4} style={{ margin: 0 }}>
                  {pipeline?.name}
                </Title>
                {pipeline && (
                  <Tag>{PIPELINE_TYPE_LABELS[pipeline.type] ?? pipeline.type}</Tag>
                )}
                {pipeline && (
                  <Badge
                    status={pipeline.enabled ? "success" : "default"}
                    text={pipeline.enabled ? "已启用" : "已禁用"}
                  />
                )}
              </Space>
            </div>
            <Space>
              <Tooltip title="手动触发运行">
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  loading={triggering}
                  onClick={handleTrigger}
                >
                  立即触发
                </Button>
              </Tooltip>
              <Tooltip title={pipeline?.enabled ? "禁用流水线" : "启用流水线"}>
                <Switch
                  checked={pipeline?.enabled}
                  loading={toggling}
                  onChange={handleToggle}
                  checkedChildren="启用"
                  unCheckedChildren="禁用"
                />
              </Tooltip>
              <Button icon={<ReloadOutlined />} onClick={() => { loadPipeline(); loadRuns(); }} />
              <Popconfirm title="确认删除该流水线？" onConfirm={handleDelete}>
                <Button danger>删除</Button>
              </Popconfirm>
            </Space>
          </div>

          {/* Info */}
          {pipeline && (
            <Card size="small" className={styles.infoCard}>
              <Descriptions size="small" column={4}>
                <Descriptions.Item label="Code">
                  <code>{pipeline.code}</code>
                </Descriptions.Item>
                <Descriptions.Item label="触发方式">
                  {TRIGGER_MODE_LABELS[pipeline.triggerMode] ?? pipeline.triggerMode}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {pipeline.createdAt ? new Date(pipeline.createdAt).toLocaleString() : "—"}
                </Descriptions.Item>
                <Descriptions.Item label="描述">
                  {pipeline.description || "—"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* Stage Definition Preview */}
          {pipeline?.definition?.stages && pipeline.definition.stages.length > 0 && (
            <Card
              title="流水线阶段"
              size="small"
              className={styles.stagesCard}
            >
              <div className={styles.stageFlow}>
                {pipeline.definition.stages
                  .sort((a: PipelineStage, b: PipelineStage) => a.order - b.order)
                  .map((stage: PipelineStage, idx: number) => (
                    <div key={stage.key} className={styles.stageFlowItem}>
                      <div className={styles.stageBox}>
                        <div className={styles.stageName}>{stage.name}</div>
                        <div className={styles.stageJobs}>
                          {stage.jobs.map((job) => (
                            <Tag key={job.key} style={{ fontSize: 11 }}>
                              {job.name}
                            </Tag>
                          ))}
                          {stage.jobs.length === 0 && (
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              暂无任务
                            </Text>
                          )}
                        </div>
                      </div>
                      {idx < pipeline.definition.stages.length - 1 && (
                        <span className={styles.stageArrow}>→</span>
                      )}
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Run History */}
          <Card title="运行记录" size="small">
            {runs.length === 0 ? (
              <Empty description="暂无运行记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Table
                columns={runColumns}
                dataSource={runs}
                rowKey={(r) => r.id ?? r._id ?? ""}
                size="small"
                pagination={{ pageSize: 10 }}
              />
            )}
          </Card>
        </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
