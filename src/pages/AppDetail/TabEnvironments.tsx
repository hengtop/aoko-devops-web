import { useEffect, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  message,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import type { TableProps } from "antd";
import { LockOutlined, PlusOutlined, UnlockOutlined } from "@ant-design/icons";
import {
  ENVIRONMENT_TYPE_LABELS,
  ENVIRONMENT_TYPE_COLORS,
  ENVIRONMENT_DEPLOY_TYPE_LABELS,
  environmentTypeOptions,
  environmentDeployTypeOptions,
} from "@constants";
import {
  createEnvironment,
  updateEnvironment,
  deleteEnvironment,
  listEnvironments,
  lockEnvironment,
  unlockEnvironment,
  type EnvironmentRecord,
  type CreateEnvironmentParams,
} from "@service/api";
import { listServers, type ServerRecord } from "@service/api/server";
import styles from "./styles.module.less";

type Props = {
  appId: string;
};

function getEnvId(e: EnvironmentRecord) {
  return e.id ?? e._id ?? "";
}

// ── EnvironmentDrawer ──────────────────────────────────────

type DrawerProps = {
  open: boolean;
  appId: string;
  editRecord?: EnvironmentRecord | null;
  onClose: () => void;
  onSuccess: () => void;
};

type FormValues = {
  name: string;
  code: string;
  type: EnvironmentRecord["type"];
  deployType: EnvironmentRecord["deployType"];
  serverIds?: string[];
  description?: string;
};

function EnvironmentDrawer({ open, appId, editRecord, onClose, onSuccess }: DrawerProps) {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [servers, setServers] = useState<ServerRecord[]>([]);
  const [loadingServers, setLoadingServers] = useState(false);
  const isEdit = !!editRecord;

  useEffect(() => {
    if (open) {
      // Load server list
      setLoadingServers(true);
      listServers({ pageNum: 1, pageSize: 200 })
        .then((res) => {
          if (res.success) setServers(res.data?.list ?? []);
        })
        .finally(() => setLoadingServers(false));

      if (editRecord) {
        form.setFieldsValue({
          name: editRecord.name,
          code: editRecord.code,
          type: editRecord.type,
          deployType: editRecord.deployType,
          serverIds: editRecord.serverIds ?? [],
          description: editRecord.description,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editRecord, form]);

  async function handleSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      if (isEdit && editRecord) {
        const res = await updateEnvironment({
          id: getEnvId(editRecord),
          name: values.name,
          type: values.type,
          deployType: values.deployType,
          serverIds: values.serverIds ?? [],
          description: values.description,
        });
        if (res.success) {
          message.success("环境更新成功");
          onSuccess();
          onClose();
        } else {
          const msg = Array.isArray(res.msg) ? res.msg.join("，") : (res.msg ?? "更新失败");
          message.error(msg);
        }
      } else {
        const params: CreateEnvironmentParams = {
          applicationId: appId,
          name: values.name,
          code: values.code,
          type: values.type,
          deployType: values.deployType,
          serverIds: values.serverIds ?? [],
          description: values.description,
        };
        const res = await createEnvironment(params);
        if (res.success) {
          message.success("环境创建成功");
          onSuccess();
          onClose();
        } else {
          const msg = Array.isArray(res.msg) ? res.msg.join("，") : (res.msg ?? "创建失败");
          message.error(msg);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer
      title={isEdit ? "编辑环境" : "添加环境"}
      open={open}
      onClose={onClose}
      width={480}
      footer={
        <Space style={{ justifyContent: "flex-end", width: "100%", display: "flex" }}>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={submitting} onClick={() => form.submit()}>
            {isEdit ? "保存修改" : "创建"}
          </Button>
        </Space>
      }
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item label="环境名称" name="name" rules={[{ required: true, message: "请输入环境名称" }]}>
          <Input placeholder="例如：生产环境" />
        </Form.Item>

        <Form.Item
          label="环境 Code"
          name="code"
          rules={[
            { required: true, message: "请输入环境 Code" },
            { pattern: /^[a-z0-9-_]+$/, message: "仅支持小写字母、数字、连字符和下划线" },
          ]}
          extra={isEdit ? "Code 创建后不可修改" : "环境唯一标识，创建后不可修改"}
        >
          <Input placeholder="例如：prod、staging" disabled={isEdit} />
        </Form.Item>

        <Form.Item label="环境类型" name="type" rules={[{ required: true, message: "请选择环境类型" }]}>
          <Select placeholder="选择环境类型" options={environmentTypeOptions} />
        </Form.Item>

        <Form.Item label="部署方式" name="deployType" rules={[{ required: true, message: "请选择部署方式" }]}>
          <Select placeholder="选择部署方式" options={environmentDeployTypeOptions} />
        </Form.Item>

        <Form.Item label="绑定服务器" name="serverIds">
          <Select
            mode="multiple"
            placeholder="选择要绑定的服务器（可多选）"
            loading={loadingServers}
            allowClear
            filterOption={(input, option) =>
              String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={servers.map((s) => ({
              value: s.id ?? s._id ?? "",
              label: `${s.name}（${s.ip ?? "-"}）`,
            }))}
          />
        </Form.Item>

        <Form.Item label="描述" name="description">
          <Input.TextArea rows={3} placeholder="选填，描述此环境的用途和配置说明" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}

// ── TabEnvironments ────────────────────────────────────────

export default function TabEnvironments({ appId }: Props) {
  const [envs, setEnvs] = useState<EnvironmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<EnvironmentRecord | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  function handleAdd() {
    setEditRecord(null);
    setDrawerOpen(true);
  }

  function handleEdit(record: EnvironmentRecord) {
    setEditRecord(record);
    setDrawerOpen(true);
  }

  async function handleDelete(id: string) {
    const res = await deleteEnvironment(id);
    if (res.success) {
      message.success("环境已删除");
      fetchEnvs();
    } else {
      message.error("删除失败");
    }
  }

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
          <Tag color="red" icon={<LockOutlined />}>已锁定</Tag>
        ) : (
          <Tag color="green" icon={<UnlockOutlined />}>正常</Tag>
        ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title={record.locked ? "确认解锁该环境？" : "确认锁定该环境？"}
            onConfirm={() => handleLock(getEnvId(record), !record.locked)}
          >
            <Button size="small" danger={record.locked}>
              {record.locked ? "解锁" : "锁定"}
            </Button>
          </Popconfirm>
          <Popconfirm
            title="确认删除该环境？"
            description="删除后不可恢复，相关变量配置也将一并删除"
            onConfirm={() => handleDelete(getEnvId(record))}
            okType="danger"
          >
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabToolbar}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
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
      <EnvironmentDrawer
        open={drawerOpen}
        appId={appId}
        editRecord={editRecord}
        onClose={() => setDrawerOpen(false)}
        onSuccess={fetchEnvs}
      />
    </div>
  );
}
