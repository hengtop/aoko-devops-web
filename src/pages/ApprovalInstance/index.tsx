import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import type { TableProps } from "antd";
import AppConsolePageShell from "../../components/AppConsolePageShell";
import ApprovalDetailDrawer from "../../components/ApprovalDetailDrawer";
import {
  cancelApproval,
  createApproval,
  listApprovalPolicies,
  listApprovalTemplates,
  listApprovals,
  type ApprovalInstanceRecord,
  type ApprovalInstanceStatus,
  type ApprovalListParams,
  type ApprovalPolicyRecord,
  type ApprovalSourceType,
  type ApprovalTemplateBizType,
  type ApprovalTemplateRecord,
  type CreateApprovalPayload,
} from "../../service/api";
import { formatDateTime } from "../../utils";
import styles from "./styles.module.less";

type SearchFormValues = Pick<ApprovalListParams, "title" | "bizType" | "status" | "bizNo">;

type ApprovalCreateFormValues = CreateApprovalPayload & {
  resolveMode: "template" | "policy";
  requestSnapshotText?: string;
  metadataText?: string;
};

type PaginationState = {
  pageNum: number;
  pageSize: number;
  total: number;
};

type CancelModalState = {
  open: boolean;
  approvalId: string;
};

const bizTypeOptions: Array<{ label: string; value: ApprovalTemplateBizType }> = [
  { label: "发布审批", value: "release" },
  { label: "部署审批", value: "deployment" },
  { label: "接口门禁", value: "api_gate" },
];

const statusOptions: Array<{ label: string; value: ApprovalInstanceStatus }> = [
  { label: "审批中", value: "in_progress" },
  { label: "已通过", value: "approved" },
  { label: "已拒绝", value: "rejected" },
  { label: "已取消", value: "canceled" },
  { label: "已过期", value: "expired" },
];

const sourceTypeOptions: Array<{ label: string; value: ApprovalSourceType }> = [
  { label: "手动发起", value: "manual" },
  { label: "系统发起", value: "system" },
  { label: "接口门禁", value: "api_gate" },
];

function getApprovalId(record: Partial<ApprovalInstanceRecord>) {
  return record.id ?? record._id ?? "";
}

function getTemplateId(record: Partial<ApprovalTemplateRecord>) {
  return record.id ?? record._id ?? "";
}

function getPolicyId(record: Partial<ApprovalPolicyRecord>) {
  return record.id ?? record._id ?? "";
}

function normalizeOptionalField(value?: string) {
  const text = value?.trim();
  return text ? text : undefined;
}

function buildSearchParams(values: SearchFormValues): SearchFormValues {
  return {
    title: normalizeOptionalField(values.title),
    bizType: values.bizType,
    status: values.status,
    bizNo: normalizeOptionalField(values.bizNo),
  };
}

function parseJsonObject(text: string | undefined, label: string) {
  const trimmedText = text?.trim();
  if (!trimmedText) {
    return undefined;
  }

  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(trimmedText);
  } catch {
    throw new Error(`${label} 不是合法的 JSON`);
  }

  if (!parsedValue || Array.isArray(parsedValue) || typeof parsedValue !== "object") {
    throw new Error(`${label} 需要是 JSON 对象`);
  }

  return parsedValue as Record<string, unknown>;
}

function buildApprovalPayload(values: ApprovalCreateFormValues): CreateApprovalPayload {
  return {
    title: values.title.trim(),
    bizType: values.bizType,
    bizId: normalizeOptionalField(values.bizId),
    bizNo: normalizeOptionalField(values.bizNo),
    sourceType: values.sourceType,
    templateId: values.resolveMode === "template" ? values.templateId : undefined,
    policyId: values.resolveMode === "policy" ? values.policyId : undefined,
    policyTargetCode: normalizeOptionalField(values.policyTargetCode),
    tenantId: normalizeOptionalField(values.tenantId),
    productId: normalizeOptionalField(values.productId),
    applicationId: normalizeOptionalField(values.applicationId),
    environment: normalizeOptionalField(values.environment),
    httpMethod: normalizeOptionalField(values.httpMethod),
    gateCode: normalizeOptionalField(values.gateCode),
    reason: normalizeOptionalField(values.reason),
    requestSnapshot: parseJsonObject(values.requestSnapshotText, "请求快照"),
    metadata: parseJsonObject(values.metadataText, "附加元数据"),
  };
}

