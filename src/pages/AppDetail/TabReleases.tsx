import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Empty, message, Space, Table, Tag } from "antd";
import type { TableProps } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import StatusBadge from "@components/StatusBadge";
import {
  buildReleaseCreatePath,
  buildReleaseDetailPath,
  RELEASE_STATUS_LABELS,
  RELEASE_STATUS_COLORS,
  RELEASE_STAGE_LABELS,
} from "@constants";
import { listReleases, type ReleaseRecord } from "@service/api";
import { formatDateTime } from "@utils";
import styles from "./styles.module.less";

type Props = {
  appId: string;
};

function getReleaseId(r: ReleaseRecord) {
  return r.id ?? r._id ?? "";
}

export default function TabReleases({ appId }: Props) {
  const navigate = useNavigate();
  const [releases, setReleases] = useState<ReleaseRecord[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchReleases() {
    setLoading(true);
    const res = await listReleases({ applicationId: appId, pageNum: 1, pageSize: 50 });
    if (res.success) {
      setReleases(res.data?.list ?? []);
    } else {
      message.error("获取迭代列表失败");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchReleases();
  }, [appId]);

  const columns: TableProps<ReleaseRecord>["columns"] = [
    {
      title: "版本号",
      dataIndex: "version",
      key: "version",
      render: (v: string, record) => (
        <a onClick={() => navigate(buildReleaseDetailPath(appId, getReleaseId(record)))}>
          {v}
        </a>
      ),
    },
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (s: ReleaseRecord["status"]) => (
        <StatusBadge label={RELEASE_STATUS_LABELS[s] ?? s} color={RELEASE_STATUS_COLORS[s]} />
      ),
    },
    {
      title: "阶段",
      dataIndex: "currentStage",
      key: "currentStage",
      render: (stage: ReleaseRecord["currentStage"]) => (
        <Tag>{RELEASE_STAGE_LABELS[stage] ?? stage}</Tag>
      ),
    },
    {
      title: "分支",
      dataIndex: ["git", "branch"],
      key: "branch",
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v: string) => formatDateTime(v),
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record) => (
        <Space>
          <Button
            size="small"
            onClick={() => navigate(buildReleaseDetailPath(appId, getReleaseId(record)))}
          >
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabToolbar}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate(buildReleaseCreatePath(appId))}
        >
          创建迭代
        </Button>
      </div>

      {releases.length === 0 && !loading ? (
        <Empty description="暂无迭代">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate(buildReleaseCreatePath(appId))}
          >
            创建第一个迭代
          </Button>
        </Empty>
      ) : (
        <Table
          columns={columns}
          dataSource={releases}
          rowKey={getReleaseId}
          loading={loading}
          size="middle"
          pagination={{ pageSize: 15 }}
        />
      )}
    </div>
  );
}
