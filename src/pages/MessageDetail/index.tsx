import { useEffect, useState } from "react";
import { Avatar, Button, Card, Descriptions, Space, Tag, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import AppConsoleMenu from "../../components/AppConsoleMenu";
import AppFooter from "../../components/AppFooter";
import {
  getMyMessageDetail,
  markMyMessageAsRead,
  type MessageRecord,
} from "../../service/api";
import { useMessageInboxStore } from "../../store";
import {
  buildMessageSummary,
  formatMessageDateTime,
  getAvatarText,
  getReadStatusLabel,
} from "../../utils/message";
import styles from "./styles.module.less";

export default function MessageDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const markMessageReadLocally = useMessageInboxStore((state) => state.markMessageReadLocally);
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<MessageRecord | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMessageDetail() {
      if (!id) {
        return;
      }

      setLoading(true);

      try {
        const detailResponse = await getMyMessageDetail(id);

        if (!detailResponse.success || cancelled) {
          return;
        }

        const nextRecord = detailResponse.data ?? null;
        setRecord(nextRecord);

        if (nextRecord?.read_status !== "read") {
          try {
            await markMyMessageAsRead(id);

            if (!cancelled) {
              const readAt = Date.now();
              setRecord((prev) =>
                prev
                  ? {
                      ...prev,
                      read_status: "read",
                      readAt,
                    }
                  : prev,
              );
              markMessageReadLocally(id);
            }
          } catch (error) {
            if (!cancelled) {
              if (error && typeof error === "object" && "handled" in error && error.handled) {
                return;
              }

              messageApi.error("消息已打开，但已读状态更新失败，请稍后重试");
            }
          }
        }
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
  }, [id, markMessageReadLocally, messageApi]);

  const senderName = record?.sender?.name?.trim() || "系统发送";
  const readStatusLabel = getReadStatusLabel(record?.read_status);
  const senderId = record?.sender?.id?.trim() || "暂无记录";
  const senderAvatar = record?.sender?.avatar?.trim();

  return (
    <div className={styles.detailPage}>
      {contextHolder}

      <div className={styles.pageBody}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>菜单</div>
          <AppConsoleMenu />
          <div className={styles.sidebarTip}>
            从顶部消息 icon 或消息列表进入详情后，系统会把该消息针对当前用户标记为已读。
          </div>
        </aside>

        <main className={styles.mainSection}>
          <section className={styles.heroCard}>
            <div>
              <div className={styles.sectionTitle}>{record?.title || "消息详情"}</div>
              <div className={styles.sectionSubtitle}>
                {record?.summary
                  ? buildMessageSummary(record.summary, record.content, 120)
                  : "查看消息正文与发送人信息"}
              </div>
            </div>
            <Space className={styles.heroActions}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/message")}>
                返回消息列表
              </Button>
            </Space>
          </section>

          <Card className={styles.contentCard} variant="borderless" loading={loading}>
            <div className={styles.metaRow}>
              <Tag
                bordered={false}
                className={record?.read_status === "read" ? styles.readTag : styles.unreadTag}
              >
                {readStatusLabel}
              </Tag>
              <span className={styles.metaText}>发送时间：{formatMessageDateTime(record?.sentAt)}</span>
              <span className={styles.metaText}>阅读时间：{formatMessageDateTime(record?.readAt)}</span>
            </div>

            <article className={styles.article}>
              <div className={styles.articleTitle}>{record?.title || "暂无标题"}</div>
              <div className={styles.articleContent}>{record?.content || "暂无消息内容"}</div>
            </article>
          </Card>
        </main>

        <aside className={styles.sidePanel}>
          <Card
            className={styles.infoCard}
            variant="borderless"
            title={<span className={styles.infoCardTitle}>发送人信息</span>}
          >
            <div className={styles.senderCard}>
              <Avatar className={styles.senderAvatar} size={56} src={senderAvatar || undefined}>
                {getAvatarText(senderName)}
              </Avatar>
              <div className={styles.senderText}>
                <div className={styles.senderName}>{senderName}</div>
                <div className={styles.senderMeta}>服务端已返回发送人昵称与头像</div>
              </div>
            </div>

            <Descriptions
              column={1}
              size="small"
              className={styles.infoDescriptions}
              items={[
                {
                  key: "nickname",
                  label: "昵称",
                  children: senderName,
                },
                {
                  key: "senderId",
                  label: "发送人 ID",
                  children: senderId,
                },
                {
                  key: "status",
                  label: "当前状态",
                  children: readStatusLabel,
                },
                {
                  key: "messageId",
                  label: "消息 ID",
                  children: record?.id || "暂无记录",
                },
              ]}
            />
          </Card>
        </aside>
      </div>

      <AppFooter />
    </div>
  );
}
