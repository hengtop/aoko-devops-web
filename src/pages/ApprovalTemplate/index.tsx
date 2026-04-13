import { useEffect, useState } from "react";
import { Button, Card, Form, Input, Popconfirm, Select, Space, Table, Tag, message } from "antd";
import type { TableProps } from "antd";
import { useNavigate } from "react-router-dom";
import AppConsolePageShell from "../../components/AppConsolePageShell";
import {
  deleteApprovalTemplate,
  listApprovalTemplates,
  type ApprovalTemplateBizType,
  type ApprovalTemplateListParams,
  type ApprovalTemplateRecord,
  type ApprovalTemplateStatus,
} from "../../service/api";
import { formatDateTime } from "../../utils";
import {
  approvalTemplateBizTypeOptions,
  approvalTemplateStatusOptions,
  buildApprovalTemplateSearchParams,
  getApprovalTemplateBizTypeLabel,
  getApprovalTemplateId,
  getApprovalTemplateStatusLabel,
} from "./shared";
import styles from "./styles.module.less";

type SearchFormValues = Pick<ApprovalTemplateListParams, "name" | "code" | "bizType" | "status">;

type PaginationState = {
  pageNum: number;
  pageSize: number;
  total: number;
};

export default function ApprovalTemplate() {
  const navigate = useNavigate();
  const [searchForm] = Form.useForm<SearchFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [actionKey, setActionKey] = useState("");
  const [reloadSeed, setReloadSeed] = useState(0);
  const [filters, setFilters] = useState<SearchFormValues>({});
  const [records, setRecords] = useState<ApprovalTemplateRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageNum: 1,
    pageSize: 10,
    total: 0,
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

  const columns: TableProps<ApprovalTemplateRecord>["columns"] = [
    {
      title: "模板名称",
      dataIndex: "name",
      key: "name",
      width: 220,
      render: (value: string, record) => (
        <div>
          <div className={styles.tablePrimary}>{value}</div>
          <div className={styles.tableSecondary}>
            ID: {getApprovalTemplateId(record) || "未返回"}
          </div>
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
        <Tag className={styles.bizTag}>{getApprovalTemplateBizTypeLabel(value)}</Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (value?: ApprovalTemplateStatus) => (
        <Tag className={value === "disable" ? styles.statusTagDisabled : styles.statusTagEnabled}>
          {getApprovalTemplateStatusLabel(value)}
        </Tag>
      ),
    },
    {
      title: "审批节点",
      key: "nodes",
      render: (_, record) => (
        <div className={styles.nodeSummary}>
          <div>{record.nodes?.length ?? 0} 个节点</div>
          <div className={styles.tableSecondary}>版本 {record.version ?? 1}</div>
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
        const id = getApprovalTemplateId(record);

        return (
          <Space size={12}>
            <Button
              type="link"
              className={styles.actionButton}
              onClick={() => navigate(`/approval/template/${id}/edit`)}
            >
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
    setFilters(buildApprovalTemplateSearchParams(values));
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

  async function handleDelete(record: ApprovalTemplateRecord) {
    const id = getApprovalTemplateId(record);

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

  return (
    <AppConsolePageShell
      title="审批模板"
      subtitle="维护审批节点、审批人来源和通知方式，供审批策略与审批单复用。"
      note="这里仅处理模板本身的结构定义。新建和编辑已迁移到独立页面，列表页只保留查询、跳转和删除等轻交互。"
      actions={
        <Button type="primary" onClick={() => navigate("/approval/template/create")}>
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
            <Select placeholder="全部类型" allowClear options={approvalTemplateBizTypeOptions} />
          </Form.Item>
          <Form.Item className={styles.searchItem} name="status" label="状态">
            <Select placeholder="全部状态" allowClear options={approvalTemplateStatusOptions} />
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
          rowKey={(record) => getApprovalTemplateId(record)}
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
    </AppConsolePageShell>
  );
}
