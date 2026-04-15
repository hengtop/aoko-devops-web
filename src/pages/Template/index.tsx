import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
} from "antd";
import type { TableProps } from "antd";
import { useNavigate } from "react-router-dom";
import { EDITOR_PAGE_MODES, buildConfigurationDetailPath } from "@constants";
import AppConsoleMenu from "@components/AppConsoleMenu";
import AppFooter from "@components/AppFooter";
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
  updateTemplate,
  type TemplateListParams,
  type TemplateMutationPayload,
  type TemplateRecord,
} from "@service/api";
import styles from "./styles.module.less";

type SearchFormValues = Pick<TemplateListParams, "name" | "code" | "repo_url">;

type TemplateFormValues = TemplateMutationPayload;

type TemplateModalState = {
  open: boolean;
  mode: (typeof EDITOR_PAGE_MODES)[keyof typeof EDITOR_PAGE_MODES];
  record?: TemplateRecord;
};

type PaginationState = {
  pageNum: number;
  pageSize: number;
  total: number;
};

function getTemplateId(record: Partial<TemplateRecord>) {
  return record.id ?? record._id ?? "";
}

function normalizeOptionalField(value?: string) {
  const text = value?.trim();
  return text ? text : undefined;
}

function buildSearchParams(values: SearchFormValues): SearchFormValues {
  return {
    name: normalizeOptionalField(values.name),
    code: normalizeOptionalField(values.code),
    repo_url: normalizeOptionalField(values.repo_url),
  };
}

function buildMutationPayload(values: TemplateFormValues): TemplateMutationPayload {
  return {
    name: values.name.trim(),
    code: values.code.trim(),
    repo_url: values.repo_url.trim(),
    description: normalizeOptionalField(values.description),
    pipeline_cfg_id: normalizeOptionalField(values.pipeline_cfg_id),
    publish_cfg_id: normalizeOptionalField(values.publish_cfg_id),
  };
}

