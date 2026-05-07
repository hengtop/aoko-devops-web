import { useEffect, useState } from "react";
import { Button, message, Popconfirm, Space, Table, Tag } from "antd";
import type { TableProps } from "antd";
import { LockOutlined, PlusOutlined, UnlockOutlined } from "@ant-design/icons";
import {
  ENVIRONMENT_TYPE_LABELS,
  ENVIRONMENT_TYPE_COLORS,
  ENVIRONMENT_DEPLOY_TYPE_LABELS,
} from "@constants";
import {
  listEnvironments,
  lockEnvironment,
  unlockEnvironment,
  type EnvironmentRecord,
} from "@service/api";
import styles from "./styles.module.less";

type Props = {
  appId: string;
};

function getEnvId(e: EnvironmentRecord) {
  return e.id ?? e._id ?? "";
}

export default function TabEnvironments({ appId }: Props) {
  const [envs, setEnvs] = useState<EnvironmentRecord[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchEnvs() {
    setLoading(true);
    const res = await listEnvironments({ applicationId: appId, pageNum: 1, pageSize: 50 });
    if (res.success) {
      setEnvs(res.data?.list ?? []);
    } else {
      message.error("获取环境列表失败");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchEnvs();
  }, [appId]);

  async function handleLock(id: string, lock: boolean) {
    const res = lock ? await lockEnvironment(id) : await unlockEnvironment(id);
    if (res.success) {
      message.success(lock ? "环境已加锁" : "环境已解锁");
      fetchEnvs();
    } else {
      message.error("操作失败");
    }
  }

  const columns: TableProps<EnvironmentRecord>["columns"] = [
    {
      title: "环境名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      render: (v: EnvironmentRecord["type"]) => (
        <Tag color={ENVIRONMENT_TYPE_COLORS[v]}>{ENVIRONMENT_TYPE_LABELS[v] ?? v}</Tag>
      ),
    },
    {
      title: "部署方式",
      dataIndex: "deployType",
      key: "deployType",
      render: (v: EnvironmentRecord["deployType"]) => (
        <Tag>{ENVIRONMENT_DEPLOY_TYPE_LABELS[v] ?? v}</Tag>
      ),
    },
    {
      title: "锁定状态",
      dataIndex: "locked",
      key: "locked",
      render: (locked: boolean) =>
        locked ? (
          <Tag color="red" icon={<LockOutlined />}>
            已锁定
          </Tag>
        ) : (
          <Tag color="green" icon={<UnlockOutlined />}>
            正常
          </Tag>
        ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record) => (
        <Space>
          <Button size="small">编辑</Button>
          <Popconfirm
            title={record.locked ? "确认解锁该环境？" : "确认锁定该环境？"}
            onConfirm={() => handleLock(getEnvId(record), !record.locked)}
          >
            <Button size="small" danger={record.locked}>
              {record.locked ? "解锁" : "锁定"}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabToolbar}>
        <Button type="primary" icon={<PlusOutlined />}>
          添加环境
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={envs}
        rowKey={getEnvId}
        loading={loading}
        size="middle"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
