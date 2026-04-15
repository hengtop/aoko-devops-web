import { useEffect, useState } from "react";
import { Card, Drawer, Empty, Space, Spin, Table, Tag } from "antd";
import type { TableProps } from "antd";
import { getApprovalDetail, type ApprovalActionRecord, type ApprovalInstanceRecord, type ApprovalInstanceStatus, type ApprovalTaskRecord, type ApprovalTaskStatus, type ApprovalTemplateBizType } from "@service/api";
import { formatDateTime } from "@utils";
import styles from "./styles.module.less";

interface ApprovalDetailDrawerProps {
  open: boolean;
  approvalId: string;
  reloadSeed?: number;
  onClose: () => void;
}

const taskColumns: TableProps<ApprovalTaskRecord>["columns"] = [
  {
    title: "节点",
    dataIndex: "nodeName",
    key: "nodeName",
    width: 150,
  },
  {
    title: "审批人",
    dataIndex: "approverId",
    key: "approverId",
    width: 220,
  },
  {
    title: "任务状态",
    dataIndex: "status",
    key: "status",
    width: 120,
    render: (value?: ApprovalTaskStatus) => (
      <Tag className={styles.taskStatusTag}>{getTaskStatusLabel(value)}</Tag>
    ),
  },
  {
    title: "处理时间",
    dataIndex: "actedAt",
    key: "actedAt",
    width: 180,
    render: (value?: string) => formatDateTime(value),
  },
  {
    title: "备注",
    dataIndex: "comment",
    key: "comment",
    render: (value?: string) => value || <span className={styles.emptyText}>暂无</span>,
  },
];

function getApprovalStatusLabel(value?: ApprovalInstanceStatus) {
  switch (value) {
    case "pending":
      return "待提交";
    case "in_progress":
      return "审批中";
    case "approved":
      return "已通过";
    case "rejected":
      return "已拒绝";
    case "canceled":
      return "已取消";
    case "expired":
      return "已过期";
    default:
      return "未知";
  }
}

function getTaskStatusLabel(value?: ApprovalTaskStatus) {
  switch (value) {
    case "pending":
      return "待处理";
    case "approved":
      return "已通过";
    case "rejected":
      return "已拒绝";
    case "transferred":
      return "已转交";
    case "canceled":
      return "已取消";
    case "skipped":
      return "已跳过";
    default:
      return "未知";
  }
}

function getBizTypeLabel(value?: ApprovalTemplateBizType) {
  switch (value) {
    case "release":
      return "发布审批";
    case "deployment":
      return "部署审批";
    case "api_gate":
      return "接口门禁";
    default:
      return "未知";
  }
}

function getActionLabel(value?: ApprovalActionRecord["action"]) {
  switch (value) {
    case "submit":
      return "提交审批";
    case "approve":
      return "审批通过";
    case "reject":
      return "审批拒绝";
    case "cancel":
      return "取消审批";
    case "transfer":
      return "转交审批";
    case "add_approver":
      return "当前节点加签";
    case "system_notify":
      return "系统通知";
    default:
      return "未知动作";
  }
}

function formatJsonText(value?: Record<string, unknown>) {
  if (!value || Object.keys(value).length === 0) {
    return "";
  }

  return JSON.stringify(value, null, 2);
}

