import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, message, Space, Switch, Table, Tag } from "antd";
import type { TableProps } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import StatusBadge from "@components/StatusBadge";
import {
  buildPipelineCreatePath,
  PIPELINE_TYPE_LABELS,
  TRIGGER_MODE_LABELS,
} from "@constants";
import {
  listPipelines,
  togglePipeline,
  type PipelineRecord,
} from "@service/api";
import styles from "./styles.module.less";

type Props = {
  appId: string;
};

function getPipelineId(p: PipelineRecord) {
  return p.id ?? p._id ?? "";
}

export default function TabPipelines({ appId }: Props) {
  const navigate = useNavigate();
  const [pipelines, setPipelines] = useState<PipelineRecord[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchPipelines() {
    setLoading(true);
    const res = await listPipelines({ applicationId: appId, pageNum: 1, pageSize: 50 });
    if (res.success) {
      setPipelines(res.data?.list ?? []);
    } else {
      message.error("获取流水线失败");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPipelines();
  }, [appId]);

  async function handleToggle(id: string, enabled: boolean) {
    const res = await togglePipeline(id, enabled);
    if (res.success) {
      message.success(enabled ? "已启用" : "已禁用");
      fetchPipelines();
    } else {
      message.error("操作失败");
    }
  }

  const columns: TableProps<PipelineRecord>["columns"] = [
    {
      title: "名称",
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
      render: (v: PipelineRecord["type"]) => (
        <StatusBadge label={PIPELINE_TYPE_LABELS[v] ?? v} color="blue" />
      ),
    },
    {
      title: "触发方式",
      dataIndex: "triggerMode",
      key: "triggerMode",
      render: (v: PipelineRecord["triggerMode"]) => (
        <Tag>{TRIGGER_MODE_LABELS[v] ?? v}</Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "enabled",
      key: "enabled",
      render: (enabled: boolean, record) => (
        <Switch
          size="small"
          checked={enabled}
          onChange={(checked) => handleToggle(getPipelineId(record), checked)}
        />
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, _record) => (
        <Space>
          <Button size="small">编辑</Button>
          <Button size="small" type="primary">
            触发运行
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
          onClick={() => navigate(buildPipelineCreatePath(appId))}
        >
          新建流水线
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={pipelines}
        rowKey={getPipelineId}
        loading={loading}
        size="middle"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
