import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  Descriptions,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  MinusCircleOutlined,
  ReloadOutlined,
  StopOutlined,
} from "@ant-design/icons";
import AppConsoleMenu from "@components/AppConsoleMenu";
import AppFooter from "@components/AppFooter";
import StatusBadge from "@components/StatusBadge";
import LogViewer from "@components/LogViewer";
import {
  PIPELINE_RUN_STATUS_COLORS,
  PIPELINE_RUN_STATUS_LABELS,
} from "@constants";
import {
  cancelPipelineRun,
  getPipelineRunDetail,
  getPipelineRunJobDetail,
  getPipelineRunJobs,
  getPipelineRunStages,
  retryPipelineRun,
  type JobRunRecord,
  type PipelineRunRecord,
  type StageRunRecord,
} from "@service/api";
import styles from "./styles.module.less";

const { Text } = Typography;

type StageStatus = StageRunRecord["status"];
type JobStatus = JobRunRecord["status"];

function stageIcon(status: StageStatus) {
  if (status === "running") return <LoadingOutlined style={{ color: "#1677ff" }} />;
  if (status === "success") return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
  if (status === "failed") return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
  if (status === "skipped") return <MinusCircleOutlined style={{ color: "#d9d9d9" }} />;
  if (status === "canceled") return <StopOutlined style={{ color: "#faad14" }} />;
  return <ClockCircleOutlined style={{ color: "#d9d9d9" }} />;
}

function jobStatusColor(status: JobStatus): "success" | "error" | "processing" | "default" | "warning" {
  if (status === "success") return "success";
  if (status === "failed") return "error";
  if (status === "running") return "processing";
  if (status === "timeout") return "warning";
  return "default";
}

