import { useEffect, useState } from "react";
import { Button, Card, Form, Input, Popconfirm, Select, Space, Table, Tag, message } from "antd";
import type { TableProps } from "antd";
import { useNavigate } from "react-router-dom";
import {
  APP_ROUTE_PATHS,
  APPROVAL_POLICY_MATCH_MODES,
  APPROVAL_TEMPLATE_STATUSES,
  buildApprovalPolicyEditPath,
} from "@constants";
import AppConsolePageShell from "@components/AppConsolePageShell";
import {
  deleteApprovalPolicy,
  listApprovalPolicies,
  type ApprovalPolicyListParams,
  type ApprovalPolicyRecord,
  type ApprovalPolicyStatus,
  type ApprovalPolicyTargetType,
} from "@service/api";
import { formatDateTime } from "@utils";
import {
  approvalPolicyStatusOptions,
  approvalPolicyTargetTypeOptions,
  buildApprovalPolicySearchParams,
  getApprovalPolicyId,
  getApprovalPolicyStatusLabel,
  getApprovalPolicyTargetTypeLabel,
} from "./shared";
import styles from "./styles.module.less";

type SearchFormValues = Pick<
  ApprovalPolicyListParams,
  "name" | "code" | "targetType" | "status"
>;

type PaginationState = {
  pageNum: number;
  pageSize: number;
  total: number;
};

export default function ApprovalPolicy() {
  const navigate = useNavigate();
  const [searchForm] = Form.useForm<SearchFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [actionKey, setActionKey] = useState("");
  const [reloadSeed, setReloadSeed] = useState(0);
  const [filters, setFilters] = useState<SearchFormValues>({});
  const [records, setRecords] = useState<ApprovalPolicyRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageNum: 1,
    pageSize: 10,
    total: 0,
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

  const columns: TableProps<ApprovalPolicyRecord>["columns"] = [
    {
      title: "策略名称",
      dataIndex: "name",
      key: "name",
      width: 220,
      render: (value: string, record) => (
        <div>
          <div className={styles.tablePrimary}>{value}</div>
          <div className={styles.tableSecondary}>ID: {getApprovalPolicyId(record) || "未返回"}</div>
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
        <Tag className={styles.targetTag}>{getApprovalPolicyTargetTypeLabel(value)}</Tag>
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
        <Tag className={value === APPROVAL_TEMPLATE_STATUSES.DISABLE ? styles.statusTagDisabled : styles.statusTagEnabled}>
          {getApprovalPolicyStatusLabel(value)}
        </Tag>
      ),
    },
    {
      title: "规则数",
      key: "rules",
      render: (_, record) => (
        <div>
          <div className={styles.tablePrimary}>{record.rules?.length ?? 0} 条规则</div>
          <div className={styles.tableSecondary}>匹配模式 {record.matchMode ?? APPROVAL_POLICY_MATCH_MODES.FIRST_MATCH}</div>
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
        const id = getApprovalPolicyId(record);

        return (
          <Space size={12}>
            <Button
              type="link"
              className={styles.actionButton}
              onClick={() => navigate(buildApprovalPolicyEditPath(id))}
            >
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
    setFilters(buildApprovalPolicySearchParams(values));
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

  async function handleDelete(record: ApprovalPolicyRecord) {
    const id = getApprovalPolicyId(record);

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

  return (
    <AppConsolePageShell
      title="审批策略"
      subtitle="按目标类型和条件匹配审批模板，保持模板定义与业务准入规则分离。"
      note="这里仅处理审批策略的匹配规则。新建和编辑已迁移到独立页面，列表页只保留查询、跳转和删除等轻交互。"
      actions={
        <Button type="primary" onClick={() => navigate(APP_ROUTE_PATHS.APPROVAL_POLICY_CREATE)}>
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
            <Select placeholder="全部类型" allowClear options={approvalPolicyTargetTypeOptions} />
          </Form.Item>
          <Form.Item className={styles.searchItem} name="status" label="状态">
            <Select placeholder="全部状态" allowClear options={approvalPolicyStatusOptions} />
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
          rowKey={(record) => getApprovalPolicyId(record)}
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
    </AppConsolePageShell>
  );
}
