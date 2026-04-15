import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
} from "antd";
import type { TableProps } from "antd";
import { useNavigate } from "react-router-dom";
import {
  APP_ROUTE_PATHS,
  APPROVAL_TEMPLATE_STATUSES,
  buildConfigurationDetailPath,
  buildConfigurationEditPath,
  getApprovalTemplateStatusLabel,
  approvalTemplateStatusOptions as statusOptions,
} from "@constants";
import AppConsoleMenu from "@components/AppConsoleMenu";
import AppFooter from "@components/AppFooter";
import {
  deleteConfiguration,
  listConfigurations,
  updateConfiguration,
  type ConfigurationListParams,
  type ConfigurationRecord,
  type ConfigurationStatus,
} from "@service/api";
import { formatDateTime } from "@utils";
import styles from "./styles.module.less";

type SearchFormValues = Pick<ConfigurationListParams, "name" | "fileName" | "status">;

type PaginationState = {
  pageNum: number;
  pageSize: number;
  total: number;
};

function getConfigurationId(record: Partial<ConfigurationRecord>) {
  return record.id ?? record._id ?? "";
}

function normalizeOptionalField(value?: string) {
  const text = value?.trim();
  return text ? text : undefined;
}

function buildSearchParams(values: SearchFormValues): SearchFormValues {
  return {
    name: normalizeOptionalField(values.name),
    fileName: normalizeOptionalField(values.fileName),
    status: values.status,
  };
}

function getStatusLabel(status?: ConfigurationStatus) {
  return getApprovalTemplateStatusLabel(status);
}