function formatDuration(ms?: number): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export default function PipelineRunDetail() {
  const navigate = useNavigate();
  const { runId = "" } = useParams<{ runId: string }>();

  const [run, setRun] = useState<PipelineRunRecord | null>(null);
  const [stages, setStages] = useState<StageRunRecord[]>([]);
  const [jobs, setJobs] = useState<JobRunRecord[]>([]);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobRunRecord | null>(null);
  const [logContent, setLogContent] = useState("");
  const [logLoading, setLogLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadAll() {
    if (!runId) return;
    setLoading(true);
    const [runRes, stagesRes, jobsRes] = await Promise.all([
      getPipelineRunDetail(runId),
      getPipelineRunStages(runId),
      getPipelineRunJobs(runId),
    ]);
    if (runRes.success && runRes.data) setRun(runRes.data);
    if (stagesRes.success && stagesRes.data) {
      const sorted = [...(stagesRes.data ?? [])].sort(
        (a, b) => a.stageOrder - b.stageOrder,
      );
      setStages(sorted);
      if (sorted.length > 0 && !selectedStage) {
        setSelectedStage(sorted[0].id ?? sorted[0]._id ?? null);
      }
    }
    if (jobsRes.success && jobsRes.data) setJobs(jobsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, [runId]);

  const handleSelectJob = useCallback(async (job: JobRunRecord) => {
    setSelectedJob(job);
    const jobId = job.id ?? job._id ?? "";
    if (!jobId) return;
    setLogLoading(true);
    const res = await getPipelineRunJobDetail(jobId);
    if (res.success && res.data) {
      setLogContent(res.data.logContent ?? "暂无日志");
    }
    setLogLoading(false);
  }, []);

  async function handleCancel() {
    if (!runId) return;
    setActionLoading(true);
    const res = await cancelPipelineRun(runId);
    if (res.success) loadAll();
    setActionLoading(false);
  }

  async function handleRetry() {
    if (!runId) return;
    setActionLoading(true);
    const res = await retryPipelineRun(runId);
    if (res.success && res.data) {
      const newRunId = res.data.id ?? res.data._id ?? "";
      if (newRunId) navigate(`/pipeline-run/${newRunId}`);
    }
    setActionLoading(false);
  }

  const stagesInSelectedStage = selectedStage
    ? jobs.filter((j) => j.stageRunId === selectedStage)
    : [];

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
              {run && (
                <StatusBadge
                  label={PIPELINE_RUN_STATUS_LABELS[run.status] ?? run.status}
                  color={PIPELINE_RUN_STATUS_COLORS[run.status]}
                />
              )}
              <Text style={{ marginLeft: 8 }}>运行 #{run?.runNumber}</Text>
            </div>
            <div>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadAll}
                style={{ marginRight: 8 }}
              />
              {run?.status === "running" && (
                <Button
                  danger
                  loading={actionLoading}
                  icon={<StopOutlined />}
                  onClick={handleCancel}
                >
                  取消
                </Button>
              )}
              {(run?.status === "failed" || run?.status === "canceled") && (
                <Button loading={actionLoading} onClick={handleRetry}>
                  重试
                </Button>
              )}
            </div>
          </div>

          {/* Run Info */}
          {run && (
            <Card size="small" className={styles.infoCard}>
              <Descriptions size="small" column={4}>
                <Descriptions.Item label="分支">{run.sourceRef ?? "—"}</Descriptions.Item>
                <Descriptions.Item label="Commit">
                  <code style={{ fontSize: 12 }}>{run.commitSha?.slice(0, 8) ?? "—"}</code>
                </Descriptions.Item>
                <Descriptions.Item label="耗时">
                  {formatDuration(run.durationMs)}
                </Descriptions.Item>
                <Descriptions.Item label="触发时间">
                  {run.createdAt ? new Date(run.createdAt).toLocaleString() : "—"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {/* Main: Stage list + Job detail */}
          <div className={styles.mainArea}>
            {/* Stage list */}
            <div className={styles.stageList}>
              {stages.length === 0 && (
                <Text type="secondary" style={{ padding: "12px 0" }}>
                  暂无阶段数据
                </Text>
              )}
              {stages.map((stage) => {
                const stageId = stage.id ?? stage._id ?? "";
                const isActive = selectedStage === stageId;
                return (
                  <div
                    key={stageId}
                    className={`${styles.stageItem} ${isActive ? styles.stageItemActive : ""}`}
                    onClick={() => setSelectedStage(stageId)}
                  >
                    <div className={styles.stageItemIcon}>
                      {stageIcon(stage.status)}
                    </div>
                    <div className={styles.stageItemInfo}>
                      <div className={styles.stageItemName}>{stage.stageName}</div>
                      <div className={styles.stageItemMeta}>
                        {formatDuration(stage.durationMs)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Job list + Log */}
            <div className={styles.jobArea}>
              {stagesInSelectedStage.length === 0 ? (
                <div className={styles.jobEmpty}>
                  <Text type="secondary">选择左侧阶段查看任务详情</Text>
                </div>
              ) : (
                <div className={styles.jobList}>
                  {stagesInSelectedStage.map((job) => {
                    const jobId = job.id ?? job._id ?? "";
                    const isSelected = selectedJob?.id === jobId || selectedJob?._id === jobId;
                    return (
                      <div
                        key={jobId}
                        className={`${styles.jobItem} ${isSelected ? styles.jobItemActive : ""}`}
                        onClick={() => handleSelectJob(job)}
                      >
                        <Badge status={jobStatusColor(job.status)} />
                        <Text style={{ flex: 1 }}>{job.jobName}</Text>
                        <Tag style={{ fontSize: 11 }}>{job.executorType}</Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatDuration(job.durationMs)}
                        </Text>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedJob && (
                <div className={styles.logArea}>
                  <Tooltip title="点击任务查看对应日志">
                    <Text strong style={{ display: "block", marginBottom: 8 }}>
                      {selectedJob.jobName} — 日志
                    </Text>
                  </Tooltip>
                  <LogViewer
                    content={logContent}
                    loading={logLoading}
                    height={360}
                    autoScroll
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
