import { useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Input, Select, Space, Table, Tag, message } from "antd";
import type { TableProps } from "antd";
import { useNavigate } from "react-router-dom";
import AppConsoleMenu from "../../components/AppConsoleMenu";
import AppFooter from "../../components/AppFooter";
import {
  listMyMessages,
  type MessageListParams,
  type MessageReadStatus,
  type MessageRecord,
} from "../../service/api";
import { useMessageInboxStore } from "../../store";
import {
  buildMessageSummary,
  formatMessageDateTime,
  getReadStatusLabel,
} from "../../utils/message";
import styles from "./styles.module.less";

type SearchFormValues = Pick<MessageListParams, "title" | "read_status">;

type PaginationState = {
  pageNum: number;
  pageSize: number;
  total: number;
};

const readStatusOptions: Array<{ label: string; value: MessageReadStatus }> = [
  { label: "未读", value: "unread" },
  { label: "已读", value: "read" },
];

function normalizeOptionalField(value?: string) {
  const text = value?.trim();
  return text ? text : undefined;
}

function buildSearchParams(values: SearchFormValues): SearchFormValues {
  return {
    title: normalizeOptionalField(values.title),
    read_status: values.read_status,
  };
}

export default function Message() {
  const navigate = useNavigate();
  const [searchForm] = Form.useForm<SearchFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const recentMessages = useMessageInboxStore((state) => state.recentMessages);
  const globalUnreadCount = useMessageInboxStore((state) => state.unreadCount);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFormValues>({});
  const [records, setRecords] = useState<MessageRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
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
        const [listResponse, unreadResponse] = await Promise.all([
          listMyMessages({
            ...filters,
            pageNum: pagination.pageNum,
            pageSize: pagination.pageSize,
          }),
          listMyMessages({
            title: filters.title,
            read_status: "unread",
            pageNum: 1,
            pageSize: 1,
          }),
        ]);

        if (cancelled) {
          return;
        }

        if (listResponse.success) {
          setRecords(listResponse.data?.list ?? []);
          setPagination((prev) => ({
            ...prev,
            total: listResponse.data?.total ?? 0,
          }));
        }

        if (unreadResponse.success) {
          setUnreadCount(unreadResponse.data?.total ?? 0);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error && typeof error === "object" && "handled" in error && error.handled) {
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "消息列表加载失败，请稍后重试";
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
  }, [filters, pagination.pageNum, pagination.pageSize, messageApi]);

  const readCount = useMemo(
    () => Math.max(pagination.total - unreadCount, 0),
    [pagination.total, unreadCount],
  );

  const columns: TableProps<MessageRecord>["columns"] = [
    {
      title: "消息主题",
      dataIndex: "title",
      key: "title",
      width: 280,
      render: (value: string, record) => (
        <button
          type="button"
          className={styles.titleButton}
          onClick={() => navigate(`/message/${record.id}`)}
        >
          <span className={styles.tablePrimary}>{value}</span>
          <span className={styles.tableSecondary}>ID: {record.id}</span>
        </button>
      ),
    },
    {
      title: "摘要",
      key: "summary",
      render: (_, record) => (
        <div className={styles.summaryCell}>
          {buildMessageSummary(record.summary, record.content, 96)}
        </div>
      ),
    },
    {
      title: "状态",
      dataIndex: "read_status",
      key: "read_status",
      width: 120,
      render: (value?: MessageReadStatus) => (
        <Tag
          variant="filled"
          className={value === "read" ? styles.readTag : styles.unreadTag}
        >
          {getReadStatusLabel(value)}
        </Tag>
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
      width: 140,
      render: (_, record) => (
        <Button type="link" onClick={() => navigate(`/message/${record.id}`)}>
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.messagePage}>
      {contextHolder}

      <div className={styles.pageBody}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>菜单</div>
          <AppConsoleMenu />
          <div className={styles.sidebarTip}>
            消息中心聚合当前用户的系统通知、审批提醒和操作播报，可从顶部图标快速进入。
          </div>
        </aside>

        <main className={styles.mainSection}>
          <section className={styles.heroCard}>
            <div>
              <div className={styles.sectionTitle}>消息中心</div>
              <div className={styles.sectionSubtitle}>
                查看系统通知摘要，进入详情后自动标记当前用户已读
              </div>
            </div>
            <Space className={styles.heroActions}>
              <Button type="default" onClick={() => navigate("/dashboard")}>
                返回工作台
              </Button>
            </Space>
          </section>

          <section className={styles.metricGrid}>
            <Card className={styles.metricCard} variant="borderless">
              <div className={styles.metricLabel}>消息总数</div>
              <div className={styles.metricValue}>{pagination.total}</div>
            </Card>
            <Card className={styles.metricCard} variant="borderless">
              <div className={styles.metricLabel}>未读消息</div>
              <div className={styles.metricValue}>{unreadCount}</div>
            </Card>
            <Card className={styles.metricCard} variant="borderless">
              <div className={styles.metricLabel}>已读消息</div>
              <div className={styles.metricValue}>{readCount}</div>
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
              <Form.Item name="read_status" label="状态">
                <Select
                  allowClear
                  placeholder="全部"
                  className={styles.filterSelect}
                  options={readStatusOptions}
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
              rowKey={(record) => record.id ?? record._id ?? record.title}
              loading={loading}
              columns={columns}
              dataSource={records}
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

        <aside className={styles.summaryPanel}>
          <Card
            className={styles.summaryCard}
            variant="borderless"
            title={<span className={styles.summaryCardTitle}>顶部摘要预览</span>}
          >
            <div className={styles.summaryStat}>
              顶部导航当前未读数：<span>{globalUnreadCount}</span>
            </div>
            <div className={styles.summaryList}>
              {recentMessages.length === 0 ? (
                <div className={styles.summaryEmpty}>最近没有消息摘要</div>
              ) : (
                recentMessages.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.summaryItem}
                    onClick={() => navigate(`/message/${item.id}`)}
                  >
                    <div className={styles.summaryItemHeader}>
                      <span className={styles.summaryItemTitle}>{item.title}</span>
                      <Tag
                        variant="filled"
                        className={item.read_status === "read" ? styles.readTag : styles.unreadTag}
                      >
                        {getReadStatusLabel(item.read_status)}
                      </Tag>
                    </div>
                    <div className={styles.summaryItemText}>
                      {buildMessageSummary(item.summary, item.content)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </aside>
      </div>

      <AppFooter />
    </div>
  );
}
