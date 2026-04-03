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
  message,
} from "antd";
import type { TableProps } from "antd";
import { useNavigate } from "react-router-dom";
import AppConsoleMenu from "../../components/AppConsoleMenu";
import AppFooter from "../../components/AppFooter";
import {
  deleteMessage,
  listMessages,
  sendMessage,
  type MessageListParams,
  type MessageRecord,
  type MessageStatus,
  type MessageTargetType,
} from "../../service/api";
import {
  buildMessageSummary,
  formatMessageDateTime,
  getMessageStatusLabel,
  getMessageTargetTypeLabel,
} from "../../utils/message";
import styles from "./styles.module.less";

type SearchFormValues = Pick<MessageListParams, "title" | "target_type" | "status">;

type PaginationState = {
  pageNum: number;
  pageSize: number;
  total: number;
};

const targetTypeOptions: Array<{ label: string; value: MessageTargetType }> = [
  { label: "个人消息", value: "personal" },
  { label: "群发消息", value: "group" },
  { label: "全员消息", value: "all" },
];

const statusOptions: Array<{ label: string; value: MessageStatus }> = [
  { label: "草稿", value: "draft" },
  { label: "已发送", value: "sent" },
];

function getMessageId(record: Partial<MessageRecord>) {
  return record.id ?? record._id ?? "";
}

function normalizeOptionalField(value?: string) {
  const text = value?.trim();
  return text ? text : undefined;
}

function buildSearchParams(values: SearchFormValues): SearchFormValues {
  return {
    title: normalizeOptionalField(values.title),
    target_type: values.target_type,
    status: values.status,
  };
}

