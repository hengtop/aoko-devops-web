import { useEffect, useState } from "react";
import { Modal, Table, Tag } from "antd";
import type { TableProps } from "antd";
import { listWebhookEvents, type WebhookEvent } from "@service/api";

interface WebhookEventsModalProps {
  open: boolean;
  repositoryId: string;
  onClose: () => void;
}

export default function WebhookEventsModal({
  open,
  repositoryId,
  onClose,
}: WebhookEventsModalProps) {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && repositoryId) {
      loadEvents();
    }
  }, [open, repositoryId]);

  async function loadEvents() {
    setLoading(true);
    const res = await listWebhookEvents({ repositoryId, pageNum: 1, pageSize: 50 });
    if (res.success) {
      setEvents(res.data?.list ?? []);
    }
    setLoading(false);
  }

  const columns: TableProps<WebhookEvent>["columns"] = [
    { title: "事件类型", dataIndex: "eventType", key: "eventType", render: (v: string) => <Tag>{v}</Tag> },
    { title: "Ref", dataIndex: "ref", key: "ref", ellipsis: true },
    { title: "Commit SHA", dataIndex: "commitSha", key: "commitSha", render: (v: string) => <code>{v?.slice(0, 8)}</code> },
    {
      title: "处理状态",
      dataIndex: "handledStatus",
      key: "handledStatus",
      render: (v: string) => (
        <Tag color={v === "success" ? "green" : v === "failed" ? "red" : "default"}>{v}</Tag>
      ),
    },
    { title: "时间", dataIndex: "createdAt", key: "createdAt" },
  ];

  return (
    <Modal
      title="Webhook 事件"
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnClose
    >
      <Table
        columns={columns}
        dataSource={events}
        rowKey={(r) => r.id ?? r._id ?? ""}
        loading={loading}
        size="small"
        pagination={{ pageSize: 10 }}
      />
    </Modal>
  );
}