export default function Configuration() {
  const navigate = useNavigate();
  const [searchForm] = Form.useForm<SearchFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [actionKey, setActionKey] = useState("");
  const [reloadSeed, setReloadSeed] = useState(0);
  const [filters, setFilters] = useState<SearchFormValues>({});
  const [records, setRecords] = useState<ConfigurationRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageNum: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchConfigurations() {
      setLoading(true);

      try {
        const response = await listConfigurations({
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
          error instanceof Error ? error.message : "配置列表加载失败，请稍后重试";
        messageApi.error(errorMessage);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchConfigurations();

    return () => {
      cancelled = true;
    };
  }, [filters, pagination.pageNum, pagination.pageSize, reloadSeed, messageApi]);

  const enabledCount = useMemo(
    () => records.filter((item) => item.status !== APPROVAL_TEMPLATE_STATUSES.DISABLE).length,
    [records],
  );

  const disabledCount = useMemo(
    () => records.filter((item) => item.status === APPROVAL_TEMPLATE_STATUSES.DISABLE).length,
    [records],
  );

  const extSummary = useMemo(() => {
    const summary = new Set(
      records
        .map((item) => item.ext?.trim())
        .filter((value): value is string => Boolean(value)),
    );

    return Array.from(summary).slice(0, 3).join(" / ") || "待补充";
  }, [records]);

  const columns: TableProps<ConfigurationRecord>["columns"] = [
    {
      title: "配置名称",
      dataIndex: "name",
      key: "name",
      width: 240,
      render: (value: string, record) => (
        <div>
          <div className={styles.tablePrimary}>{value}</div>
          <div className={styles.tableSecondary}>ID: {getConfigurationId(record) || "未返回"}</div>
        </div>
      ),
    },
    {
      title: "文件名称",
      dataIndex: "fileName",
      key: "fileName",
      width: 260,
      render: (value: string, record) => (
        <Tooltip title={value}>
          <div className={styles.fileCell}>
            <div className={styles.fileName}>{value}</div>
            <Tag className={styles.extTag}>{record.ext || "未设置扩展名"}</Tag>
          </div>
        </Tooltip>
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
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (value?: ConfigurationStatus) => (
        <Tag className={value === APPROVAL_TEMPLATE_STATUSES.DISABLE ? styles.statusTagDisabled : styles.statusTagEnabled}>
          {getStatusLabel(value)}
        </Tag>
      ),
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 280,
      render: (_, record) => {
        const id = getConfigurationId(record);
        const toggleActionKey = `${id}-toggle`;
        const deleteActionKey = `${id}-delete`;
        const nextStatus: ConfigurationStatus =
          record.status === APPROVAL_TEMPLATE_STATUSES.DISABLE
            ? APPROVAL_TEMPLATE_STATUSES.ENABLE
            : APPROVAL_TEMPLATE_STATUSES.DISABLE;

        return (
          <Space size={12} wrap>
            <Button
              type="link"
              className={styles.actionButton}
              onClick={() => navigate(buildConfigurationDetailPath(id))}
            >
              详情
            </Button>
            <Button
              type="link"
              className={styles.actionButton}
              onClick={() => navigate(buildConfigurationEditPath(id))}
            >
              编辑
            </Button>
            <Button
              type="link"
              className={record.status === APPROVAL_TEMPLATE_STATUSES.DISABLE ? styles.actionButton : styles.actionButtonWarn}
              loading={actionKey === toggleActionKey}
              onClick={() => void handleToggleStatus(record, nextStatus)}
            >
              {record.status === APPROVAL_TEMPLATE_STATUSES.DISABLE ? "启用" : "禁用"}
            </Button>
            <Popconfirm
              title="确认删除这份配置吗？"
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

  async function handleToggleStatus(record: ConfigurationRecord, status: ConfigurationStatus) {
    const id = getConfigurationId(record);

    if (!id) {
      messageApi.error("当前记录缺少 id，无法更新状态");
      return;
    }

    const currentActionKey = `${id}-toggle`;
    setActionKey(currentActionKey);

    try {
      const response = await updateConfiguration({
        id,
        status,
      });

      if (!response.success) {
        return;
      }

      messageApi.success(status === APPROVAL_TEMPLATE_STATUSES.ENABLE ? "配置已启用" : "配置已禁用");
      setReloadSeed((prev) => prev + 1);
    } catch (error) {
      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "状态更新失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setActionKey("");
    }
  }

  async function handleDelete(record: ConfigurationRecord) {
    const id = getConfigurationId(record);

    if (!id) {
      messageApi.error("当前记录缺少 id，无法删除");
      return;
    }

    const currentActionKey = `${id}-delete`;
    setActionKey(currentActionKey);

    try {
      const response = await deleteConfiguration({ id });

      if (!response.success) {
        return;
      }

      messageApi.success("配置已删除");

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
        error instanceof Error ? error.message : "配置删除失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setActionKey("");
    }
  }

  return (
    <div className={styles.configurationPage}>
      {contextHolder}

      <div className={styles.configurationBody}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>菜单</div>
          <AppConsoleMenu />
          <div className={styles.sidebarNote}>
            当前页面用于维护部署关联配置文件，列表页聚焦资源检索、状态切换与进入编辑页。
          </div>
        </aside>

        <main className={styles.mainSection}>
          <section className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>配置管理</div>
              <div className={styles.sectionSubtitle}>
                列表页专注管理配置资源本身，配置内容在独立编辑页中维护与预览。
              </div>
            </div>
            <Space className={styles.quickActions}>
              <Button type="primary" onClick={() => navigate(APP_ROUTE_PATHS.CONFIGURATION_CREATE)}>
                新建配置
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
              <Form.Item label="配置名称" name="name" className={styles.searchItem}>
                <Input placeholder="输入配置名称搜索" allowClear />
              </Form.Item>
              <Form.Item label="文件名称" name="fileName" className={styles.searchItem}>
                <Input placeholder="输入 fileName 搜索" allowClear />
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
            <Table<ConfigurationRecord>
              className={styles.configurationTable}
              rowKey={(record) => getConfigurationId(record) || `${record.fileName}-${record.name}`}
              columns={columns}
              dataSource={records}
              loading={loading}
              tableLayout="fixed"
              scroll={{ x: 1080 }}
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
                <div className={styles.statLabel}>配置总数</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{enabledCount}</div>
                <div className={styles.statLabel}>当前页启用</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{disabledCount}</div>
                <div className={styles.statLabel}>当前页禁用</div>
              </div>
            </div>
          </Card>

          <Card className={styles.insightCard} variant="borderless">
            <div className={styles.insightTitle}>管理说明</div>
            <ul className={styles.fieldList}>
              <li className={styles.fieldItem}>
                <span className={styles.fieldName}>编辑方式</span>
                <span className={styles.fieldDesc}>点击“编辑”进入独立页面，集中维护名称、文件名称、扩展名和配置正文。</span>
              </li>
              <li className={styles.fieldItem}>
                <span className={styles.fieldName}>状态控制</span>
                <span className={styles.fieldDesc}>启用/禁用已收敛到操作区，方便直接切换配置可用状态。</span>
              </li>
              <li className={styles.fieldItem}>
                <span className={styles.fieldName}>当前扩展名</span>
                <span className={styles.fieldDesc}>{extSummary}</span>
              </li>
            </ul>
          </Card>
        </aside>
      </div>

      <AppFooter />
    </div>
  );
}
