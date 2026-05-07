import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  MinusCircleOutlined,
  RightOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { Tag, Typography } from "antd";
import type { StageRunRecord, JobRunRecord } from "@service/api";
import styles from "./styles.module.less";

const { Text } = Typography;

type StageStatus = StageRunRecord["status"];

function StatusIcon({ status }: { status: StageStatus }) {
  if (status === "running") return <LoadingOutlined style={{ color: "#1677ff" }} />;
  if (status === "success") return <CheckCircleOutlined style={{ color: "#52c41a" }} />;
  if (status === "failed") return <CloseCircleOutlined style={{ color: "#ff4d4f" }} />;
  if (status === "skipped") return <MinusCircleOutlined style={{ color: "#bfbfbf" }} />;
  if (status === "canceled") return <StopOutlined style={{ color: "#faad14" }} />;
  return <ClockCircleOutlined style={{ color: "#bfbfbf" }} />;
}

function stageTagColor(status: StageStatus): string {
  if (status === "success") return "success";
  if (status === "failed") return "error";
  if (status === "running") return "processing";
  if (status === "skipped") return "default";
  return "default";
}

function formatMs(ms?: number): string {
  if (!ms) return "";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m${Math.floor((ms % 60000) / 1000)}s`;
}

type Props = {
  stages: StageRunRecord[];
  jobs?: JobRunRecord[];
  onStageClick?: (stage: StageRunRecord) => void;
  selectedStageId?: string;
};

export default function PipelineStageGraph({
  stages,
  jobs = [],
  onStageClick,
  selectedStageId,
}: Props) {
  const sorted = [...stages].sort((a, b) => a.stageOrder - b.stageOrder);

  return (
    <div className={styles.graph}>
      {sorted.map((stage, idx) => {
        const stageId = stage.id ?? stage._id ?? "";
        const isSelected = selectedStageId === stageId;
        const stageJobs = jobs.filter((j) => j.stageRunId === stageId);

        return (
          <div key={stageId} className={styles.stageWrapper}>
            <div
              className={`${styles.stageCard} ${isSelected ? styles.stageCardActive : ""}`}
              onClick={() => onStageClick?.(stage)}
            >
              <div className={styles.stageHeader}>
                <StatusIcon status={stage.status} />
                <Text strong style={{ fontSize: 13 }}>
                  {stage.stageName}
                </Text>
                <Tag color={stageTagColor(stage.status)} style={{ marginLeft: "auto", fontSize: 11 }}>
                  {stage.status}
                </Tag>
              </div>

              {stage.durationMs !== undefined && (
                <div className={styles.stageDuration}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {formatMs(stage.durationMs)}
                  </Text>
                </div>
              )}

              {stageJobs.length > 0 && (
                <div className={styles.jobChips}>
                  {stageJobs.map((job) => (
                    <Tag
                      key={job.id ?? job._id}
                      color={
                        job.status === "success"
                          ? "success"
                          : job.status === "failed"
                            ? "error"
                            : job.status === "running"
                              ? "processing"
                              : "default"
                      }
                      style={{ fontSize: 11, marginBottom: 2 }}
                    >
                      {job.jobName}
                    </Tag>
                  ))}
                </div>
              )}
            </div>

            {idx < sorted.length - 1 && (
              <RightOutlined className={styles.arrow} />
            )}
          </div>
        );
      })}

      {sorted.length === 0 && (
        <Text type="secondary">暂无阶段数据</Text>
      )}
    </div>
  );
}
