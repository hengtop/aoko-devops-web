import { useEffect, useMemo, useState } from "react";
import { Button, Input, message, Popconfirm, Select, Space, Table, Tabs, Tag, Typography } from "antd";
import type { TableProps } from "antd";
import { EyeInvisibleOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import {
  CREDENTIAL_TYPE_LABELS,
  VARIABLE_SCOPE_TYPE_LABELS,
} from "@constants";
import {
  deleteCredential,
  deleteRepository,
  deleteVariable,
  listCredentials,
  listEnvironments,
  listPipelines,
  listRepositories,
  listVariables,
  type CredentialRecord,
  type EnvironmentRecord,
  type PipelineRecord,
  type RepositoryRecord,
  type VariableRecord,
} from "@service/api";
import CredentialDrawer from "./CredentialDrawer";
import RepositoryDrawer from "./RepositoryDrawer";
import VariableDrawer from "./VariableDrawer";
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<CredentialRecord | null>(null);

  async function loadCredentials() {
    setLoading(true);
    const res = await listCredentials({ applicationId: appId, pageNum: 1, pageSize: 50 });
    if (res.success) setCredentials(res.data?.list ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadCredentials();
  }, [appId]);

  async function handleDelete(record: CredentialRecord) {
    const id = record.id ?? record._id ?? "";
    const res = await deleteCredential(id);
    if (res.success) {
      message.success("凭据已删除");
      loadCredentials();
    } else {
      message.error("删除失败");
    }
  }

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
    { title: "创建时间", dataIndex: "createdAt", key: "createdAt", render: (v: string) => v?.slice(0, 10) ?? "—" },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: CredentialRecord) => (
        <Space>
          <Button size="small" onClick={() => { setEditRecord(record); setDrawerOpen(true); }}>
            编辑
          </Button>
          <Popconfirm
            title="删除后关联的仓库绑定可能失效，确认删除？"
            onConfirm={() => handleDelete(record)}
          >
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setDrawerOpen(true); }}>
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
      <CredentialDrawer
        open={drawerOpen}
        appId={appId}
        editRecord={editRecord}
        onClose={() => setDrawerOpen(false)}
        onSuccess={loadCredentials}
      />
    </div>
  );
}

// ── Variables ──────────────────────────────────────────
interface VariablesTabProps {
  appId: string;
  environments: EnvironmentRecord[];
  pipelines: PipelineRecord[];
}

function VariablesTab({ appId, environments, pipelines }: VariablesTabProps) {
  const [variables, setVariables] = useState<VariableRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<VariableRecord | null>(null);
  const [scopeFilter, setScopeFilter] = useState<string>("");
  const [keySearch, setKeySearch] = useState("");

  async function loadVariables() {
    setLoading(true);
    const res = await listVariables({ applicationId: appId, pageNum: 1, pageSize: 200 });
    if (res.success) setVariables(res.data?.list ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadVariables();
  }, [appId]);

  async function handleDelete(record: VariableRecord) {
    const id = record.id ?? record._id ?? "";
    const res = await deleteVariable(id);
    if (res.success) {
      message.success("变量已删除");
      loadVariables();
    } else {
      message.error("删除失败");
    }
  }

  const filtered = useMemo(() => {
    return variables.filter((v) => {
      if (scopeFilter && v.scopeType !== scopeFilter) return false;
      if (keySearch && !v.key.toLowerCase().includes(keySearch.toLowerCase())) return false;
      return true;
    });
  }, [variables, scopeFilter, keySearch]);

  const columns: TableProps<VariableRecord>["columns"] = [
    {
      title: "Key",
      dataIndex: "key",
      key: "key",
      render: (v: string) => <code>{v}</code>,
    },
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
      title: "描述",
      dataIndex: "description",
      key: "description",
      render: (v: string) => v ?? "—",
    },
    {
      title: "操作",
      key: "action",
      render: (_: unknown, record: VariableRecord) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setEditRecord(record);
              setDrawerOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title={`确认删除变量 ${record.key}？删除后可能影响构建和部署流程。`}
            onConfirm={() => handleDelete(record)}
          >
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.settingSection}>
      <div className={styles.tabToolbar}>
        <Space>
          <Input
            placeholder="搜索变量名"
            allowClear
            style={{ width: 200 }}
            value={keySearch}
            onChange={(e) => setKeySearch(e.target.value)}
          />
          <Select
            placeholder="全部作用域"
            allowClear
            style={{ width: 140 }}
            value={scopeFilter || undefined}
            onChange={(v) => setScopeFilter(v ?? "")}
            options={[
              { value: "application", label: "应用级" },
              { value: "environment", label: "环境级" },
              { value: "pipeline", label: "流水线级" },
            ]}
          />
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditRecord(null);
            setDrawerOpen(true);
          }}
        >
          新增变量
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={filtered}
        rowKey={(r) => r.id ?? r._id ?? ""}
        loading={loading}
        size="middle"
        pagination={{ pageSize: 20 }}
      />
      <VariableDrawer
        open={drawerOpen}
        appId={appId}
        editRecord={editRecord}
        environments={environments}
        pipelines={pipelines}
        onClose={() => setDrawerOpen(false)}
        onSuccess={loadVariables}
      />
    </div>
  );
}

// ── Main Settings Tab ────────────────────────────────────
export default function TabSettings({ appId }: Props) {
  const [environments, setEnvironments] = useState<EnvironmentRecord[]>([]);
  const [pipelines, setPipelines] = useState<PipelineRecord[]>([]);

  useEffect(() => {
    async function load() {
      const [envRes, plRes] = await Promise.all([
        listEnvironments({ applicationId: appId, pageNum: 1, pageSize: 50 }),
        listPipelines({ applicationId: appId, pageNum: 1, pageSize: 50 }),
      ]);
      if (envRes.success) setEnvironments(envRes.data?.list ?? []);
      if (plRes.success) setPipelines(plRes.data?.list ?? []);
    }
    load();
  }, [appId]);

  const items = [
    { key: "repositories", label: "仓库配置", children: <RepositoriesTab appId={appId} /> },
    { key: "credentials", label: "凭据管理", children: <CredentialsTab appId={appId} /> },
    {
      key: "variables",
      label: "变量管理",
      children: <VariablesTab appId={appId} environments={environments} pipelines={pipelines} />,
    },
  ];

  return (
    <div className={styles.tabContent}>
      <Tabs tabPosition="left" items={items} />
    </div>
  );
}
