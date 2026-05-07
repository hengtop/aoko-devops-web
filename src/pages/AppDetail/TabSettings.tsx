import { useEffect, useState } from "react";
import { Button, message, Popconfirm, Space, Table, Tabs, Tag, Typography } from "antd";
import type { TableProps } from "antd";
import { EyeInvisibleOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import {
  CREDENTIAL_TYPE_LABELS,
  VARIABLE_SCOPE_TYPE_LABELS,
} from "@constants";
import {
  deleteRepository,
  listCredentials,
  listRepositories,
  listVariables,
  type CredentialRecord,
  type RepositoryRecord,
  type VariableRecord,
} from "@service/api";
import RepositoryDrawer from "./RepositoryDrawer";
import WebhookEventsModal from "./WebhookEventsModal";
import styles from "./styles.module.less";

const { Text } = Typography;

type Props = {
  appId: string;
};

// ── Repositories ──────────────────────────────────────────
function RepositoriesTab({ appId }: { appId: string }) {
  const [repos, setRepos] = useState<RepositoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<RepositoryRecord | null>(null);
  const [webhookRepoId, setWebhookRepoId] = useState<string>("");
  const [webhookOpen, setWebhookOpen] = useState(false);

  async function loadRepos() {
    setLoading(true);
    const res = await listRepositories({ applicationId: appId, pageNum: 1, pageSize: 20 });
    if (res.success) setRepos(res.data?.list ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadRepos();
  }, [appId]);

  async function handleDelete(record: RepositoryRecord) {
    const id = record.id ?? record._id ?? "";
    const res = await deleteRepository(id);
    if (res.success) {
      message.success("仓库已删除");
      loadRepos();
    } else {
      message.error("删除失败");
    }
  }

  const columns: TableProps<RepositoryRecord>["columns"] = [
    { title: "名称", dataIndex: "repoName", key: "repoName" },
    {
      title: "平台",
      dataIndex: "providerType",
      key: "providerType",
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: "认证方式",
      dataIndex: "authType",
      key: "authType",
      render: (v: string) => <Tag>{v === "token" ? "Token" : "SSH Key"}</Tag>,
    },
    { title: "默认分支", dataIndex: "defaultBranch", key: "defaultBranch" },
    {
      title: "仓库地址",
      dataIndex: "repoUrl",
      key: "repoUrl",
      render: (v: string) => (
        <Text ellipsis style={{ maxWidth: 240 }}>
          {v}
        </Text>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: RepositoryRecord) => (
        <Space>
          <Button size="small" onClick={() => { setEditRecord(record); setDrawerOpen(true); }}>
            编辑
          </Button>
          <Button
            size="small"
            onClick={() => {
              setWebhookRepoId(record.id ?? record._id ?? "");
              setWebhookOpen(true);
            }}
          >
            Webhook
          </Button>
          <Popconfirm title="删除后无法恢复，确认删除该仓库绑定？" onConfirm={() => handleDelete(record)}>
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.settingSection}>
      <div className={styles.tabToolbar}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setDrawerOpen(true); }}>
          绑定仓库
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={repos}
        rowKey={(r) => r.id ?? r._id ?? ""}
        loading={loading}
        size="middle"
        pagination={false}
      />
      <RepositoryDrawer
        open={drawerOpen}
        appId={appId}
        editRecord={editRecord}
        onClose={() => setDrawerOpen(false)}
        onSuccess={loadRepos}
      />
      <WebhookEventsModal
        open={webhookOpen}
        repositoryId={webhookRepoId}
        onClose={() => setWebhookOpen(false)}
      />
    </div>
  );
}

// ── Credentials ──────────────────────────────────────────
function CredentialsTab({ appId }: { appId: string }) {
  const [credentials, setCredentials] = useState<CredentialRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await listCredentials({ applicationId: appId, pageNum: 1, pageSize: 50 });
      if (res.success) setCredentials(res.data?.list ?? []);
      setLoading(false);
    }
    load();
  }, [appId]);

  const columns: TableProps<CredentialRecord>["columns"] = [
    { title: "名称", dataIndex: "name", key: "name" },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      render: (v: CredentialRecord["type"]) => (
        <Tag>{CREDENTIAL_TYPE_LABELS[v] ?? v}</Tag>
      ),
    },
    { title: "描述", dataIndex: "description", key: "description", render: (v: string) => v ?? "—" },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, _record) => (
        <Space>
          <Button size="small">编辑</Button>
          <Popconfirm title="确认删除该凭据？">
            <Button size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.settingSection}>
      <div className={styles.tabToolbar}>
        <Button type="primary" icon={<PlusOutlined />}>
          新增凭据
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={credentials}
        rowKey={(r) => r.id ?? r._id ?? ""}
        loading={loading}
        size="middle"
        pagination={false}
      />
    </div>
  );
}

// ── Variables ──────────────────────────────────────────
function VariablesTab({ appId }: { appId: string }) {
  const [variables, setVariables] = useState<VariableRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await listVariables({ applicationId: appId, pageNum: 1, pageSize: 100 });
      if (res.success) setVariables(res.data?.list ?? []);
      setLoading(false);
    }
    load();
  }, [appId]);

  const columns: TableProps<VariableRecord>["columns"] = [
    { title: "Key", dataIndex: "key", key: "key", render: (v: string) => <code>{v}</code> },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      render: (v: string, record) => {
        const id = record.id ?? record._id ?? "";
        if (record.isSecret) {
          return showSecret[id] ? (
            <Space>
              <code>{v}</code>
              <Button
                size="small"
                type="text"
                icon={<EyeInvisibleOutlined />}
                onClick={() => setShowSecret((s) => ({ ...s, [id]: false }))}
              />
            </Space>
          ) : (
            <Space>
              <code>••••••••</code>
              <Button
                size="small"
                type="text"
                icon={<EyeOutlined />}
                onClick={() => setShowSecret((s) => ({ ...s, [id]: true }))}
              />
            </Space>
          );
        }
        return <code>{v}</code>;
      },
    },
    {
      title: "作用域",
      dataIndex: "scopeType",
      key: "scopeType",
      render: (v: VariableRecord["scopeType"]) => (
        <Tag>{VARIABLE_SCOPE_TYPE_LABELS[v] ?? v}</Tag>
      ),
    },
    {
      title: "加密",
      dataIndex: "isSecret",
      key: "isSecret",
      render: (v: boolean) => <Tag color={v ? "red" : "default"}>{v ? "是" : "否"}</Tag>,
    },
    {
      title: "操作",
      key: "action",
      render: () => (
        <Space>
          <Button size="small">编辑</Button>
          <Button size="small" danger>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.settingSection}>
      <div className={styles.tabToolbar}>
        <Button type="primary" icon={<PlusOutlined />}>
          新增变量
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={variables}
        rowKey={(r) => r.id ?? r._id ?? ""}
        loading={loading}
        size="middle"
        pagination={false}
      />
    </div>
  );
}

// ── Main Settings Tab ────────────────────────────────────
export default function TabSettings({ appId }: Props) {
  const items = [
    { key: "repositories", label: "仓库配置", children: <RepositoriesTab appId={appId} /> },
    { key: "credentials", label: "凭据管理", children: <CredentialsTab appId={appId} /> },
    { key: "variables", label: "变量管理", children: <VariablesTab appId={appId} /> },
  ];

  return (
    <div className={styles.tabContent}>
      <Tabs tabPosition="left" items={items} />
    </div>
  );
}
