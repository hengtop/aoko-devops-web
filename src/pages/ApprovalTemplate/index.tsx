import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import type { TableProps } from "antd";
import AppConsolePageShell from "../../components/AppConsolePageShell";
import {
  createApprovalTemplate,
  deleteApprovalTemplate,
  listApprovalTemplates,
  listUsers,
  updateApprovalTemplate,
  type ApprovalApproverSourceType,
  type ApprovalNodeMode,
  type ApprovalNotifyChannel,
  type ApprovalTemplateBizType,
  type ApprovalTemplateListParams,
  type ApprovalTemplateMutationPayload,
  type ApprovalTemplateNode,
  type ApprovalTemplateRecord,
  type ApprovalTemplateStatus,
  type UserProfile,
} from "../../service/api";
import { formatDateTime } from "../../utils";
import styles from "./styles.module.less";

type SearchFormValues = Pick<ApprovalTemplateListParams, "name" | "code" | "bizType" | "status">;

type TemplateFormValues = ApprovalTemplateMutationPayload;

type TemplateModalState = {
  open: boolean;
  mode: "create" | "edit";
  record?: ApprovalTemplateRecord;
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

const statusOptions: Array<{ label: string; value: ApprovalTemplateStatus }> = [
  { label: "启用", value: "enable" },
  { label: "禁用", value: "disable" },
];

const nodeModeOptions: Array<{ label: string; value: ApprovalNodeMode }> = [
  { label: "任一通过", value: "OR" },
  { label: "全部通过", value: "AND" },
];

const approverSourceOptions: Array<{ label: string; value: ApprovalApproverSourceType }> = [
  { label: "指定用户", value: "USER" },
  { label: "角色成员", value: "ROLE" },
];

const notifyChannelOptions: Array<{ label: string; value: ApprovalNotifyChannel }> = [
  { label: "站内消息", value: "site" },
  { label: "邮件通知", value: "email" },
];

const defaultNodeValue: ApprovalTemplateNode = {
  nodeCode: "",
  nodeName: "",
  order: 1,
  approvalMode: "OR",
  approverSourceType: "USER",
  approverIds: [],
  allowTransfer: true,
  allowAddApprover: true,
  notifyChannels: ["site"],
};

function getTemplateId(record: Partial<ApprovalTemplateRecord>) {
  return record.id ?? record._id ?? "";
}

function getUserId(record: Partial<UserProfile>) {
  return record.id ?? record._id ?? "";
}

function normalizeOptionalField(value?: string) {
  const text = value?.trim();
  return text ? text : undefined;
}

function normalizeIdList(values?: string[]) {
  return (values ?? []).map((item) => item.trim()).filter(Boolean);
}

function buildSearchParams(values: SearchFormValues): SearchFormValues {
  return {
    name: normalizeOptionalField(values.name),
    code: normalizeOptionalField(values.code),
    bizType: values.bizType,
    status: values.status,
  };
}

function getBizTypeLabel(value?: ApprovalTemplateBizType) {
  return bizTypeOptions.find((item) => item.value === value)?.label ?? "未设置";
}

function getStatusLabel(value?: ApprovalTemplateStatus) {
  return statusOptions.find((item) => item.value === value)?.label ?? "启用";
}

function buildTemplatePayload(values: TemplateFormValues): ApprovalTemplateMutationPayload {
  return {
    name: values.name.trim(),
    code: values.code.trim(),
    bizType: values.bizType,
    status: values.status,
    description: normalizeOptionalField(values.description),
    nodes: (values.nodes ?? []).map((node, index) => ({
      nodeCode: node.nodeCode.trim(),
      nodeName: node.nodeName.trim(),
      order: Number(node.order ?? index + 1),
      approvalMode: node.approvalMode,
      approverSourceType: node.approverSourceType,
      approverIds: normalizeIdList(node.approverIds),
      allowTransfer: node.allowTransfer !== false,
      allowAddApprover: node.allowAddApprover !== false,
      notifyChannels: node.notifyChannels?.length ? node.notifyChannels : ["site"],
    })),
  };
}

export default function ApprovalTemplate() {
  const [searchForm] = Form.useForm<SearchFormValues>();
  const [modalForm] = Form.useForm<TemplateFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionKey, setActionKey] = useState("");
  const [reloadSeed, setReloadSeed] = useState(0);
  const [filters, setFilters] = useState<SearchFormValues>({});
  const [records, setRecords] = useState<ApprovalTemplateRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageNum: 1,
    pageSize: 10,
    total: 0,
  });
  const [userOptions, setUserOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [modalState, setModalState] = useState<TemplateModalState>({
    open: false,
    mode: "create",
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchTemplates() {
      setLoading(true);

      try {
        const response = await listApprovalTemplates({
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
          error instanceof Error ? error.message : "审批模板列表加载失败，请稍后重试";
        messageApi.error(errorMessage);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchTemplates();

    return () => {
      cancelled = true;
    };
  }, [filters, pagination.pageNum, pagination.pageSize, reloadSeed, messageApi]);

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

  const columns: TableProps<ApprovalTemplateRecord>["columns"] = [
    {
      title: "模板名称",
      dataIndex: "name",
      key: "name",
      width: 220,
      render: (value: string, record) => (
        <div>
          <div className={styles.tablePrimary}>{value}</div>
          <div className={styles.tableSecondary}>ID: {getTemplateId(record) || "未返回"}</div>
        </div>
      ),
    },
    {
      title: "模板编码",
      dataIndex: "code",
      key: "code",
      width: 180,
      render: (value: string) => <Tag className={styles.codeTag}>{value}</Tag>,
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
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (value?: ApprovalTemplateStatus) => (
        <Tag className={value === "disable" ? styles.statusTagDisabled : styles.statusTagEnabled}>
          {getStatusLabel(value)}
        </Tag>
      ),
    },
    {
      title: "审批节点",
      key: "nodes",
      render: (_, record) => (
        <div className={styles.nodeSummary}>
          <div>{record.nodes?.length ?? 0} 个节点</div>
          <div className={styles.tableSecondary}>
            版本 {record.version ?? 1}
          </div>
        </div>
      ),
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 180,
      render: (value?: string) => (
        <span className={styles.timestampText}>{formatDateTime(value)}</span>
      ),
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 180,
      render: (_, record) => {
        const id = getTemplateId(record);

        return (
          <Space size={12}>
            <Button type="link" className={styles.actionButton} onClick={() => handleEdit(record)}>
              编辑
            </Button>
            <Popconfirm
              title="确认删除当前审批模板吗？"
              description="删除后依赖该模板的审批策略需要重新调整。"
              okText="确认删除"
              cancelText="取消"
              onConfirm={() => void handleDelete(record)}
            >
              <Button
                type="link"
                danger
                className={styles.actionButtonDanger}
                loading={actionKey === `delete:${id}`}
              >
                删除
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

  function handleCreate() {
    modalForm.setFieldsValue({
      status: "enable",
      nodes: [{ ...defaultNodeValue }],
    });
    setModalState({
      open: true,
      mode: "create",
    });
  }

  function handleEdit(record: ApprovalTemplateRecord) {
    modalForm.setFieldsValue({
      name: record.name,
      code: record.code,
      bizType: record.bizType,
      status: record.status ?? "enable",
      description: record.description,
      nodes:
        record.nodes?.map((node) => ({
          ...node,
          approverIds: [...(node.approverIds ?? [])],
          notifyChannels: [...(node.notifyChannels ?? ["site"])],
        })) ?? [{ ...defaultNodeValue }],
    });

    setModalState({
      open: true,
      mode: "edit",
      record,
    });
  }

  function handleCloseModal() {
    setModalState({
      open: false,
      mode: "create",
    });
    modalForm.resetFields();
  }

  async function handleDelete(record: ApprovalTemplateRecord) {
    const id = getTemplateId(record);
    if (!id) {
      messageApi.error("当前记录缺少 id，无法删除");
      return;
    }

    setActionKey(`delete:${id}`);

    try {
      const response = await deleteApprovalTemplate(id);

      if (!response.success) {
        return;
      }

      messageApi.success("审批模板已删除");
      setReloadSeed((prev) => prev + 1);
    } catch (error) {
      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "审批模板删除失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setActionKey("");
    }
  }

  async function handleSubmit() {
    try {
      const values = await modalForm.validateFields();
      const payload = buildTemplatePayload(values);

      setSubmitting(true);

      if (modalState.mode === "edit") {
        const id = getTemplateId(modalState.record ?? {});

        if (!id) {
          messageApi.error("当前记录缺少 id，无法更新");
          return;
        }

        const response = await updateApprovalTemplate({
          id,
          ...payload,
        });

        if (!response.success) {
          return;
        }

        messageApi.success("审批模板已更新");
      } else {
        const response = await createApprovalTemplate(payload);

        if (!response.success) {
          return;
        }

        messageApi.success("审批模板已创建");
      }

      handleCloseModal();
      setReloadSeed((prev) => prev + 1);
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) {
        return;
      }

      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "审批模板保存失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppConsolePageShell
      title="审批模板"
      subtitle="维护审批节点、审批人来源和通知方式，供审批策略与审批单复用。"
      note="这里仅处理模板本身的结构定义。策略匹配、审批发起和任务处理分别放在审批中心的其他二级菜单中。"
      actions={
        <Button type="primary" onClick={handleCreate}>
          新建模板
        </Button>
      }
    >
      {contextHolder}

      <Card className={styles.searchCard} variant="borderless">
        <Form<SearchFormValues> form={searchForm} className={styles.searchForm} onFinish={handleSearch}>
          <Form.Item className={styles.searchItem} name="name" label="模板名称">
            <Input placeholder="按模板名称搜索" allowClear />
          </Form.Item>
          <Form.Item className={styles.searchItem} name="code" label="模板编码">
            <Input placeholder="按模板编码搜索" allowClear />
          </Form.Item>
          <Form.Item className={styles.searchItem} name="bizType" label="业务类型">
            <Select placeholder="全部类型" allowClear options={bizTypeOptions} />
          </Form.Item>
          <Form.Item className={styles.searchItem} name="status" label="状态">
            <Select placeholder="全部状态" allowClear options={statusOptions} />
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
        <Table<ApprovalTemplateRecord>
          rowKey={(record) => getTemplateId(record)}
          loading={loading}
          columns={columns}
          dataSource={records}
          className={styles.templateTable}
          scroll={{ x: 1080 }}
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
        title={modalState.mode === "edit" ? "编辑审批模板" : "新建审批模板"}
        open={modalState.open}
        width={980}
        onCancel={handleCloseModal}
        onOk={() => void handleSubmit()}
        okText={modalState.mode === "edit" ? "保存修改" : "创建模板"}
        cancelText="取消"
        confirmLoading={submitting}
        destroyOnHidden
      >
        <Form<TemplateFormValues> form={modalForm} layout="vertical" className={styles.modalForm}>
          <div className={styles.formGrid}>
            <Form.Item
              name="name"
              label="模板名称"
              rules={[{ required: true, whitespace: true, message: "请输入模板名称" }]}
            >
              <Input placeholder="例如：生产发布审批模板" />
            </Form.Item>
            <Form.Item
              name="code"
              label="模板编码"
              rules={[{ required: true, whitespace: true, message: "请输入模板编码" }]}
            >
              <Input placeholder="例如：release_prod_flow" />
            </Form.Item>
            <Form.Item
              name="bizType"
              label="业务类型"
              rules={[{ required: true, message: "请选择业务类型" }]}
            >
              <Select options={bizTypeOptions} placeholder="请选择业务类型" />
            </Form.Item>
            <Form.Item name="status" label="状态" initialValue="enable">
              <Select options={statusOptions} />
            </Form.Item>
          </div>

          <Form.Item name="description" label="模板说明">
            <Input.TextArea rows={3} placeholder="补充说明模板适用场景" />
          </Form.Item>

          <div className={styles.blockTitle}>审批节点</div>

          <Form.List name="nodes">
            {(fields, { add, remove }) => (
              <div className={styles.nodeList}>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    className={styles.nodeCard}
                    variant="borderless"
                    title={`节点 ${index + 1}`}
                    extra={
                      fields.length > 1 ? (
                        <Button type="link" danger onClick={() => remove(field.name)}>
                          删除节点
                        </Button>
                      ) : null
                    }
                  >
                    <div className={styles.formGrid}>
                      <Form.Item
                        name={[field.name, "nodeCode"]}
                        label="节点编码"
                        rules={[{ required: true, whitespace: true, message: "请输入节点编码" }]}
                      >
                        <Input placeholder="例如：leader_approve" />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "nodeName"]}
                        label="节点名称"
                        rules={[{ required: true, whitespace: true, message: "请输入节点名称" }]}
                      >
                        <Input placeholder="例如：负责人审批" />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "order"]}
                        label="排序"
                        rules={[{ required: true, message: "请输入排序" }]}
                      >
                        <InputNumber className={styles.fullWidth} min={1} precision={0} />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "approvalMode"]}
                        label="通过方式"
                        rules={[{ required: true, message: "请选择通过方式" }]}
                      >
                        <Select options={nodeModeOptions} />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "approverSourceType"]}
                        label="审批人来源"
                        rules={[{ required: true, message: "请选择审批人来源" }]}
                      >
                        <Select options={approverSourceOptions} />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "notifyChannels"]}
                        label="通知方式"
                        initialValue={["site"]}
                      >
                        <Select mode="multiple" options={notifyChannelOptions} />
                      </Form.Item>
                    </div>

                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, nextValues) => {
                        const prevType = prevValues.nodes?.[field.name]?.approverSourceType;
                        const nextType = nextValues.nodes?.[field.name]?.approverSourceType;
                        return prevType !== nextType;
                      }}
                    >
                      {() => {
                        const approverSourceType = modalForm.getFieldValue([
                          "nodes",
                          field.name,
                          "approverSourceType",
                        ]) as ApprovalApproverSourceType | undefined;

                        return (
                          <Form.Item
                            name={[field.name, "approverIds"]}
                            label={approverSourceType === "ROLE" ? "角色 ID" : "审批人"}
                            rules={[
                              {
                                required: true,
                                type: "array",
                                min: 1,
                                message: approverSourceType === "ROLE"
                                  ? "请至少填写一个角色 ID"
                                  : "请至少选择一位审批人",
                              },
                            ]}
                          >
                            {approverSourceType === "ROLE" ? (
                              <Select
                                mode="tags"
                                tokenSeparators={[",", "，", "\n"]}
                                placeholder="输入角色 ID，回车后添加"
                              />
                            ) : (
                              <Select
                                mode="multiple"
                                options={userOptions}
                                placeholder="请选择审批人"
                                optionFilterProp="label"
                              />
                            )}
                          </Form.Item>
                        );
                      }}
                    </Form.Item>

                    <div className={styles.switchRow}>
                      <Form.Item
                        name={[field.name, "allowTransfer"]}
                        label="允许转交"
                        valuePropName="checked"
                        initialValue
                      >
                        <Switch />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "allowAddApprover"]}
                        label="允许加签"
                        valuePropName="checked"
                        initialValue
                      >
                        <Switch />
                      </Form.Item>
                    </div>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  block
                  onClick={() =>
                    add({
                      ...defaultNodeValue,
                      order: fields.length + 1,
                    })
                  }
                >
                  新增审批节点
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </AppConsolePageShell>
  );
}