function formatLinkedConfigurationId(value: string) {
  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export default function Template() {
  const navigate = useNavigate();
  const [searchForm] = Form.useForm<SearchFormValues>();
  const [modalForm] = Form.useForm<TemplateFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reloadSeed, setReloadSeed] = useState(0);
  const [filters, setFilters] = useState<SearchFormValues>({});
  const [records, setRecords] = useState<TemplateRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageNum: 1,
    pageSize: 10,
    total: 0,
  });
  const [modalState, setModalState] = useState<TemplateModalState>({
    open: false,
    mode: EDITOR_PAGE_MODES.CREATE,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchTemplates() {
      setLoading(true);

      try {
        const response = await listTemplates({
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
          error instanceof Error ? error.message : "模版列表加载失败，请稍后重试";
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

  const currentConfiguredPipelineCount = useMemo(
    () => records.filter((item) => Boolean(item.pipeline_cfg_id)).length,
    [records],
  );

  const currentConfiguredPublishCount = useMemo(
    () => records.filter((item) => Boolean(item.publish_cfg_id)).length,
    [records],
  );

  const columns: TableProps<TemplateRecord>["columns"] = [
    {
      title: "模版名称",
      dataIndex: "name",
      key: "name",
      width: 180,
      render: (value: string, record) => (
        <div>
          <div className={styles.tablePrimary}>{value}</div>
          <div className={styles.tableSecondary}>ID: {getTemplateId(record) || "未返回"}</div>
        </div>
      ),
    },
    {
      title: "模版标识",
      dataIndex: "code",
      key: "code",
      width: 160,
      render: (value: string) => <Tag className={styles.codeTag}>{value}</Tag>,
    },
    {
      title: "仓库地址",
      dataIndex: "repo_url",
      key: "repo_url",
      ellipsis: true,
      render: (value: string) => <span className={styles.repoUrl}>{value}</span>,
    },
    {
      title: "流水线配置",
      dataIndex: "pipeline_cfg_id",
      key: "pipeline_cfg_id",
      width: 180,
      render: (value?: string) =>
        value ? (
          <Tooltip title={value}>
            <button
              type="button"
              className={styles.linkedTagButton}
              onClick={() => navigate(buildConfigurationDetailPath(value))}
            >
              <Tag className={styles.linkedTag}>
                <span className={styles.linkedTagText}>{formatLinkedConfigurationId(value)}</span>
              </Tag>
            </button>
          </Tooltip>
        ) : (
          <span className={styles.emptyTag}>未配置</span>
        ),
    },
    {
      title: "发布配置",
      dataIndex: "publish_cfg_id",
      key: "publish_cfg_id",
      width: 180,
      render: (value?: string) =>
        value ? (
          <Tooltip title={value}>
            <button
              type="button"
              className={styles.linkedTagButton}
              onClick={() => navigate(buildConfigurationDetailPath(value))}
            >
              <Tag className={styles.linkedTag}>
                <span className={styles.linkedTagText}>{formatLinkedConfigurationId(value)}</span>
              </Tag>
            </button>
          </Tooltip>
        ) : (
          <span className={styles.emptyTag}>未配置</span>
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
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 152,
      render: (_, record) => (
        <Space size={12}>
          <Button type="link" className={styles.actionButton} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除这个模版吗？"
            description="删除后不可恢复，请确认当前模版未被其他流程引用。"
            okText="确认删除"
            cancelText="取消"
            onConfirm={() => handleDelete(record)}
          >
            <Button type="link" danger className={styles.actionButtonDanger}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
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
    setModalState({
      open: true,
      mode: EDITOR_PAGE_MODES.CREATE,
    });
  }

  function handleEdit(record: TemplateRecord) {
    modalForm.setFieldsValue({
      name: record.name,
      code: record.code,
      repo_url: record.repo_url,
      description: record.description,
      pipeline_cfg_id: record.pipeline_cfg_id,
      publish_cfg_id: record.publish_cfg_id,
    });

    setModalState({
      open: true,
      mode: EDITOR_PAGE_MODES.EDIT,
      record,
    });
  }

  function handleCloseModal() {
    setModalState({
      open: false,
      mode: EDITOR_PAGE_MODES.CREATE,
    });
    modalForm.resetFields();
  }

  async function handleDelete(record: TemplateRecord) {
    const id = getTemplateId(record);
    if (!id) {
      messageApi.error("当前记录缺少 id，无法删除");
      return;
    }

    try {
      const response = await deleteTemplate({ id });

      if (!response.success) {
        return;
      }

      messageApi.success("模版已删除");

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
        error instanceof Error ? error.message : "删除失败，请稍后重试";
      messageApi.error(errorMessage);
    }
  }

  async function handleSubmitModal() {
    try {
      const values = await modalForm.validateFields();
      const payload = buildMutationPayload(values);

      setSubmitting(true);

      if (modalState.mode === EDITOR_PAGE_MODES.EDIT) {
        const id = getTemplateId(modalState.record ?? {});

        if (!id) {
          messageApi.error("当前记录缺少 id，无法更新");
          return;
        }

        const response = await updateTemplate({
          id,
          ...payload,
        });

        if (!response.success) {
          return;
        }

        messageApi.success("模版已更新");
      } else {
        const response = await createTemplate(payload);

        if (!response.success) {
          return;
        }

        messageApi.success("模版已创建");
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
        error instanceof Error ? error.message : "保存失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.templatePage}>
      {contextHolder}

      <div className={styles.templateBody}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>菜单</div>
          <AppConsoleMenu />
          <div className={styles.sidebarNote}>
            当前页面用于维护模版基础信息，并绑定流水线与发布配置。
          </div>
        </aside>

        <main className={styles.mainSection}>
          <section className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>模版配置</div>
              <div className={styles.sectionSubtitle}>
                对照后端 `template` 模块，统一管理模版、仓库地址与关联配置。
              </div>
            </div>
            <Space className={styles.quickActions}>
              <Button type="primary" onClick={handleCreate}>
                新建模版
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
              <Form.Item label="模版名称" name="name" className={styles.searchItem}>
                <Input placeholder="输入模版名称搜索" allowClear />
              </Form.Item>
              <Form.Item label="模版标识" name="code" className={styles.searchItem}>
                <Input placeholder="输入 code 搜索" allowClear />
              </Form.Item>
              <Form.Item label="仓库地址" name="repo_url" className={styles.searchItem}>
                <Input placeholder="输入 repo_url 搜索" allowClear />
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
            <Table<TemplateRecord>
              className={styles.templateTable}
              rowKey={(record) => getTemplateId(record) || `${record.code}-${record.name}`}
              columns={columns}
              dataSource={records}
              loading={loading}
              tableLayout="fixed"
              scroll={{ x: 1180 }}
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
                <div className={styles.statLabel}>模版总数</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{currentConfiguredPipelineCount}</div>
                <div className={styles.statLabel}>已绑流水线</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{currentConfiguredPublishCount}</div>
                <div className={styles.statLabel}>已绑发布配置</div>
              </div>
            </div>
          </Card>

          <Card className={styles.insightCard} variant="borderless">
            <div className={styles.insightTitle}>字段说明</div>
            <ul className={styles.fieldList}>
              <li className={styles.fieldItem}>
                <span className={styles.fieldName}>name</span>
                <span className={styles.fieldDesc}>模版展示名称，列表和详情均会使用。</span>
              </li>
              <li className={styles.fieldItem}>
                <span className={styles.fieldName}>code</span>
                <span className={styles.fieldDesc}>模版唯一标识，建议保持稳定命名。</span>
              </li>
              <li className={styles.fieldItem}>
                <span className={styles.fieldName}>repo_url</span>
                <span className={styles.fieldDesc}>模版对应的仓库地址。</span>
              </li>
              <li className={styles.fieldItem}>
                <span className={styles.fieldName}>pipeline_cfg_id / publish_cfg_id</span>
                <span className={styles.fieldDesc}>分别对应流水线与发布配置。</span>
              </li>
            </ul>
          </Card>
        </aside>
      </div>

      <AppFooter />

      <Modal
        title={modalState.mode === EDITOR_PAGE_MODES.EDIT ? "编辑模版" : "新建模版"}
        open={modalState.open}
        onCancel={handleCloseModal}
        onOk={() => void handleSubmitModal()}
        confirmLoading={submitting}
        okText={modalState.mode === EDITOR_PAGE_MODES.EDIT ? "保存修改" : "创建模版"}
        cancelText="取消"
        width={680}
      >
        <Form<TemplateFormValues>
          form={modalForm}
          layout="vertical"
          className={styles.modalForm}
        >
          <div className={styles.modalGrid}>
            <Form.Item
              name="name"
              label="模版名称"
              rules={[{ required: true, message: "请输入模版名称" }]}
            >
              <Input placeholder="例如：Node 服务模版" />
            </Form.Item>
            <Form.Item
              name="code"
              label="模版标识"
              rules={[{ required: true, message: "请输入模版标识" }]}
            >
              <Input placeholder="例如：node-service-template" />
            </Form.Item>
          </div>

          <Form.Item
            name="repo_url"
            label="仓库地址"
            rules={[{ required: true, message: "请输入仓库地址" }]}
          >
            <Input placeholder="例如：https://git.example.com/group/template.git" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <Input.TextArea
              rows={4}
              placeholder="补充模版用途、适用场景或接入说明"
              showCount
              maxLength={200}
            />
          </Form.Item>

          <div className={styles.modalGrid}>
            <Form.Item name="pipeline_cfg_id" label="流水线配置 ID">
              <Input placeholder="可选：输入 pipeline_cfg_id" />
            </Form.Item>
            <Form.Item name="publish_cfg_id" label="发布配置 ID">
              <Input placeholder="可选：输入 publish_cfg_id" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
