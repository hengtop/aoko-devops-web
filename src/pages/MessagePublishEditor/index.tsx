import { useEffect, useMemo, useState } from "react";
import { ArrowLeftOutlined, EditOutlined, SendOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, Select, Space, Tag, message } from "antd";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AppConsoleMenu from "../../components/AppConsoleMenu";
import AppFooter from "../../components/AppFooter";
import {
  createMessage,
  getMessageDetail,
  listUsers,
  sendMessage,
  updateMessage,
  type MessageMutationPayload,
  type MessageRecord,
  type MessageTargetType,
  type UserProfile,
} from "../../service/api";
import {
  buildMessageSummary,
  getMessageStatusLabel,
  getMessageTargetTypeLabel,
} from "../../utils/message";
import styles from "./styles.module.less";

type MessagePublishFormValues = {
  title: string;
  summary?: string;
  target_type: MessageTargetType;
  target_users?: string[];
  content: string;
};

const targetTypeOptions: Array<{ label: string; value: MessageTargetType }> = [
  { label: "个人消息", value: "personal" },
  { label: "群发消息", value: "group" },
  { label: "全员消息", value: "all" },
];

function getMessageId(record: Partial<MessageRecord>) {
  return record.id ?? record._id ?? "";
}

function normalizeOptionalField(value?: string) {
  const text = value?.trim();
  return text ? text : undefined;
}

function getUserId(record: Partial<UserProfile>) {
  return record.id ?? record._id ?? "";
}

function buildPayload(values: MessagePublishFormValues): MessageMutationPayload {
  return {
    title: values.title.trim(),
    summary: normalizeOptionalField(values.summary),
    target_type: values.target_type,
    target_users:
      values.target_type === "all"
        ? undefined
        : values.target_users?.filter(Boolean).map((item) => item.trim()),
    content: values.content.trim(),
  };
}