export default function MessageManage() {
  const navigate = useNavigate();
  const [searchForm] = Form.useForm<SearchFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [actionKey, setActionKey] = useState("");
  const [reloadSeed, setReloadSeed] = useState(0);
  const [filters, setFilters] = useState<SearchFormValues>({});
  const [records, setRecords] = useState<MessageRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageNum: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchMessages() {
      setLoading(true);

      try {
        const response = await listMessages({
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
          error instanceof Error ? error.message : "消息管理列表加载失败，请稍后重试";
        messageApi.error(errorMessage);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchMessages();

    return () => {
      cancelled = true;
    };
  }, [filters, pagination.pageNum, pagination.pageSize, reloadSeed, messageApi]);

  const draftCount = useMemo(
    () => records.filter((item) => item.status !== "sent").length,
    [records],
  );

  const sentCount = useMemo(
    () => records.filter((item) => item.status === "sent").length,
    [records],
  );

  async function handleSend(record: MessageRecord) {
    const id = getMessageId(record);

    if (!id) {
      messageApi.error("当前消息缺少 id，无法发送");
      return;
    }

    setActionKey(`send:${id}`);

    try {
      const response = await sendMessage(id);

      if (!response.success) {
        return;
      }

      messageApi.success("消息已发送");
      setReloadSeed((seed) => seed + 1);
    } catch (error) {
      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "消息发送失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setActionKey("");
    }
  }

  async function handleDelete(record: MessageRecord) {
    const id = getMessageId(record);

    if (!id) {
      messageApi.error("当前消息缺少 id，无法删除");
      return;
    }

    setActionKey(`delete:${id}`);

    try {
      const response = await deleteMessage(id);

      if (!response.success) {
        return;
      }

      messageApi.success("消息已删除");
      setReloadSeed((seed) => seed + 1);
    } catch (error) {
      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "消息删除失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setActionKey("");
    }
  }

  const columns: TableProps<MessageRecord>["columns"] = [
    {
      title: "消息主题",
      dataIndex: "title",
      key: "title",
      width: 280,
      render: (value: string, record) => (
        <div>
          <div className={styles.tablePrimary}>{value}</div>
          <div className={styles.tableSecondary}>ID: {getMessageId(record) || "未返回"}</div>
        </div>
      ),
    },
    {
      title: "发送范围",
      dataIndex: "target_type",
      key: "target_type",
      width: 160,
      render: (value: MessageTargetType | undefined, record: MessageRecord) => (
        <div>
          <Tag className={styles.targetTag}>{getMessageTargetTypeLabel(value)}</Tag>
          <div className={styles.tableSecondary}>
            接收人数: {record.recipient_count ?? record.target_users?.length ?? 0}
          </div>
        </div>
      ),
    },
    {
      title: "摘要",
      key: "summary",
      render: (_, record) => (
        <div className={styles.summaryCell}>
          {buildMessageSummary(record.summary, record.content, 90)}
        </div>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (value?: MessageStatus) => (
        <Tag
          className={value === "sent" ? styles.statusTagSent : styles.statusTagDraft}
          bordered={false}
        >
          {getMessageStatusLabel(value)}
        </Tag>
      ),
    },
    {
      title: "更新时间",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 180,
      render: (value?: string | number) => (
        <span className={styles.timestampText}>{formatMessageDateTime(value)}</span>
      ),
    },
    {
      title: "发送时间",
      dataIndex: "sentAt",
      key: "sentAt",
      width: 180,
      render: (value?: number) => (
        <span className={styles.timestampText}>{formatMessageDateTime(value)}</span>
      ),
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 260,
      render: (_, record) => {
        const id = getMessageId(record);
        const isSent = record.status === "sent";

        return (
          <Space size={8} wrap>
            <Button type="link" onClick={() => navigate(`/message/manage/${id}`)}>
              查看
            </Button>
            <Button type="link" disabled={isSent} onClick={() => navigate(`/message/manage/${id}/edit`)}>
              编辑
            </Button>
            <Popconfirm
              title="确认发送该消息吗？"
              description="发送后该消息会生成收件记录，且不再允许编辑。"
              okText="立即发送"
              cancelText="取消"
              disabled={isSent}
              onConfirm={() => void handleSend(record)}
            >
              <Button type="link" loading={actionKey === `send:${id}`} disabled={isSent}>
                发送
              </Button>
            </Popconfirm>
            <Popconfirm
              title="确认删除该消息吗？"
              description="删除后会同时移除已生成的收件记录。"
              okText="删除"
              cancelText="取消"
              onConfirm={() => void handleDelete(record)}
            >
              <Button type="link" danger loading={actionKey === `delete:${id}`}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div className={styles.managePage}>
      {contextHolder}

      <div className={styles.manageBody}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>菜单</div>
          <AppConsoleMenu />
          <div className={styles.sidebarNote}>
            这里负责消息公告的创建、编辑、删除和发送。创建与编辑都使用独立页面，避免在弹窗中处理长正文。
          </div>
        </aside>

        <main className={styles.mainSection}>
          <section className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>消息管理</div>
              <div className={styles.sectionSubtitle}>
                维护公告草稿、查看发送状态，并在准备完成后将消息投递给目标用户。
              </div>
            </div>
            <Space className={styles.quickActions}>
              <Button type="default" onClick={() => navigate("/message")}>
                查看我的收件箱
              </Button>
              <Button type="primary" onClick={() => navigate("/message/manage/create")}>
                新建消息
              </Button>
            </Space>
          </section>

          <section className={styles.metricGrid}>
            <Card className={styles.metricCard} variant="borderless">
              <div className={styles.metricLabel}>当前筛选总数</div>
              <div className={styles.metricValue}>{pagination.total}</div>
            </Card>
            <Card className={styles.metricCard} variant="borderless">
              <div className={styles.metricLabel}>本页草稿</div>
              <div className={styles.metricValue}>{draftCount}</div>
            </Card>
            <Card className={styles.metricCard} variant="borderless">
              <div className={styles.metricLabel}>本页已发送</div>
              <div className={styles.metricValue}>{sentCount}</div>
            </Card>
          </section>

          <Card className={styles.panelCard} variant="borderless">
            <Form<SearchFormValues>
              form={searchForm}
              layout="inline"
              className={styles.filterForm}
              onFinish={(values) => {
                setPagination((prev) => ({
                  ...prev,
                  pageNum: 1,
                }));
                setFilters(buildSearchParams(values));
              }}
            >
              <Form.Item name="title" label="主题">
                <Input allowClear placeholder="搜索消息标题" className={styles.filterInput} />
              </Form.Item>
              <Form.Item name="target_type" label="发送范围">
                <Select
                  allowClear
                  placeholder="全部"
                  className={styles.filterSelect}
                  options={targetTypeOptions}
                />
              </Form.Item>
              <Form.Item name="status" label="状态">
                <Select
                  allowClear
                  placeholder="全部"
                  className={styles.filterSelect}
                  options={statusOptions}
                />
              </Form.Item>
              <Form.Item className={styles.filterActions}>
                <Space>
                  <Button type="primary" htmlType="submit">
                    查询
                  </Button>
                  <Button
                    onClick={() => {
                      searchForm.resetFields();
                      setPagination((prev) => ({
                        ...prev,
                        pageNum: 1,
                      }));
                      setFilters({});
                    }}
                  >
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>

            <Table<MessageRecord>
              rowKey={(record) => getMessageId(record)}
              loading={loading}
              columns={columns}
              dataSource={records}
              scroll={{ x: 1380 }}
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
              className={styles.messageTable}
            />
          </Card>
        </main>
      </div>

      <AppFooter />
    </div>
  );
}
