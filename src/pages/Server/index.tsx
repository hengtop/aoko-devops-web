import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Descriptions,
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
import {
  EDITOR_PAGE_MODES,
  SERVER_AUTH_TYPES,
  SERVER_STATUSES,
  serverAuthTypeOptions as authTypeOptions,
  serverStatusOptions as statusOptions,
} from "@constants";
import AppConsoleMenu from "@components/AppConsoleMenu";
import AppFooter from "@components/AppFooter";
import {
  createServer,
  deleteServer,
  getServerDetail,
  listServers,
  testServerConnection,
  updateServer,
  type ServerAuthType,
  type ServerConnectionTestResult,
  type ServerListParams,
  type ServerMutationPayload,
  type ServerRecord,
  type ServerStatus,
} from "@service/api";
import { formatDateTime } from "@utils";
import styles from "./styles.module.less";

type SearchFormValues = Pick<ServerListParams, "name" | "merchant" | "status">;

type ServerFormValues = Required<Pick<ServerMutationPayload, "status">> &
  Omit<ServerMutationPayload, "status">;

type ServerModalState = {
  open: boolean;
  mode: typeof EDITOR_PAGE_MODES.CREATE | typeof EDITOR_PAGE_MODES.EDIT;
  record?: ServerRecord;
};

type ServerDetailState = {
  open: boolean;
  record?: ServerRecord;
};

type ConnectionTestState = {
  open: boolean;
  loading: boolean;
  result?: ServerConnectionTestResult;
  target?: ServerRecord;
};

type PaginationState = {
  pageNum: number;
  pageSize: number;
  total: number;
};

function getServerId(record: Partial<ServerRecord>) {
  return record.id ?? record._id ?? "";
}

function normalizeOptionalField(value?: string) {
  const text = value?.trim();
  return text ? text : undefined;
}

function buildSearchParams(values: SearchFormValues): SearchFormValues {
  return {
    name: normalizeOptionalField(values.name),
    merchant: normalizeOptionalField(values.merchant),
    status: values.status,
  };
}

function buildServerMutationPayload(
  values: ServerFormValues,
  mode: typeof EDITOR_PAGE_MODES.CREATE | typeof EDITOR_PAGE_MODES.EDIT,
  originalAuthType?: ServerAuthType,
): ServerMutationPayload {
  const authType = values.auth_type;
  const payload: ServerMutationPayload = {
    name: values.name.trim(),
    ip: normalizeOptionalField(values.ip),
    merchant: normalizeOptionalField(values.merchant),
    auth_type: authType,
    description: normalizeOptionalField(values.description),
    status: values.status,
  };

  if (authType === "password") {
    payload.username = normalizeOptionalField(values.username);
    const password = normalizeOptionalField(values.password);

    if (mode === EDITOR_PAGE_MODES.CREATE || authType !== originalAuthType || password) {
      payload.password = password;
    }
  }

  if (authType === "key") {
    const publicKey = normalizeOptionalField(values.public_key);
    const privateKey = normalizeOptionalField(values.private_key);

    if (mode === EDITOR_PAGE_MODES.CREATE || authType !== originalAuthType || publicKey) {
      payload.public_key = publicKey;
    }

    if (mode === EDITOR_PAGE_MODES.CREATE || authType !== originalAuthType || privateKey) {
      payload.private_key = privateKey;
    }
  }

  return payload;
}

function formatServerStatus(status?: ServerStatus) {
  return status === SERVER_STATUSES.DISABLE ? "禁用" : "启用";
}

function formatAuthType(authType?: ServerAuthType) {
  return authType === SERVER_AUTH_TYPES.KEY ? "密钥认证" : "账号密码";
}

function formatPercent(value?: number) {
  if (typeof value !== "number") {
    return "暂无数据";
  }

  return `${value.toFixed(1)}%`;
}

function formatCapacityGb(value?: number) {
  if (typeof value !== "number") {
    return "暂无数据";
  }

  return `${value.toFixed(2)} GB`;
}