export default function MessagePublishEditor() {
  const [form] = Form.useForm<MessagePublishFormValues>();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [record, setRecord] = useState<MessageRecord | null>(null);
  const [userOptions, setUserOptions] = useState<Array<{ label: string; value: string }>>([]);
  const targetType = Form.useWatch("target_type", form) ?? "all";
  const title = Form.useWatch("title", form) ?? "";
  const summary = Form.useWatch("summary", form) ?? "";
  const content = Form.useWatch("content", form) ?? "";
  const watchedTargetUsers = Form.useWatch("target_users", form);

  const pageMode = !id ? "create" : location.pathname.endsWith("/edit") ? "edit" : "detail";
  const isReadOnly = pageMode === "detail";
  const messageId = getMessageId(record ?? {});

  useEffect(() => {
    let cancelled = false;

    async function fetchUsers() {
      try {
        const response = await listUsers({
          pageNum: 1,
          pageSize: 500,
        });

        if (!response.success || cancelled) {
          return;
        }

        const options = (response.data?.list ?? [])
          .map((item) => {
            const userId = getUserId(item);

            if (!userId) {
              return null;
            }

            return {
              value: userId,
              label: item.name?.trim() || item.email?.trim() || item.phone?.trim() || userId,
            };
          })
          .filter((item): item is { label: string; value: string } => Boolean(item));

        setUserOptions(options);
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

  useEffect(() => {
    if (!id) {
      setRecord(null);
      form.setFieldsValue({
        title: "",
        summary: "",
        target_type: "all",
        target_users: [],
        content: "",
      });
      return;
    }

    const messageDetailId = id;
    let cancelled = false;

    async function fetchMessageDetail() {
      setLoading(true);

      try {
        const response = await getMessageDetail(messageDetailId);

        if (!response.success || !response.data || cancelled) {
          return;
        }

        setRecord(response.data);
        form.setFieldsValue({
          title: response.data.title,
          summary: response.data.summary,
          target_type: response.data.target_type ?? "all",
          target_users: response.data.target_users ?? [],
          content: response.data.content,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error && typeof error === "object" && "handled" in error && error.handled) {
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "消息详情加载失败，请稍后重试";
        messageApi.error(errorMessage);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchMessageDetail();

    return () => {
      cancelled = true;
    };
  }, [form, id, messageApi]);

  async function handleSubmit() {
    try {
      const values = await form.validateFields();
      const payload = buildPayload(values);

      setSubmitting(true);

      if (pageMode === "edit") {
        if (!messageId) {
          messageApi.error("当前消息缺少 id，无法更新");
          return;
        }

        const response = await updateMessage({
          id: messageId,
          ...payload,
        });

        if (!response.success) {
          return;
        }

        messageApi.success("消息已更新");
      } else {
        const response = await createMessage(payload);

        if (!response.success) {
          return;
        }

        messageApi.success("消息草稿已创建");
      }

      navigate("/message/manage");
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) {
        return;
      }

      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "消息保存失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSend() {
    if (!messageId) {
      messageApi.error("当前消息缺少 id，无法发送");
      return;
    }

    setSending(true);

    try {
      const response = await sendMessage(messageId);

      if (!response.success) {
        return;
      }

      messageApi.success("消息已发送");
      navigate("/message/manage");
    } catch (error) {
      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "消息发送失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setSending(false);
    }
  }

  function handleBack() {
    if (pageMode === "detail" && typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/message/manage");
  }

  const selectedUserLabels = useMemo(() => {
    const targetUsers = watchedTargetUsers ?? [];

    if (targetType === "all") {
      return ["全员用户"];
    }

    const optionMap = new Map(userOptions.map((item) => [item.value, item.label]));

    return targetUsers.map((item) => optionMap.get(item) || item);
  }, [targetType, watchedTargetUsers, userOptions]);

  const previewSummary = buildMessageSummary(summary, content, 180);

  return (
    <div className={styles.editorPage}>
      {contextHolder}

      <div className={styles.editorBody}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>菜单</div>
          <AppConsoleMenu />
          <div className={styles.sidebarNote}>
            公告发布使用独立页面维护标题、摘要、发送范围和正文内容。草稿发送后将锁定编辑。
          </div>
        </aside>

        <main className={styles.mainSection}>
          <section className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>
                {pageMode === "edit" ? "编辑消息" : pageMode === "detail" ? "消息详情" : "新建消息"}
              </div>
              <div className={styles.sectionSubtitle}>
                {isReadOnly
                  ? "查看消息正文、发送对象和当前状态；草稿可继续编辑或直接发送。"
                  : "先保存消息草稿，再在列表页或详情页发出，避免误投递。"}
              </div>
            </div>
            <Space className={styles.quickActions}>
              <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                {pageMode === "detail" ? "返回上级" : "返回列表"}
              </Button>
              {pageMode === "detail" ? (
                <>
                  <Button
                    type="default"
                    icon={<EditOutlined />}
                    disabled={record?.status === "sent"}
                    onClick={() => navigate(`/message/manage/${id}/edit`)}
                  >
                    进入编辑
                  </Button>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    loading={sending}
                    disabled={record?.status === "sent"}
                    onClick={() => void handleSend()}
                  >
                    发送消息
                  </Button>
                </>
              ) : (
                <Button type="primary" loading={submitting} onClick={() => void handleSubmit()}>
                  {pageMode === "edit" ? "保存消息" : "创建消息"}
                </Button>
              )}
            </Space>
          </section>

          {record ? (
            <Alert
              className={styles.statusAlert}
              type={record.status === "sent" ? "success" : "info"}
              message={`当前状态：${getMessageStatusLabel(record.status)}`}
              description={
                record.status === "sent"
                  ? "该消息已经完成发送，服务端不再允许修改。"
                  : "当前为草稿状态，可继续调整内容、接收人和摘要。"
              }
              showIcon
            />
          ) : null}

          <div className={styles.contentLayout}>
            <Card className={styles.formCard} variant="borderless" loading={loading}>
              <Form<MessagePublishFormValues>
                form={form}
                layout="vertical"
                className={styles.editorForm}
              >
                <div className={styles.formGrid}>
                  <Form.Item
                    name="title"
                    label="消息标题"
                    rules={[{ required: true, whitespace: true, message: "请输入消息标题" }]}
                  >
                    <Input placeholder="例如：平台维护窗口通知" disabled={isReadOnly} />
                  </Form.Item>

                  <Form.Item
                    name="target_type"
                    label="发送范围"
                    rules={[{ required: true, message: "请选择发送范围" }]}
                  >
                    <Select
                      options={targetTypeOptions}
                      disabled={isReadOnly}
                      onChange={(value: MessageTargetType) => {
                        if (value === "all") {
                          form.setFieldValue("target_users", []);
                        }
                      }}
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  name="summary"
                  label="摘要"
                  extra="摘要会优先展示在顶部消息摘要和消息列表中，未填写时会自动从正文提取。"
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="可选，建议控制在 60 字以内"
                    disabled={isReadOnly}
                  />
                </Form.Item>

                <Form.Item
                  name="target_users"
                  label="指定接收人"
                  extra={
                    targetType === "all"
                      ? "全员消息不需要指定接收人。"
                      : targetType === "personal"
                        ? "个人消息只能选择 1 位接收人。"
                        : "群发消息至少选择 2 位接收人。"
                  }
                  rules={[
                    {
                      validator: async (_, value: string[] | undefined) => {
                        if (targetType === "all") {
                          return;
                        }

                        const userIds = value?.filter(Boolean) ?? [];

                        if (targetType === "personal" && userIds.length !== 1) {
                          throw new Error("个人消息必须选择 1 位接收人");
                        }

                        if (targetType === "group" && userIds.length < 2) {
                          throw new Error("群发消息至少选择 2 位接收人");
                        }
                      },
                    },
                  ]}
                >
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder={targetType === "all" ? "全员消息无需选择" : "请选择接收人"}
                    options={userOptions}
                    disabled={isReadOnly || targetType === "all"}
                    optionFilterProp="label"
                  />
                </Form.Item>

                <Form.Item
                  name="content"
                  label="消息正文"
                  rules={[{ required: true, whitespace: true, message: "请输入消息正文" }]}
                >
                  <Input.TextArea
                    rows={18}
                    placeholder="请输入完整消息内容，详情页会原样展示这段正文"
                    className={styles.contentTextarea}
                    spellCheck={false}
                    disabled={isReadOnly}
                  />
                </Form.Item>
              </Form>
            </Card>

            <Card className={styles.previewCard} variant="borderless">
              <div className={styles.previewHeader}>
                <div>
                  <div className={styles.previewTitle}>
                    {isReadOnly ? "消息概览" : "发送预览"}
                  </div>
                  <div className={styles.previewHint}>确认发送范围、摘要和正文表达都符合预期后再发送</div>
                </div>
                {record?.status ? (
                  <Tag
                    bordered={false}
                    className={record.status === "sent" ? styles.statusTagSent : styles.statusTagDraft}
                  >
                    {getMessageStatusLabel(record.status)}
                  </Tag>
                ) : null}
              </div>

              <div className={styles.previewBlock}>
                <div className={styles.previewLabel}>标题</div>
                <div className={styles.previewValue}>{title || "请输入消息标题"}</div>
              </div>

              <div className={styles.previewBlock}>
                <div className={styles.previewLabel}>发送范围</div>
                <div className={styles.previewValue}>{getMessageTargetTypeLabel(targetType)}</div>
                <div className={styles.previewAudience}>
                  {selectedUserLabels.map((item) => (
                    <Tag key={item} className={styles.audienceTag} bordered={false}>
                      {item}
                    </Tag>
                  ))}
                </div>
              </div>

              <div className={styles.previewBlock}>
                <div className={styles.previewLabel}>摘要预览</div>
                <div className={styles.previewSummary}>{previewSummary}</div>
              </div>

              <div className={styles.previewBlock}>
                <div className={styles.previewLabel}>正文预览</div>
                <div className={styles.previewContent}>{content || "请输入消息正文"}</div>
              </div>
            </Card>
          </div>
        </main>
      </div>

      <AppFooter />
    </div>
  );
}
