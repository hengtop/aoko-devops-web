import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  message,
} from "antd";
import type { TableProps } from "antd";
import AppConsolePageShell from "../../components/AppConsolePageShell";
import ApprovalDetailDrawer from "../../components/ApprovalDetailDrawer";
import {
  addApprovalApprover,
  approveApproval,
  listMyDoneApprovalTasks,
  listMyPendingApprovalTasks,
  listUsers,
  rejectApproval,
  transferApproval,
  type ApprovalInstanceStatus,
  type ApprovalTaskListParams,
  type ApprovalTaskRecord,
  type ApprovalTaskStatus,
  type ApprovalTemplateBizType,
  type UserProfile,
} from "../../service/api";
import { formatDateTime } from "../../utils";
import styles from "./styles.module.less";

type SearchFormValues = Pick<ApprovalTaskListParams, "bizType" | "instanceStatus">;

type TaskActionType = "approve" | "reject" | "transfer" | "addApprover";

type TaskActionModalState = {
  open: boolean;
  type: TaskActionType;
  approvalId: string;
};

type TaskActionFormValues = {
  comment?: string;
  targetApproverId?: string;
  approverId?: string;
};

type PaginationState = {
  pageNum: number;
  pageSize: number;
  total: number;
};

const bizTypeOptions: Array<{ label: string; value: ApprovalTemplateBizType }> = [
  { label: "发布审批", value: "release" },
  { label: "部署审批", value: "deployment" },
  { label: "接口门禁", value: "api_gate" },
];

const instanceStatusOptions: Array<{ label: string; value: ApprovalInstanceStatus }> = [
  { label: "审批中", value: "in_progress" },
  { label: "已通过", value: "approved" },
  { label: "已拒绝", value: "rejected" },
  { label: "已取消", value: "canceled" },
  { label: "已过期", value: "expired" },
];

function getUserId(record: Partial<UserProfile>) {
  return record.id ?? record._id ?? "";
}

function normalizeOptionalField(value?: string) {
  const text = value?.trim();
  return text ? text : undefined;
}

function getBizTypeLabel(value?: ApprovalTemplateBizType) {
  return bizTypeOptions.find((item) => item.value === value)?.label ?? "未知类型";
}