export default function ApprovalDetailDrawer({
  open,
  approvalId,
  reloadSeed = 0,
  onClose,
}: ApprovalDetailDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<ApprovalInstanceRecord | null>(null);

  useEffect(() => {
    if (!open || !approvalId) {
      return;
    }

    let cancelled = false;

    async function fetchApprovalDetail() {
      setLoading(true);

      try {
        const response = await getApprovalDetail(approvalId);

        if (!response.success || !response.data || cancelled) {
          return;
        }

        setRecord(response.data);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchApprovalDetail();

    return () => {
      cancelled = true;
    };
  }, [approvalId, open, reloadSeed]);

  return (
    <Drawer
      title="审批详情"
      width={920}
      open={open}
      onClose={onClose}
      destroyOnHidden
      className={styles.drawer}
    >
      {loading ? (
        <div className={styles.loadingBlock}>
          <Spin />
        </div>
      ) : !record ? (
        <Empty description="暂无审批详情" />
      ) : (
        <div className={styles.detailContent}>
          <Card className={styles.panelCard} variant="borderless" title="基础信息">
            <div className={styles.metaGrid}>
              <div>
                <div className={styles.metaLabel}>审批标题</div>
                <div className={styles.metaValue}>{record.title}</div>
              </div>
              <div>
                <div className={styles.metaLabel}>审批状态</div>
                <div className={styles.metaValue}>
                  <Tag className={styles.instanceStatusTag}>
                    {getApprovalStatusLabel(record.status)}
                  </Tag>
                </div>
              </div>
              <div>
                <div className={styles.metaLabel}>业务类型</div>
                <div className={styles.metaValue}>{getBizTypeLabel(record.bizType)}</div>
              </div>
              <div>
                <div className={styles.metaLabel}>业务编号</div>
                <div className={styles.metaValue}>{record.bizNo || record.bizId || "暂无"}</div>
              </div>
              <div>
                <div className={styles.metaLabel}>当前节点</div>
                <div className={styles.metaValue}>{record.currentNodeCode || "已结束"}</div>
              </div>
              <div>
                <div className={styles.metaLabel}>发起人</div>
                <div className={styles.metaValue}>{record.applicantId || "暂无"}</div>
              </div>
              <div>
                <div className={styles.metaLabel}>模板 ID</div>
                <div className={styles.metaValue}>{record.templateId || "暂无"}</div>
              </div>
              <div>
                <div className={styles.metaLabel}>策略 ID</div>
                <div className={styles.metaValue}>{record.policyId || "暂无"}</div>
              </div>
              <div>
                <div className={styles.metaLabel}>创建时间</div>
                <div className={styles.metaValue}>{formatDateTime(record.createdAt)}</div>
              </div>
              <div>
                <div className={styles.metaLabel}>更新时间</div>
                <div className={styles.metaValue}>{formatDateTime(record.updatedAt)}</div>
              </div>
            </div>

            <div className={styles.reasonBlock}>
              <div className={styles.metaLabel}>发起原因</div>
              <div className={styles.reasonText}>{record.reason || "暂无说明"}</div>
            </div>
          </Card>

          <Card className={styles.panelCard} variant="borderless" title="审批任务">
            <Table<ApprovalTaskRecord>
              rowKey={(item) => item.id ?? `${item.instanceId}-${item.nodeCode}-${item.approverId}`}
              columns={taskColumns}
              dataSource={record.tasks ?? []}
              pagination={false}
              className={styles.taskTable}
              scroll={{ x: 860 }}
            />
          </Card>

          <Card className={styles.panelCard} variant="borderless" title="动作记录">
            {record.actionRecords?.length ? (
              <div className={styles.actionList}>
                {record.actionRecords.map((item) => (
                  <div
                    key={item.id ?? `${item.action}-${item.createdAt}`}
                    className={styles.actionItem}
                  >
                    <Space className={styles.actionHeader} size={8} wrap>
                      <Tag className={styles.actionTag}>{getActionLabel(item.action)}</Tag>
                      <span>{formatDateTime(item.createdAt)}</span>
                      <span>操作人 {item.operatorId || "系统"}</span>
                    </Space>
                    {item.comment ? <div className={styles.actionComment}>{item.comment}</div> : null}
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="暂无动作记录" />
            )}
          </Card>

          {record.requestSnapshot && Object.keys(record.requestSnapshot).length ? (
            <Card className={styles.panelCard} variant="borderless" title="请求快照">
              <pre className={styles.jsonBlock}>{formatJsonText(record.requestSnapshot)}</pre>
            </Card>
          ) : null}

          {record.metadata && Object.keys(record.metadata).length ? (
            <Card className={styles.panelCard} variant="borderless" title="附加元数据">
              <pre className={styles.jsonBlock}>{formatJsonText(record.metadata)}</pre>
            </Card>
          ) : null}
        </div>
      )}
    </Drawer>
  );
}