function formatLoadAverage(
  loadAvg?: ServerConnectionTestResult["systemInfo"] extends infer T
    ? T extends { loadAvg?: infer L }
      ? L
      : never
    : never,
) {
  if (!loadAvg) {
    return "暂无数据";
  }

  const values = [loadAvg.m1, loadAvg.m5, loadAvg.m15]
    .map((item) => (typeof item === "number" ? item.toFixed(2) : "--"))
    .join(" / ");

  return values;
}

export default function Server() {
  const [searchForm] = Form.useForm<SearchFormValues>();
  const [modalForm] = Form.useForm<ServerFormValues>();
  const authType = Form.useWatch("auth_type", modalForm);
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionKey, setActionKey] = useState("");
  const [reloadSeed, setReloadSeed] = useState(0);
  const [filters, setFilters] = useState<SearchFormValues>({});
  const [records, setRecords] = useState<ServerRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageNum: 1,
    pageSize: 10,
    total: 0,
  });
  const [modalState, setModalState] = useState<ServerModalState>({
    open: false,
    mode: "create",
  });
  const [detailState, setDetailState] = useState<ServerDetailState>({
    open: false,
  });
  const [connectionTestState, setConnectionTestState] = useState<ConnectionTestState>({
    open: false,
    loading: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchServers() {
      setLoading(true);

      try {
        const response = await listServers({
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
          error instanceof Error ? error.message : "服务器列表加载失败，请稍后重试";
        messageApi.error(errorMessage);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchServers();

    return () => {
      cancelled = true;
    };
  }, [filters, pagination.pageNum, pagination.pageSize, reloadSeed, messageApi]);

  const enabledCount = useMemo(
    () => records.filter((item) => item.status !== SERVER_STATUSES.DISABLE).length,
    [records],
  );

  const keyAuthCount = useMemo(
    () => records.filter((item) => item.auth_type === SERVER_AUTH_TYPES.KEY).length,
    [records],
  );

  const merchantSummary = useMemo(() => {
    const summary = new Set(
      records
        .map((item) => item.merchant?.trim())
        .filter((value): value is string => Boolean(value)),
    );

    return Array.from(summary).slice(0, 3).join(" / ") || "待补充";
  }, [records]);

  const columns: TableProps<ServerRecord>["columns"] = [
    {
      title: "服务器名称",
      dataIndex: "name",
      key: "name",
      width: 220,
      render: (value: string, record) => (
        <div>
          <div className={styles.tablePrimary}>{value}</div>
          <div className={styles.tableSecondary}>ID: {getServerId(record) || "未返回"}</div>
        </div>
      ),
    },
    {
      title: "连接信息",
      key: "connection",
      width: 220,
      render: (_, record) => (
        <div className={styles.serverMeta}>
          <div className={styles.serverIp}>{record.ip || "未配置 IP"}</div>
          <div className={styles.tableSecondary}>{record.merchant || "未设置归属/厂商"}</div>
        </div>
      ),
    },
    {
      title: "认证方式",
      dataIndex: "auth_type",
      key: "auth_type",
      width: 120,
      render: (value?: ServerAuthType) => (
        <Tag className={value === SERVER_AUTH_TYPES.KEY ? styles.authTagKey : styles.authTagPassword}>
          {formatAuthType(value)}
        </Tag>
      ),
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (value?: string) => value || <span className={styles.emptyTag}>暂无描述</span>,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (value?: ServerStatus) => (
        <Tag className={value === "disable" ? styles.statusTagDisabled : styles.statusTagEnabled}>
          {formatServerStatus(value)}
        </Tag>
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
      width: 360,
      render: (_, record) => {
        const id = getServerId(record);
        const toggleActionKey = `${id}-toggle`;
        const deleteActionKey = `${id}-delete`;
        const testActionKey = `${id}-test`;
        const nextStatus: ServerStatus =
          record.status === SERVER_STATUSES.DISABLE
            ? SERVER_STATUSES.ENABLE
            : SERVER_STATUSES.DISABLE;

        return (
          <Space size={12} wrap>
            <Button type="link" className={styles.actionButton} onClick={() => void handleOpenDetail(record)}>
              详情
            </Button>
            <Button type="link" className={styles.actionButton} onClick={() => void handleEdit(record)}>
              编辑
            </Button>
            <Button
              type="link"
              className={styles.actionButtonInfo}
              loading={actionKey === testActionKey}
              onClick={() => void handleTestConnection(record)}
            >
              测试连接
            </Button>
            <Button
              type="link"
              className={record.status === SERVER_STATUSES.DISABLE ? styles.actionButton : styles.actionButtonWarn}
              loading={actionKey === toggleActionKey}
              onClick={() => void handleToggleStatus(record, nextStatus)}
            >
              {record.status === SERVER_STATUSES.DISABLE ? "启用" : "禁用"}
            </Button>
            <Popconfirm
              title="确认删除这台服务器吗？"
              description="删除后不可恢复，请确认未被其他部署流程引用。"
              okText="确认删除"
              cancelText="取消"
              onConfirm={() => void handleDelete(record)}
            >
              <Button
                type="link"
                danger
                className={styles.actionButtonDanger}
                loading={actionKey === deleteActionKey}
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
    modalForm.resetFields();
    modalForm.setFieldsValue({
      status: SERVER_STATUSES.ENABLE,
      auth_type: SERVER_AUTH_TYPES.PASSWORD,
    });
    setModalState({
      open: true,
      mode: EDITOR_PAGE_MODES.CREATE,
    });
  }

  async function handleEdit(record: ServerRecord) {
    const id = getServerId(record);

    if (!id) {
      messageApi.error("当前记录缺少 id，无法编辑");
      return;
    }

    try {
      const response = await getServerDetail(id);

      if (!response.success || !response.data) {
        return;
      }

      modalForm.resetFields();
      modalForm.setFieldsValue({
        name: response.data.name,
        ip: response.data.ip,
        merchant: response.data.merchant,
        auth_type: response.data.auth_type,
        username: response.data.username,
        description: response.data.description,
        status: response.data.status ?? SERVER_STATUSES.ENABLE,
      });

      setModalState({
        open: true,
        mode: EDITOR_PAGE_MODES.EDIT,
        record: response.data,
      });
    } catch (error) {
      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "服务器详情加载失败，请稍后重试";
      messageApi.error(errorMessage);
    }
  }

  async function handleOpenDetail(record: ServerRecord) {
    const id = getServerId(record);

    if (!id) {
      messageApi.error("当前记录缺少 id，无法查看详情");
      return;
    }

    try {
      const response = await getServerDetail(id);

      if (!response.success || !response.data) {
        return;
      }

      setDetailState({
        open: true,
        record: response.data,
      });
    } catch (error) {
      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "服务器详情加载失败，请稍后重试";
      messageApi.error(errorMessage);
    }
  }

  function handleCloseDetail() {
    setDetailState({
      open: false,
    });
  }

  function handleCloseModal() {
    setModalState({
      open: false,
      mode: EDITOR_PAGE_MODES.CREATE,
    });
    modalForm.resetFields();
  }

  async function handleToggleStatus(record: ServerRecord, status: ServerStatus) {
    const id = getServerId(record);

    if (!id) {
      messageApi.error("当前记录缺少 id，无法更新状态");
      return;
    }

    const currentActionKey = `${id}-toggle`;
    setActionKey(currentActionKey);

    try {
      const response = await updateServer({
        id,
        status,
      });

      if (!response.success) {
        return;
      }

      messageApi.success(status === SERVER_STATUSES.ENABLE ? "服务器已启用" : "服务器已禁用");
      setReloadSeed((prev) => prev + 1);
    } catch (error) {
      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "服务器状态更新失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setActionKey("");
    }
  }

  async function handleDelete(record: ServerRecord) {
    const id = getServerId(record);

    if (!id) {
      messageApi.error("当前记录缺少 id，无法删除");
      return;
    }

    const currentActionKey = `${id}-delete`;
    setActionKey(currentActionKey);

    try {
      const response = await deleteServer({ id });

      if (!response.success) {
        return;
      }

      messageApi.success("服务器已删除");

      const isLastItemOnPage = records.length === 1 && pagination.pageNum > 1;
      setPagination((prev) => ({
        ...prev,
        pageNum: isLastItemOnPage ? prev.pageNum - 1 : prev.pageNum,
      }));
      setReloadSeed((prev) => prev + 1);
    } catch (error) {
      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "服务器删除失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setActionKey("");
    }
  }

  async function handleSubmitModal() {
    try {
      const values = await modalForm.validateFields();
      const payload = buildServerMutationPayload(
        values,
        modalState.mode,
        modalState.record?.auth_type,
      );

      setSubmitting(true);

      if (modalState.mode === EDITOR_PAGE_MODES.EDIT) {
        const id = getServerId(modalState.record ?? {});

        if (!id) {
          messageApi.error("当前记录缺少 id，无法更新");
          return;
        }

        const response = await updateServer({
          id,
          ...payload,
        });

        if (!response.success) {
          return;
        }

        messageApi.success("服务器已更新");
      } else {
        const response = await createServer(payload);

        if (!response.success) {
          return;
        }

        messageApi.success("服务器已创建");
      }

      handleCloseModal();
      setPagination((prev) => ({
        ...prev,
        pageNum: modalState.mode === EDITOR_PAGE_MODES.CREATE ? 1 : prev.pageNum,
      }));
      setReloadSeed((prev) => prev + 1);
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) {
        return;
      }

      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "服务器保存失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTestConnection(record: ServerRecord) {
    const id = getServerId(record);

    if (!id) {
      messageApi.error("当前记录缺少 id，无法测试连接");
      return;
    }

    const currentActionKey = `${id}-test`;
    setActionKey(currentActionKey);
    setConnectionTestState({
      open: true,
      loading: true,
      target: record,
    });

    try {
      const response = await testServerConnection(id);

      if (!response.success || !response.data) {
        return;
      }

      setConnectionTestState({
        open: true,
        loading: false,
        target: record,
        result: response.data,
      });
    } catch (error) {
      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "服务器连接测试失败，请稍后重试";
      messageApi.error(errorMessage);
      setConnectionTestState({
        open: true,
        loading: false,
        target: record,
      });
    } finally {
      setActionKey("");
    }
  }

  function handleCloseConnectionTest() {
    setConnectionTestState({
      open: false,
      loading: false,
    });
  }

  const detailRecord = detailState.record;
  const connectionResult = connectionTestState.result;

  return (
    <div className={styles.serverPage}>
      {contextHolder}

      <div className={styles.serverBody}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>菜单</div>
          <AppConsoleMenu />
          <div className={styles.sidebarNote}>
            当前页面用于维护服务器资源、认证方式与运行状态，并提供 SSH 连通性测试能力。
          </div>
        </aside>

        <main className={styles.mainSection}>
          <section className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>服务器管理</div>
              <div className={styles.sectionSubtitle}>
                对照后端 `server` 模块，统一维护服务器基础信息、认证方式和连接可用性。
              </div>
            </div>
            <Space className={styles.quickActions}>
              <Button type="primary" onClick={handleCreate}>
                新建服务器
              </Button>
              <Button type="default" onClick={() => setReloadSeed((prev) => prev + 1)}>
                刷新数据
              </Button>
            </Space>
          </section>

          <Card className={styles.searchCard} variant="borderless">
            <Form<SearchFormValues>
              form={searchForm}
              layout="vertical"
              className={styles.searchForm}
              onFinish={handleSearch}
            >
              <Form.Item label="服务器名称" name="name" className={styles.searchItem}>
                <Input placeholder="输入服务器名称搜索" allowClear />
              </Form.Item>
              <Form.Item label="归属/厂商" name="merchant" className={styles.searchItem}>
                <Input placeholder="输入 merchant 搜索" allowClear />
              </Form.Item>
              <Form.Item label="状态" name="status" className={styles.searchItem}>
                <Select placeholder="选择状态" allowClear options={statusOptions} />
              </Form.Item>
              <div className={styles.searchActions}>
                <Button type="primary" htmlType="submit">
                  查询
                </Button>
                <Button htmlType="button" onClick={handleReset}>
                  重置
                </Button>
              </div>
            </Form>
          </Card>

          <Card className={styles.tableCard} variant="borderless">
            <Table<ServerRecord>
              className={styles.serverTable}
              rowKey={(record) => getServerId(record) || `${record.name}-${record.ip}`}
              columns={columns}
              dataSource={records}
              loading={loading}
              tableLayout="fixed"
              scroll={{ x: 1480 }}
              pagination={{
                current: pagination.pageNum,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
              }}
              onChange={(tablePagination) => {
                setPagination((prev) => ({
                  ...prev,
                  pageNum: tablePagination.current ?? prev.pageNum,
                  pageSize: tablePagination.pageSize ?? prev.pageSize,
                }));
              }}
            />
          </Card>
        </main>

        <aside className={styles.insightPanel}>
          <Card className={styles.insightCard} variant="borderless">
            <div className={styles.insightTitle}>当前视图</div>
            <div className={styles.statList}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{pagination.total}</div>
                <div className={styles.statLabel}>服务器总数</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{enabledCount}</div>
                <div className={styles.statLabel}>当前页启用</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{keyAuthCount}</div>
                <div className={styles.statLabel}>密钥认证数</div>
              </div>
            </div>
          </Card>

          <Card className={styles.insightCard} variant="borderless">
            <div className={styles.insightTitle}>录入建议</div>
            <ul className={styles.fieldList}>
              <li className={styles.fieldItem}>
                <span className={styles.fieldName}>name / ip</span>
                <span className={styles.fieldDesc}>优先维护可识别的服务器名称与稳定 IP，便于部署过程快速定位。</span>
              </li>
              <li className={styles.fieldItem}>
                <span className={styles.fieldName}>auth_type</span>
                <span className={styles.fieldDesc}>支持账号密码与密钥认证，两类凭证录入方式会自动切换。</span>
              </li>
              <li className={styles.fieldItem}>
                <span className={styles.fieldName}>merchant</span>
                <span className={styles.fieldDesc}>{merchantSummary}</span>
              </li>
            </ul>
          </Card>
        </aside>
      </div>

      <AppFooter />

      <Modal
        title={modalState.mode === EDITOR_PAGE_MODES.EDIT ? "编辑服务器" : "新建服务器"}
        open={modalState.open}
        onCancel={handleCloseModal}
        onOk={() => void handleSubmitModal()}
        confirmLoading={submitting}
        okText={modalState.mode === EDITOR_PAGE_MODES.EDIT ? "保存修改" : "创建服务器"}
        cancelText="取消"
        width={760}
      >
        <Form<ServerFormValues>
          form={modalForm}
          layout="vertical"
          className={styles.modalForm}
          initialValues={{ status: SERVER_STATUSES.ENABLE, auth_type: SERVER_AUTH_TYPES.PASSWORD }}
        >
          <div className={styles.modalGrid}>
            <Form.Item
              name="name"
              label="服务器名称"
              rules={[{ required: true, whitespace: true, message: "请输入服务器名称" }]}
            >
              <Input placeholder="例如：生产环境应用节点-01" />
            </Form.Item>
            <Form.Item name="ip" label="IP 地址">
              <Input placeholder="例如：10.20.30.40" />
            </Form.Item>
          </div>

          <div className={styles.modalGrid}>
            <Form.Item name="merchant" label="归属/厂商">
              <Input placeholder="例如：阿里云 / 腾讯云 / 自建机房" />
            </Form.Item>
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: "请选择状态" }]}
            >
              <Select options={statusOptions} placeholder="选择状态" />
            </Form.Item>
          </div>

          <Form.Item
            name="auth_type"
            label="认证方式"
            rules={[{ required: true, message: "请选择认证方式" }]}
          >
            <Select options={authTypeOptions} placeholder="选择认证方式" />
          </Form.Item>

          {authType === "password" ? (
            <div className={styles.modalGrid}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: "请输入登录用户名",
                  },
                ]}
              >
                <Input placeholder="例如：root / ubuntu / deploy" />
              </Form.Item>
              <Form.Item
                name="password"
                label="密码"
                extra={modalState.mode === EDITOR_PAGE_MODES.EDIT ? "留空表示保持当前密码不变" : undefined}
                rules={[
                  {
                    required:
                      modalState.mode === EDITOR_PAGE_MODES.CREATE ||
                      modalState.record?.auth_type !== SERVER_AUTH_TYPES.PASSWORD,
                    whitespace: true,
                    message: "请输入登录密码",
                  },
                ]}
              >
                <Input.Password placeholder="输入 SSH 登录密码" />
              </Form.Item>
            </div>
          ) : null}

          {authType === "key" ? (
            <div className={styles.keyGrid}>
              <Form.Item
                name="public_key"
                label="公钥"
                extra={modalState.mode === EDITOR_PAGE_MODES.EDIT ? "留空表示保持当前公钥不变" : undefined}
                rules={[
                  {
                    required:
                      modalState.mode === EDITOR_PAGE_MODES.CREATE ||
                      modalState.record?.auth_type !== SERVER_AUTH_TYPES.KEY,
                    whitespace: true,
                    message: "请输入公钥",
                  },
                ]}
              >
                <Input.TextArea rows={4} placeholder="输入公钥内容" spellCheck={false} />
              </Form.Item>
              <Form.Item
                name="private_key"
                label="私钥"
                extra={modalState.mode === EDITOR_PAGE_MODES.EDIT ? "留空表示保持当前私钥不变" : undefined}
                rules={[
                  {
                    required:
                      modalState.mode === EDITOR_PAGE_MODES.CREATE ||
                      modalState.record?.auth_type !== SERVER_AUTH_TYPES.KEY,
                    whitespace: true,
                    message: "请输入私钥",
                  },
                ]}
              >
                <Input.TextArea rows={6} placeholder="输入私钥内容" spellCheck={false} />
              </Form.Item>
            </div>
          ) : null}

          <Form.Item name="description" label="描述">
            <Input.TextArea
              rows={3}
              placeholder="补充服务器用途、环境、网络限制等说明"
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="服务器详情"
        open={detailState.open}
        onCancel={handleCloseDetail}
        footer={null}
        width={760}
      >
        {detailRecord ? (
          <div className={styles.detailPanel}>
            <Descriptions
              className={styles.detailDescriptions}
              column={2}
              items={[
                { key: "name", label: "服务器名称", children: detailRecord.name || "暂无数据" },
                { key: "ip", label: "IP 地址", children: detailRecord.ip || "暂无数据" },
                { key: "merchant", label: "归属/厂商", children: detailRecord.merchant || "暂无数据" },
                {
                  key: "auth_type",
                  label: "认证方式",
                  children: formatAuthType(detailRecord.auth_type),
                },
                {
                  key: "status",
                  label: "状态",
                  children: (
                    <Tag
                      className={
                        detailRecord.status === "disable"
                          ? styles.statusTagDisabled
                          : styles.statusTagEnabled
                      }
                    >
                      {formatServerStatus(detailRecord.status)}
                    </Tag>
                  ),
                },
                {
                  key: "updatedAt",
                  label: "更新时间",
                  children: formatDateTime(detailRecord.updatedAt),
                },
                {
                  key: "username",
                  label: "用户名",
                  children:
                    detailRecord.auth_type === "password"
                      ? detailRecord.username || "未配置"
                      : "当前认证方式无需用户名",
                },
                {
                  key: "credential",
                  label: "凭证状态",
                  children:
                    detailRecord.auth_type === "key"
                      ? detailRecord.private_key || detailRecord.public_key
                        ? "已配置密钥"
                        : "未配置密钥"
                      : detailRecord.password
                        ? "已配置密码"
                        : "未配置密码",
                },
                {
                  key: "description",
                  label: "描述",
                  span: 2,
                  children: detailRecord.description || "暂无描述",
                },
              ]}
            />
          </div>
        ) : null}
      </Modal>

      <Modal
        title="服务器连接测试"
        open={connectionTestState.open}
        onCancel={handleCloseConnectionTest}
        footer={null}
        width={860}
      >
        <div className={styles.connectionPanel}>
          <Alert
            type={connectionResult?.reachable ? "success" : "warning"}
            showIcon
            message={
              connectionResult
                ? connectionResult.reachable
                  ? "连接成功"
                  : "连接失败"
                : connectionTestState.loading
                  ? "正在测试连接"
                  : "暂无测试结果"
            }
            description={
              connectionTestState.loading
                ? "正在建立 SSH 连接并采集系统信息，请稍候。"
                : connectionResult?.message || "测试完成后会在这里展示连接结果与系统指标。"
            }
          />

          <div className={styles.connectionStats}>
            <div className={styles.connectionStat}>
              <div className={styles.connectionStatLabel}>目标服务器</div>
              <div className={styles.connectionStatValue}>
                {connectionResult?.name || connectionTestState.target?.name || "未选择"}
              </div>
            </div>
            <div className={styles.connectionStat}>
              <div className={styles.connectionStatLabel}>耗时</div>
              <div className={styles.connectionStatValue}>
                {connectionResult ? `${connectionResult.latencyMs} ms` : "--"}
              </div>
            </div>
            <div className={styles.connectionStat}>
              <div className={styles.connectionStatLabel}>检测时间</div>
              <div className={styles.connectionStatValue}>
                {connectionResult ? formatDateTime(connectionResult.checkedAt) : "--"}
              </div>
            </div>
          </div>

          {connectionResult?.systemInfo ? (
            <div className={styles.systemGrid}>
              <Card className={styles.systemCard} variant="borderless">
                <div className={styles.systemTitle}>系统信息</div>
                <div className={styles.systemList}>
                  <div className={styles.systemItem}>
                    <span>主机名</span>
                    <strong>{connectionResult.systemInfo.hostname || "暂无数据"}</strong>
                  </div>
                  <div className={styles.systemItem}>
                    <span>系统版本</span>
                    <strong>{connectionResult.systemInfo.osPrettyName || "暂无数据"}</strong>
                  </div>
                  <div className={styles.systemItem}>
                    <span>内核</span>
                    <strong>{connectionResult.systemInfo.kernel || "暂无数据"}</strong>
                  </div>
                  <div className={styles.systemItem}>
                    <span>架构</span>
                    <strong>{connectionResult.systemInfo.arch || "暂无数据"}</strong>
                  </div>
                  <div className={styles.systemItem}>
                    <span>运行时长</span>
                    <strong>{connectionResult.systemInfo.uptime || "暂无数据"}</strong>
                  </div>
                </div>
              </Card>

              <Card className={styles.systemCard} variant="borderless">
                <div className={styles.systemTitle}>资源指标</div>
                <div className={styles.systemList}>
                  <div className={styles.systemItem}>
                    <span>CPU</span>
                    <strong>
                      {connectionResult.systemInfo.cpu?.model
                        ? `${connectionResult.systemInfo.cpu.model} / ${connectionResult.systemInfo.cpu.cores ?? "--"} 核`
                        : "暂无数据"}
                    </strong>
                  </div>
                  <div className={styles.systemItem}>
                    <span>负载均值</span>
                    <strong>{formatLoadAverage(connectionResult.systemInfo.loadAvg)}</strong>
                  </div>
                  <div className={styles.systemItem}>
                    <span>内存占用</span>
                    <strong>{formatPercent(connectionResult.systemInfo.memory?.usedPercent)}</strong>
                  </div>
                  <div className={styles.systemItem}>
                    <span>内存总量</span>
                    <strong>{formatCapacityGb(connectionResult.systemInfo.memory?.totalGb)}</strong>
                  </div>
                  <div className={styles.systemItem}>
                    <span>磁盘占用</span>
                    <strong>{formatPercent(connectionResult.systemInfo.disk?.root?.usedPercent)}</strong>
                  </div>
                  <div className={styles.systemItem}>
                    <span>磁盘总量</span>
                    <strong>{formatCapacityGb(connectionResult.systemInfo.disk?.root?.totalBytes ? connectionResult.systemInfo.disk.root.totalBytes / 1024 / 1024 / 1024 : undefined)}</strong>
                  </div>
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