function getInstanceStatusLabel(value?: ApprovalInstanceStatus) {
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

function getActionModalTitle(type: TaskActionType) {
  switch (type) {
    case "approve":
      return "审批通过";
    case "reject":
      return "审批拒绝";
    case "transfer":
      return "转交审批";
    case "addApprover":
      return "当前节点加签";
    default:
      return "处理审批";
  }
}

export default function ApprovalTask() {
  const [searchForm] = Form.useForm<SearchFormValues>();
  const [actionForm] = Form.useForm<TaskActionFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [activeTab, setActiveTab] = useState<"pending" | "done">("pending");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reloadSeed, setReloadSeed] = useState(0);
  const [detailReloadSeed, setDetailReloadSeed] = useState(0);
  const [filters, setFilters] = useState<SearchFormValues>({});
  const [records, setRecords] = useState<ApprovalTaskRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageNum: 1,
    pageSize: 10,
    total: 0,
  });
  const [detailApprovalId, setDetailApprovalId] = useState("");
  const [userOptions, setUserOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [actionModalState, setActionModalState] = useState<TaskActionModalState>({
    open: false,
    type: "approve",
    approvalId: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchTasks() {
      setLoading(true);

      try {
        const requestFn = activeTab === "pending" ? listMyPendingApprovalTasks : listMyDoneApprovalTasks;
        const response = await requestFn({
          ...filters,
          pageNum: pagination.pageNum,
          pageSize: pagination.pageSize,
        });

        if (!response.success || cancelled) {
          return;
        }

        setRecords(response.data?.list ?? []);
        setPagination((prev) => ({
          ...prev,
          total: response.data?.total ?? 0,
        }));
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error && typeof error === "object" && "handled" in error && error.handled) {
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "审批任务列表加载失败，请稍后重试";
        messageApi.error(errorMessage);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchTasks();

    return () => {
      cancelled = true;
    };
  }, [activeTab, filters, pagination.pageNum, pagination.pageSize, reloadSeed, messageApi]);

  useEffect(() => {
    let cancelled = false;

    async function fetchUsers() {
      try {
        const response = await listUsers({
          pageNum: 1,
          pageSize: 200,
        });

        if (!response.success || cancelled) {
          return;
        }

        setUserOptions(
          (response.data?.list ?? []).map((item) => {
            const id = getUserId(item);
            const label = item.name?.trim() || item.email?.trim() || item.phone?.trim() || id;

            return {
              label: `${label}${id ? ` (${id})` : ""}`,
              value: id,
            };
          }),
        );
      } catch {
        if (!cancelled) {
          setUserOptions([]);
        }
      }
    }

    void fetchUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  const columns: TableProps<ApprovalTaskRecord>["columns"] = [
    {
      title: "审批标题",
      key: "instanceTitle",
      width: 260,
      render: (_, record) => (
        <div>
          <div className={styles.tablePrimary}>{record.instance?.title || "未知审批单"}</div>
          <div className={styles.tableSecondary}>审批单 ID: {record.instanceId}</div>
        </div>
      ),
    },
    {
      title: "业务类型",
      key: "bizType",
      width: 140,
      render: (_, record) => (
        <Tag className={styles.bizTag}>{getBizTypeLabel(record.instance?.bizType)}</Tag>
      ),
    },
    {
      title: "审批节点",
      dataIndex: "nodeName",
      key: "nodeName",
      width: 160,
      render: (value: string, record) => (
        <div>
          <div className={styles.tablePrimary}>{value}</div>
          <div className={styles.tableSecondary}>{record.nodeCode}</div>
        </div>
      ),
    },
    {
      title: "任务状态",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (value?: ApprovalTaskStatus) => (
        <Tag className={styles.taskTag}>{getTaskStatusLabel(value)}</Tag>
      ),
    },
    {
      title: "审批状态",
      key: "instanceStatus",
      width: 120,
      render: (_, record) => (
        <Tag className={styles.instanceTag}>
          {getInstanceStatusLabel(record.instance?.status)}
        </Tag>
      ),
    },
    {
      title: "审批人",
      dataIndex: "approverId",
      key: "approverId",
      width: 220,
    },
    {
      title: activeTab === "pending" ? "通知时间" : "处理时间",
      key: "taskTime",
      width: 180,
      render: (_, record) => (
        <span className={styles.timestampText}>
          {formatDateTime(activeTab === "pending" ? record.notifiedAt : record.actedAt)}
        </span>
      ),
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: activeTab === "pending" ? 280 : 80,
      render: (_, record) => {
        const approvalId = record.instanceId;

        return (
          <Space size={8} wrap>
            <Button type="link" onClick={() => setDetailApprovalId(approvalId)}>
              详情
            </Button>
            {activeTab === "pending" ? (
              <>
                <Button type="link" onClick={() => handleOpenActionModal("approve", approvalId)}>
                  通过
                </Button>
                <Button type="link" danger onClick={() => handleOpenActionModal("reject", approvalId)}>
                  拒绝
                </Button>
                <Button type="link" onClick={() => handleOpenActionModal("transfer", approvalId)}>
                  转交
                </Button>
                <Button type="link" onClick={() => handleOpenActionModal("addApprover", approvalId)}>
                  加签
                </Button>
              </>
            ) : null}
          </Space>
        );
      },
    },
  ];

  function handleSearch(values: SearchFormValues) {
    setFilters({
      bizType: values.bizType,
      instanceStatus: values.instanceStatus,
    });
    setPagination((prev) => ({
      ...prev,
      pageNum: 1,
    }));
  }

  function handleReset() {
    searchForm.resetFields();
    setFilters({});
    setPagination((prev) => ({
      ...prev,
      pageNum: 1,
    }));
  }

  function handleOpenActionModal(type: TaskActionType, approvalId: string) {
    actionForm.resetFields();
    setActionModalState({
      open: true,
      type,
      approvalId,
    });
  }

  function handleCloseActionModal() {
    setActionModalState({
      open: false,
      type: "approve",
      approvalId: "",
    });
    actionForm.resetFields();
  }

  async function handleSubmitAction() {
    try {
      const values = await actionForm.validateFields();
      const approvalId = actionModalState.approvalId;

      if (!approvalId) {
        messageApi.error("当前审批单缺少 id，无法处理");
        return;
      }

      setSubmitting(true);

      let response;

      if (actionModalState.type === "approve") {
        response = await approveApproval(approvalId, {
          comment: normalizeOptionalField(values.comment),
        });
      } else if (actionModalState.type === "reject") {
        response = await rejectApproval(approvalId, {
          comment: normalizeOptionalField(values.comment),
        });
      } else if (actionModalState.type === "transfer") {
        if (!values.targetApproverId) {
          messageApi.error("请选择转交目标审批人");
          return;
        }

        response = await transferApproval(approvalId, {
          comment: normalizeOptionalField(values.comment),
          targetApproverId: values.targetApproverId,
        });
      } else {
        if (!values.approverId) {
          messageApi.error("请选择要加签的审批人");
          return;
        }

        response = await addApprovalApprover(approvalId, {
          comment: normalizeOptionalField(values.comment),
          approverId: values.approverId,
        });
      }

      if (!response.success) {
        return;
      }

      messageApi.success(`${getActionModalTitle(actionModalState.type)}成功`);
      handleCloseActionModal();
      setReloadSeed((prev) => prev + 1);
      setDetailReloadSeed((prev) => prev + 1);
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) {
        return;
      }

      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "审批处理失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppConsolePageShell
      title="审批任务"
      subtitle="集中处理当前登录人的审批待办，并查看历史已办记录。"
      note="这里专注当前用户的审批动作处理。审批单发起、模板维护和策略维护分别在审批中心的其他二级菜单中。"
    >
      {contextHolder}

      <Card className={styles.searchCard} variant="borderless">
        <Form<SearchFormValues> form={searchForm} className={styles.searchForm} onFinish={handleSearch}>
          <Form.Item className={styles.searchItem} name="bizType" label="业务类型">
            <Select placeholder="全部类型" allowClear options={bizTypeOptions} />
          </Form.Item>
          <Form.Item className={styles.searchItem} name="instanceStatus" label="审批状态">
            <Select placeholder="全部状态" allowClear options={instanceStatusOptions} />
          </Form.Item>
          <div className={styles.searchActions}>
            <Button type="primary" htmlType="submit">
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </div>
        </Form>
      </Card>

      <Card className={styles.tableCard} variant="borderless">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key as "pending" | "done");
            setPagination((prev) => ({
              ...prev,
              pageNum: 1,
            }));
          }}
          items={[
            {
              key: "pending",
              label: "我的待办",
            },
            {
              key: "done",
              label: "我的已办",
            },
          ]}
        />

        <Table<ApprovalTaskRecord>
          rowKey={(record) => record.id ?? `${record.instanceId}-${record.approverId}-${record.nodeCode}`}
          loading={loading}
          columns={columns}
          dataSource={records}
          className={styles.taskTable}
          scroll={{ x: 1460 }}
          pagination={{
            current: pagination.pageNum,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            onChange: (pageNum, pageSize) => {
              setPagination((prev) => ({
                ...prev,
                pageNum,
                pageSize,
              }));
            },
          }}
        />
      </Card>

      <Modal
        title={getActionModalTitle(actionModalState.type)}
        open={actionModalState.open}
        onCancel={handleCloseActionModal}
        onOk={() => void handleSubmitAction()}
        okText="确认提交"
        cancelText="取消"
        confirmLoading={submitting}
        destroyOnHidden
      >
        <Form<TaskActionFormValues> form={actionForm} layout="vertical">
          {actionModalState.type === "transfer" ? (
            <Form.Item
              name="targetApproverId"
              label="转交给"
              rules={[{ required: true, message: "请选择转交目标审批人" }]}
            >
              <Select options={userOptions} placeholder="请选择目标审批人" optionFilterProp="label" />
            </Form.Item>
          ) : null}

          {actionModalState.type === "addApprover" ? (
            <Form.Item
              name="approverId"
              label="加签审批人"
              rules={[{ required: true, message: "请选择加签审批人" }]}
            >
              <Select options={userOptions} placeholder="请选择加签审批人" optionFilterProp="label" />
            </Form.Item>
          ) : null}

          <Form.Item name="comment" label="审批说明">
            <Input.TextArea rows={4} placeholder="可选，补充处理意见" />
          </Form.Item>
        </Form>
      </Modal>

      <ApprovalDetailDrawer
        open={Boolean(detailApprovalId)}
        approvalId={detailApprovalId}
        reloadSeed={detailReloadSeed}
        onClose={() => setDetailApprovalId("")}
      />
    </AppConsolePageShell>
  );
}
