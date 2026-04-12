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
  createApprovalPolicy,
  deleteApprovalPolicy,
  listApprovalPolicies,
  listApprovalTemplates,
  listUsers,
  updateApprovalPolicy,
  type ApprovalPolicyCondition,
  type ApprovalPolicyListParams,
  type ApprovalPolicyMatchMode,
  type ApprovalPolicyMutationPayload,
  type ApprovalPolicyRecord,
  type ApprovalPolicyRule,
  type ApprovalPolicyStatus,
  type ApprovalPolicyTargetType,
  type ApprovalTemplateRecord,
  type UserProfile,
} from "../../service/api";
import { formatDateTime } from "../../utils";
import styles from "./styles.module.less";

type SearchFormValues = Pick<
  ApprovalPolicyListParams,
  "name" | "code" | "targetType" | "status"
>;

type PolicyFormValues = ApprovalPolicyMutationPayload;

type PolicyModalState = {
  open: boolean;
  mode: "create" | "edit";
  record?: ApprovalPolicyRecord;
};

type PaginationState = {
  pageNum: number;
  pageSize: number;
  total: number;
};

const targetTypeOptions: Array<{ label: string; value: ApprovalPolicyTargetType }> = [
  { label: "发布审批", value: "release" },
  { label: "部署审批", value: "deployment" },
  { label: "接口门禁", value: "api_gate" },
];

const statusOptions: Array<{ label: string; value: ApprovalPolicyStatus }> = [
  { label: "启用", value: "enable" },
  { label: "禁用", value: "disable" },
];

const matchModeOptions: Array<{ label: string; value: ApprovalPolicyMatchMode }> = [
  { label: "首条命中规则", value: "first_match" },
];

const defaultRuleValue: ApprovalPolicyRule = {
  priority: 0,
  enabled: true,
  templateId: "",
  conditions: {},
};

function getPolicyId(record: Partial<ApprovalPolicyRecord>) {
  return record.id ?? record._id ?? "";
}

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

function normalizeRuleConditions(conditions?: ApprovalPolicyCondition) {
  return {
    tenantIds: normalizeIdList(conditions?.tenantIds),
    productIds: normalizeIdList(conditions?.productIds),
    applicationIds: normalizeIdList(conditions?.applicationIds),
    environments: normalizeIdList(conditions?.environments),
    operatorIds: normalizeIdList(conditions?.operatorIds),
    httpMethod: normalizeOptionalField(conditions?.httpMethod),
    gateCode: normalizeOptionalField(conditions?.gateCode),
  };
}

function buildSearchParams(values: SearchFormValues): SearchFormValues {
  return {
    name: normalizeOptionalField(values.name),
    code: normalizeOptionalField(values.code),
    targetType: values.targetType,
    status: values.status,
  };
}

function buildPolicyPayload(values: PolicyFormValues): ApprovalPolicyMutationPayload {
  return {
    name: values.name.trim(),
    code: values.code.trim(),
    status: values.status,
    targetType: values.targetType,
    targetCode: normalizeOptionalField(values.targetCode),
    matchMode: values.matchMode ?? "first_match",
    rules: (values.rules ?? []).map((rule) => ({
      priority: Number(rule.priority ?? 0),
      enabled: rule.enabled !== false,
      templateId: rule.templateId,
      conditions: normalizeRuleConditions(rule.conditions),
    })),
  };
}

function getTargetTypeLabel(value?: ApprovalPolicyTargetType) {
  return targetTypeOptions.find((item) => item.value === value)?.label ?? "未设置";
}

function getStatusLabel(value?: ApprovalPolicyStatus) {
  return statusOptions.find((item) => item.value === value)?.label ?? "启用";
}