function getBizTypeLabel(value?: ApprovalTemplateBizType) {
  return bizTypeOptions.find((item) => item.value === value)?.label ?? "未设置";
}

function getStatusLabel(value?: ApprovalInstanceStatus) {
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

export default function ApprovalInstance() {
  const [searchForm] = Form.useForm<SearchFormValues>();
  const [createForm] = Form.useForm<ApprovalCreateFormValues>();
  const [cancelForm] = Form.useForm<{ comment?: string }>();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [cancelModalState, setCancelModalState] = useState<CancelModalState>({
    open: false,
    approvalId: "",
  });
  const [detailApprovalId, setDetailApprovalId] = useState("");
  const [templateOptions, setTemplateOptions] = useState<Array<{ label: string; value: string }>>(
    [],
  );
  const [policyOptions, setPolicyOptions] = useState<Array<{ label: string; value: string }>>([]);

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

  useEffect(() => {
    let cancelled = false;

    async function fetchDependencies() {
      try {
        const [templateResponse, policyResponse] = await Promise.all([
          listApprovalTemplates({
            pageNum: 1,
            pageSize: 200,
          }),
          listApprovalPolicies({
            pageNum: 1,
            pageSize: 200,
          }),
        ]);

        if (cancelled) {
          return;
        }

        if (templateResponse.success) {
          setTemplateOptions(
            (templateResponse.data?.list ?? []).map((item) => ({
              label: `${item.name} (${item.code})`,
              value: getTemplateId(item),
            })),
          );
        }

        if (policyResponse.success) {
          setPolicyOptions(
            (policyResponse.data?.list ?? []).map((item) => ({
              label: `${item.name} (${item.code})`,
              value: getPolicyId(item),
            })),
          );
        }
      } catch {
        if (!cancelled) {
          setTemplateOptions([]);
          setPolicyOptions([]);
        }
      }
    }

    void fetchDependencies();

    return () => {
      cancelled = true;
    };
  }, []);

  const columns: TableProps<ApprovalInstanceRecord>["columns"] = [
    {
      title: "审批标题",
      dataIndex: "title",
      key: "title",
      width: 240,
      render: (value: string, record) => (
        <div>
          <div className={styles.tablePrimary}>{value}</div>
          <div className={styles.tableSecondary}>ID: {getApprovalId(record) || "未返回"}</div>
        </div>
      ),
    },
    {
      title: "业务类型",
      dataIndex: "bizType",
      key: "bizType",
      width: 140,
      render: (value?: ApprovalTemplateBizType) => (
        <Tag className={styles.bizTag}>{getBizTypeLabel(value)}</Tag>
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
        <Tag className={styles.statusTag}>{getStatusLabel(value)}</Tag>
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
        const id = getApprovalId(record);
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
    setFilters(buildSearchParams(values));
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

  function handleOpenCreateModal() {
    createForm.setFieldsValue({
      resolveMode: "template",
      sourceType: "manual",
    });
    setCreateModalOpen(true);
  }

  function handleCloseCreateModal() {
    setCreateModalOpen(false);
    createForm.resetFields();
  }

  async function handleCreateApproval() {
    try {
      const values = await createForm.validateFields();
      const payload = buildApprovalPayload(values);

      if (values.resolveMode === "template" && !payload.templateId) {
        messageApi.error("请选择审批模板");
        return;
      }

      if (values.resolveMode === "policy" && !payload.policyId) {
        messageApi.error("请选择审批策略");
        return;
      }

      setSubmitting(true);

      const response = await createApproval(payload);

      if (!response.success) {
        return;
      }

      messageApi.success("审批单已发起");
      handleCloseCreateModal();
      setReloadSeed((prev) => prev + 1);
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) {
        return;
      }

      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "审批单发起失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
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
        comment: normalizeOptionalField(values.comment),
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
      note="这里专注审批单本身的发起与查看。具体审批动作由“审批任务”页承接，模板与策略维护也放在各自独立页面。"
      actions={
        <Button type="primary" onClick={handleOpenCreateModal}>
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
            <Select placeholder="全部类型" allowClear options={bizTypeOptions} />
          </Form.Item>
          <Form.Item className={styles.searchItem} name="status" label="审批状态">
            <Select placeholder="全部状态" allowClear options={statusOptions} />
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
          rowKey={(record) => getApprovalId(record)}
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
        title="发起审批"
        open={createModalOpen}
        width={920}
        onCancel={handleCloseCreateModal}
        onOk={() => void handleCreateApproval()}
        okText="提交审批"
        cancelText="取消"
        confirmLoading={submitting}
        destroyOnHidden
      >
        <Form<ApprovalCreateFormValues> form={createForm} layout="vertical" className={styles.modalForm}>
          <div className={styles.formGrid}>
            <Form.Item
              name="title"
              label="审批标题"
              rules={[{ required: true, whitespace: true, message: "请输入审批标题" }]}
            >
              <Input placeholder="例如：生产环境部署审批" />
            </Form.Item>
            <Form.Item
              name="bizType"
              label="业务类型"
              rules={[{ required: true, message: "请选择业务类型" }]}
            >
              <Select options={bizTypeOptions} placeholder="请选择业务类型" />
            </Form.Item>
            <Form.Item name="bizId" label="业务 ID">
              <Input placeholder="可选，关联具体业务主键" />
            </Form.Item>
            <Form.Item name="bizNo" label="业务编号">
              <Input placeholder="可选，便于查询与展示" />
            </Form.Item>
            <Form.Item name="sourceType" label="发起来源" initialValue="manual">
              <Select options={sourceTypeOptions} />
            </Form.Item>
            <Form.Item name="resolveMode" label="模板来源" initialValue="template">
              <Select
                options={[
                  { label: "直接选择模板", value: "template" },
                  { label: "通过策略匹配", value: "policy" },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, nextValues) => prevValues.resolveMode !== nextValues.resolveMode}
          >
            {() => {
              const resolveMode = createForm.getFieldValue("resolveMode") as
                | "template"
                | "policy"
                | undefined;

              if (resolveMode === "policy") {
                return (
                  <Form.Item name="policyId" label="审批策略" rules={[{ required: true, message: "请选择审批策略" }]}>
                    <Select
                      options={policyOptions}
                      placeholder="请选择审批策略"
                      optionFilterProp="label"
                    />
                  </Form.Item>
                );
              }

              return (
                <Form.Item name="templateId" label="审批模板" rules={[{ required: true, message: "请选择审批模板" }]}>
                  <Select
                    options={templateOptions}
                    placeholder="请选择审批模板"
                    optionFilterProp="label"
                  />
                </Form.Item>
              );
            }}
          </Form.Item>

          <div className={styles.formGrid}>
            <Form.Item name="policyTargetCode" label="策略目标编码">
              <Input placeholder="策略模式下可选，限定目标编码" />
            </Form.Item>
            <Form.Item name="environment" label="环境标识">
              <Input placeholder="例如：prod / staging" />
            </Form.Item>
            <Form.Item name="tenantId" label="租户 ID">
              <Input placeholder="可选" />
            </Form.Item>
            <Form.Item name="productId" label="产品 ID">
              <Input placeholder="可选" />
            </Form.Item>
            <Form.Item name="applicationId" label="应用 ID">
              <Input placeholder="可选" />
            </Form.Item>
            <Form.Item name="gateCode" label="门禁编码">
              <Input placeholder="接口门禁场景可选" />
            </Form.Item>
            <Form.Item name="httpMethod" label="HTTP 方法">
              <Input placeholder="例如：POST" />
            </Form.Item>
          </div>

          <Form.Item name="reason" label="发起原因">
            <Input.TextArea rows={3} placeholder="补充说明审批背景和原因" />
          </Form.Item>

          <Form.Item name="requestSnapshotText" label="请求快照 JSON">
            <Input.TextArea
              rows={5}
              placeholder='可选，例如：{"version":"1.0.0","operator":"zhangsan"}'
            />
          </Form.Item>

          <Form.Item name="metadataText" label="附加元数据 JSON">
            <Input.TextArea rows={5} placeholder='可选，例如：{"channel":"web"}' />
          </Form.Item>
        </Form>
      </Modal>

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
