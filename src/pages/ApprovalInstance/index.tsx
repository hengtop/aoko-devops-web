import { useEffect, useState } from "react";
import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, message } from "antd";
import type { TableProps } from "antd";
import { useNavigate } from "react-router-dom";
import AppConsolePageShell from "../../components/AppConsolePageShell";
import ApprovalDetailDrawer from "../../components/ApprovalDetailDrawer";
import {
  cancelApproval,
  listApprovals,
  type ApprovalInstanceRecord,
  type ApprovalInstanceStatus,
  type ApprovalListParams,
  type ApprovalTemplateBizType,
} from "../../service/api";
import { formatDateTime } from "../../utils";
import {
  approvalInstanceBizTypeOptions,
  approvalInstanceStatusOptions,
  buildApprovalInstanceSearchParams,
  getApprovalInstanceBizTypeLabel,
  getApprovalInstanceId,
  getApprovalInstanceStatusLabel,
  normalizeApprovalInstanceOptionalField,
} from "./shared";
import styles from "./styles.module.less";

type SearchFormValues = Pick<ApprovalListParams, "title" | "bizType" | "status" | "bizNo">;

type PaginationState = {
  pageNum: number;
  pageSize: number;
  total: number;
};

type CancelModalState = {
  open: boolean;
  approvalId: string;
};

export default function ApprovalInstance() {
  const navigate = useNavigate();
  const [searchForm] = Form.useForm<SearchFormValues>();
  const [cancelForm] = Form.useForm<{ comment?: string }>();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [reloadSeed, setReloadSeed] = useState(0);
  const [detailReloadSeed, setDetailReloadSeed] = useState(0);
  const [filters, setFilters] = useState<SearchFormValues>({});
  const [records, setRecords] = useState<ApprovalInstanceRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageNum: 1,
    pageSize: 10,
    total: 0,
  });
  const [cancelModalState, setCancelModalState] = useState<CancelModalState>({
    open: false,
    approvalId: "",
  });
  const [detailApprovalId, setDetailApprovalId] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchApprovals() {
      setLoading(true);

      try {
        const response = await listApprovals({
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
          error instanceof Error ? error.message : "审批单列表加载失败，请稍后重试";
        messageApi.error(errorMessage);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchApprovals();

    return () => {
      cancelled = true;
    };
  }, [filters, pagination.pageNum, pagination.pageSize, reloadSeed, messageApi]);

  const columns: TableProps<ApprovalInstanceRecord>["columns"] = [
    {
      title: "审批标题",
      dataIndex: "title",
      key: "title",
      width: 240,
      render: (value: string, record) => (
        <div>
          <div className={styles.tablePrimary}>{value}</div>
          <div className={styles.tableSecondary}>ID: {getApprovalInstanceId(record) || "未返回"}</div>
        </div>
      ),
    },
    {
      title: "业务类型",
      dataIndex: "bizType",
      key: "bizType",
      width: 140,
      render: (value?: ApprovalTemplateBizType) => (
        <Tag className={styles.bizTag}>{getApprovalInstanceBizTypeLabel(value)}</Tag>
      ),
    },
    {
      title: "业务编号",
      key: "bizNo",
      width: 180,
      render: (_, record) => record.bizNo || record.bizId || <span className={styles.emptyText}>暂无</span>,
    },
    {
      title: "当前节点",
      dataIndex: "currentNodeCode",
      key: "currentNodeCode",
      width: 180,
      render: (value?: string) => value || <span className={styles.emptyText}>已结束</span>,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (value?: ApprovalInstanceStatus) => (
        <Tag className={styles.statusTag}>{getApprovalInstanceStatusLabel(value)}</Tag>
      ),
    },
    {
      title: "发起人",
      dataIndex: "applicantId",
      key: "applicantId",
      width: 220,
      render: (value?: string) => value || <span className={styles.emptyText}>暂无</span>,
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (value?: string) => (
        <span className={styles.timestampText}>{formatDateTime(value)}</span>
      ),
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 190,
      render: (_, record) => {
        const id = getApprovalInstanceId(record);
        const canCancel = record.status === "in_progress";

        return (
          <Space size={12}>
            <Button type="link" className={styles.actionButton} onClick={() => setDetailApprovalId(id)}>
              详情
            </Button>
            <Popconfirm
              title="确认取消这条审批单吗？"
              description="只有发起人可以取消仍在审批中的流程。"
              okText="继续"
              cancelText="取消"
              disabled={!canCancel}
              onConfirm={() => {
                cancelForm.resetFields();
                setCancelModalState({
                  open: true,
                  approvalId: id,
                });
              }}
            >
              <Button
                type="link"
                danger
                className={styles.actionButtonDanger}
                disabled={!canCancel}
              >
                取消审批
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  function handleSearch(values: SearchFormValues) {
    setFilters(buildApprovalInstanceSearchParams(values));
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

  async function handleCancelApproval() {
    try {
      const values = await cancelForm.validateFields();
      const approvalId = cancelModalState.approvalId;

      if (!approvalId) {
        messageApi.error("当前审批单缺少 id，无法取消");
        return;
      }

      setCancelSubmitting(true);

      const response = await cancelApproval(approvalId, {
        comment: normalizeApprovalInstanceOptionalField(values.comment),
      });

      if (!response.success) {
        return;
      }

      messageApi.success("审批单已取消");
      setCancelModalState({
        open: false,
        approvalId: "",
      });
      cancelForm.resetFields();
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
        error instanceof Error ? error.message : "审批单取消失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setCancelSubmitting(false);
    }
  }

  return (
    <AppConsolePageShell
      title="审批单"
      subtitle="发起审批流程、查看审批详情，并在流程处理中按需取消审批。"
      note="这里专注审批单本身的发起与查看。新建已迁移到独立页面；当前服务端未提供审批单编辑接口，所以列表页仍保留详情和取消等轻交互。"
      actions={
        <Button type="primary" onClick={() => navigate("/approval/instance/create")}>
          发起审批
        </Button>
      }
    >
      {contextHolder}

      <Card className={styles.searchCard} variant="borderless">
        <Form<SearchFormValues> form={searchForm} className={styles.searchForm} onFinish={handleSearch}>
          <Form.Item className={styles.searchItem} name="title" label="审批标题">
            <Input placeholder="按审批标题搜索" allowClear />
          </Form.Item>
          <Form.Item className={styles.searchItem} name="bizType" label="业务类型">
            <Select placeholder="全部类型" allowClear options={approvalInstanceBizTypeOptions} />
          </Form.Item>
          <Form.Item className={styles.searchItem} name="status" label="审批状态">
            <Select placeholder="全部状态" allowClear options={approvalInstanceStatusOptions} />
          </Form.Item>
          <Form.Item className={styles.searchItem} name="bizNo" label="业务编号">
            <Input placeholder="按业务编号搜索" allowClear />
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
        <Table<ApprovalInstanceRecord>
          rowKey={(record) => getApprovalInstanceId(record)}
          loading={loading}
          columns={columns}
          dataSource={records}
          className={styles.instanceTable}
          scroll={{ x: 1320 }}
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
        title="取消审批"
        open={cancelModalState.open}
        onCancel={() =>
          setCancelModalState({
            open: false,
            approvalId: "",
          })
        }
        onOk={() => void handleCancelApproval()}
        okText="确认取消"
        cancelText="返回"
        confirmLoading={cancelSubmitting}
        destroyOnHidden
      >
        <Form<{ comment?: string }> form={cancelForm} layout="vertical">
          <Form.Item name="comment" label="取消说明">
            <Input.TextArea rows={4} placeholder="可选，说明取消审批的原因" />
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