export default function ApprovalPolicy() {
  const [searchForm] = Form.useForm<SearchFormValues>();
  const [modalForm] = Form.useForm<PolicyFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionKey, setActionKey] = useState("");
  const [reloadSeed, setReloadSeed] = useState(0);
  const [filters, setFilters] = useState<SearchFormValues>({});
  const [records, setRecords] = useState<ApprovalPolicyRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageNum: 1,
    pageSize: 10,
    total: 0,
  });
  const [templateOptions, setTemplateOptions] = useState<Array<{ label: string; value: string }>>(
    [],
  );
  const [userOptions, setUserOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [modalState, setModalState] = useState<PolicyModalState>({
    open: false,
    mode: "create",
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchPolicies() {
      setLoading(true);

      try {
        const response = await listApprovalPolicies({
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
          error instanceof Error ? error.message : "审批策略列表加载失败，请稍后重试";
        messageApi.error(errorMessage);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchPolicies();

    return () => {
      cancelled = true;
    };
  }, [filters, pagination.pageNum, pagination.pageSize, reloadSeed, messageApi]);

  useEffect(() => {
    let cancelled = false;

    async function fetchTemplates() {
      try {
        const response = await listApprovalTemplates({
          pageNum: 1,
          pageSize: 200,
        });

        if (!response.success || cancelled) {
          return;
        }

        setTemplateOptions(
          (response.data?.list ?? []).map((item) => {
            const id = getTemplateId(item);
            return {
              label: `${item.name} (${item.code})`,
              value: id,
            };
          }),
        );
      } catch {
        if (!cancelled) {
          setTemplateOptions([]);
        }
      }
    }

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

    void fetchTemplates();
    void fetchUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  const columns: TableProps<ApprovalPolicyRecord>["columns"] = [
    {
      title: "策略名称",
      dataIndex: "name",
      key: "name",
      width: 220,
      render: (value: string, record) => (
        <div>
          <div className={styles.tablePrimary}>{value}</div>
          <div className={styles.tableSecondary}>ID: {getPolicyId(record) || "未返回"}</div>
        </div>
      ),
    },
    {
      title: "策略编码",
      dataIndex: "code",
      key: "code",
      width: 180,
      render: (value: string) => <Tag className={styles.codeTag}>{value}</Tag>,
    },
    {
      title: "目标类型",
      dataIndex: "targetType",
      key: "targetType",
      width: 140,
      render: (value?: ApprovalPolicyTargetType) => (
        <Tag className={styles.targetTag}>{getTargetTypeLabel(value)}</Tag>
      ),
    },
    {
      title: "目标编码",
      dataIndex: "targetCode",
      key: "targetCode",
      width: 180,
      render: (value?: string) => value || <span className={styles.emptyText}>未限制</span>,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (value?: ApprovalPolicyStatus) => (
        <Tag className={value === "disable" ? styles.statusTagDisabled : styles.statusTagEnabled}>
          {getStatusLabel(value)}
        </Tag>
      ),
    },
    {
      title: "规则数",
      key: "rules",
      render: (_, record) => (
        <div>
          <div className={styles.tablePrimary}>{record.rules?.length ?? 0} 条规则</div>
          <div className={styles.tableSecondary}>
            匹配模式 {record.matchMode ?? "first_match"}
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
        const id = getPolicyId(record);

        return (
          <Space size={12}>
            <Button type="link" className={styles.actionButton} onClick={() => handleEdit(record)}>
              编辑
            </Button>
            <Popconfirm
              title="确认删除当前审批策略吗？"
              description="删除后相关审批单将无法再通过该策略匹配模板。"
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
      matchMode: "first_match",
      rules: [{ ...defaultRuleValue }],
    });

    setModalState({
      open: true,
      mode: "create",
    });
  }

  function handleEdit(record: ApprovalPolicyRecord) {
    modalForm.setFieldsValue({
      name: record.name,
      code: record.code,
      status: record.status ?? "enable",
      targetType: record.targetType,
      targetCode: record.targetCode,
      matchMode: record.matchMode ?? "first_match",
      rules:
        record.rules?.map((rule) => ({
          ...rule,
          conditions: {
            tenantIds: [...(rule.conditions?.tenantIds ?? [])],
            productIds: [...(rule.conditions?.productIds ?? [])],
            applicationIds: [...(rule.conditions?.applicationIds ?? [])],
            environments: [...(rule.conditions?.environments ?? [])],
            operatorIds: [...(rule.conditions?.operatorIds ?? [])],
            httpMethod: rule.conditions?.httpMethod,
            gateCode: rule.conditions?.gateCode,
          },
        })) ?? [{ ...defaultRuleValue }],
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

  async function handleDelete(record: ApprovalPolicyRecord) {
    const id = getPolicyId(record);
    if (!id) {
      messageApi.error("当前记录缺少 id，无法删除");
      return;
    }

    setActionKey(`delete:${id}`);

    try {
      const response = await deleteApprovalPolicy(id);

      if (!response.success) {
        return;
      }

      messageApi.success("审批策略已删除");
      setReloadSeed((prev) => prev + 1);
    } catch (error) {
      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "审批策略删除失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setActionKey("");
    }
  }

  async function handleSubmit() {
    try {
      const values = await modalForm.validateFields();
      const payload = buildPolicyPayload(values);

      setSubmitting(true);

      if (modalState.mode === "edit") {
        const id = getPolicyId(modalState.record ?? {});

        if (!id) {
          messageApi.error("当前记录缺少 id，无法更新");
          return;
        }

        const response = await updateApprovalPolicy({
          id,
          ...payload,
        });

        if (!response.success) {
          return;
        }

        messageApi.success("审批策略已更新");
      } else {
        const response = await createApprovalPolicy(payload);

        if (!response.success) {
          return;
        }

        messageApi.success("审批策略已创建");
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
        error instanceof Error ? error.message : "审批策略保存失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppConsolePageShell
      title="审批策略"
      subtitle="按目标类型和条件匹配审批模板，保持模板定义与业务准入规则分离。"
      note="这里仅处理审批策略的匹配规则。模板维护、审批发起与任务处理继续放在审批中心的其他二级菜单中。"
      actions={
        <Button type="primary" onClick={handleCreate}>
          新建策略
        </Button>
      }
    >
      {contextHolder}

      <Card className={styles.searchCard} variant="borderless">
        <Form<SearchFormValues> form={searchForm} className={styles.searchForm} onFinish={handleSearch}>
          <Form.Item className={styles.searchItem} name="name" label="策略名称">
            <Input placeholder="按策略名称搜索" allowClear />
          </Form.Item>
          <Form.Item className={styles.searchItem} name="code" label="策略编码">
            <Input placeholder="按策略编码搜索" allowClear />
          </Form.Item>
          <Form.Item className={styles.searchItem} name="targetType" label="目标类型">
            <Select placeholder="全部类型" allowClear options={targetTypeOptions} />
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
        <Table<ApprovalPolicyRecord>
          rowKey={(record) => getPolicyId(record)}
          loading={loading}
          columns={columns}
          dataSource={records}
          className={styles.policyTable}
          scroll={{ x: 1180 }}
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
        title={modalState.mode === "edit" ? "编辑审批策略" : "新建审批策略"}
        open={modalState.open}
        width={1080}
        onCancel={handleCloseModal}
        onOk={() => void handleSubmit()}
        okText={modalState.mode === "edit" ? "保存修改" : "创建策略"}
        cancelText="取消"
        confirmLoading={submitting}
        destroyOnHidden
      >
        <Form<PolicyFormValues> form={modalForm} layout="vertical" className={styles.modalForm}>
          <div className={styles.formGrid}>
            <Form.Item
              name="name"
              label="策略名称"
              rules={[{ required: true, whitespace: true, message: "请输入策略名称" }]}
            >
              <Input placeholder="例如：生产部署审批策略" />
            </Form.Item>
            <Form.Item
              name="code"
              label="策略编码"
              rules={[{ required: true, whitespace: true, message: "请输入策略编码" }]}
            >
              <Input placeholder="例如：deploy_prod_policy" />
            </Form.Item>
            <Form.Item
              name="targetType"
              label="目标类型"
              rules={[{ required: true, message: "请选择目标类型" }]}
            >
              <Select options={targetTypeOptions} placeholder="请选择目标类型" />
            </Form.Item>
            <Form.Item name="status" label="状态" initialValue="enable">
              <Select options={statusOptions} />
            </Form.Item>
            <Form.Item name="targetCode" label="目标编码">
              <Input placeholder="可选，限定某个具体业务编码" />
            </Form.Item>
            <Form.Item name="matchMode" label="匹配模式" initialValue="first_match">
              <Select options={matchModeOptions} />
            </Form.Item>
          </div>

          <div className={styles.blockTitle}>规则列表</div>

          <Form.List name="rules">
            {(fields, { add, remove }) => (
              <div className={styles.ruleList}>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    className={styles.ruleCard}
                    variant="borderless"
                    title={`规则 ${index + 1}`}
                    extra={
                      fields.length > 1 ? (
                        <Button type="link" danger onClick={() => remove(field.name)}>
                          删除规则
                        </Button>
                      ) : null
                    }
                  >
                    <div className={styles.formGrid}>
                      <Form.Item
                        name={[field.name, "priority"]}
                        label="优先级"
                        initialValue={0}
                      >
                        <InputNumber className={styles.fullWidth} precision={0} />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "templateId"]}
                        label="匹配模板"
                        rules={[{ required: true, message: "请选择匹配模板" }]}
                      >
                        <Select
                          options={templateOptions}
                          placeholder="请选择审批模板"
                          optionFilterProp="label"
                        />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "enabled"]}
                        label="是否启用"
                        valuePropName="checked"
                        initialValue
                      >
                        <Switch />
                      </Form.Item>
                    </div>

                    <div className={styles.conditionTitle}>匹配条件</div>

                    <div className={styles.formGrid}>
                      <Form.Item name={[field.name, "conditions", "tenantIds"]} label="租户 ID">
                        <Select
                          mode="tags"
                          tokenSeparators={[",", "，", "\n"]}
                          placeholder="输入租户 ID，回车后添加"
                        />
                      </Form.Item>
                      <Form.Item name={[field.name, "conditions", "productIds"]} label="产品 ID">
                        <Select
                          mode="tags"
                          tokenSeparators={[",", "，", "\n"]}
                          placeholder="输入产品 ID，回车后添加"
                        />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "conditions", "applicationIds"]}
                        label="应用 ID"
                      >
                        <Select
                          mode="tags"
                          tokenSeparators={[",", "，", "\n"]}
                          placeholder="输入应用 ID，回车后添加"
                        />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "conditions", "environments"]}
                        label="环境标识"
                      >
                        <Select
                          mode="tags"
                          tokenSeparators={[",", "，", "\n"]}
                          placeholder="输入环境标识，回车后添加"
                        />
                      </Form.Item>
                      <Form.Item name={[field.name, "conditions", "operatorIds"]} label="操作人">
                        <Select
                          mode="multiple"
                          options={userOptions}
                          placeholder="请选择操作人"
                          optionFilterProp="label"
                        />
                      </Form.Item>
                      <Form.Item name={[field.name, "conditions", "httpMethod"]} label="HTTP 方法">
                        <Input placeholder="例如：POST / PUT" />
                      </Form.Item>
                      <Form.Item name={[field.name, "conditions", "gateCode"]} label="门禁编码">
                        <Input placeholder="例如：deploy_gate_prod" />
                      </Form.Item>
                    </div>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  block
                  onClick={() =>
                    add({
                      ...defaultRuleValue,
                    })
                  }
                >
                  新增规则
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </AppConsolePageShell>
  );
}
