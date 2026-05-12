import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  Collapse,
  Form,
  Input,
  InputNumber,
  Alert,
  message,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import { ArrowLeftOutlined, BranchesOutlined, MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import AppConsoleMenu from "@components/AppConsoleMenu";
import AppFooter from "@components/AppFooter";
import {
  APP_ROUTE_PATHS,
  REPOSITORY_ROLE_LABELS,
  REPOSITORY_ROLES,
  buildAppDetailPath,
  buildReleaseDetailPath,
} from "@constants";
import {
  createRelease,
  getApplicationDetail,
  listEnvironments,
  listRepositories,
  listRepositoryBranches,
  type BranchInfo,
  type EnvironmentRecord,
  type RepositoryRecord,
} from "@service/api";
import styles from "./styles.module.less";

const { Title, Text } = Typography;
const ENABLE_STATUS = "enable";

type FormValues = {
  version: string;
  title: string;
  branch?: string;
  description?: string;
  repositoryId?: string;
  // 构建配置
  environmentId?: string;
  buildCommandsRaw?: string;
  artifactPath?: string;
  artifactType?: string;
  dockerfilePath?: string;
  imageRepo?: string;
  timeoutSec?: number;
  workDir?: string;
  envVars?: { key: string; value: string }[];
};

function generateDefaultBranch(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  const ts =
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds());
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `sprint_S${ts}${rand}`;
}

function getRepositoryId(record: RepositoryRecord) {
  return record.id ?? record._id ?? "";
}

function isSourceRepository(record: RepositoryRecord) {
  return (record.repositoryRole ?? REPOSITORY_ROLES.SOURCE) === REPOSITORY_ROLES.SOURCE;
}

function isEnabledRepository(record: RepositoryRecord) {
  return !record.status || record.status === ENABLE_STATUS;
}

function resolveDefaultSourceRepository(repos: RepositoryRecord[]) {
  const sourceRepos = repos.filter((repo) => isSourceRepository(repo) && isEnabledRepository(repo));
  return sourceRepos.find((repo) => repo.isDefault) ?? (sourceRepos.length === 1 ? sourceRepos[0] : undefined);
}

export default function ReleaseCreate() {
  const navigate = useNavigate();
  const { appId = "" } = useParams<{ appId: string }>();
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [repos, setRepos] = useState<RepositoryRecord[]>([]);
  const [productId, setProductId] = useState("");
  const [buildEnvs, setBuildEnvs] = useState<EnvironmentRecord[]>([]);
  // 分支相关状态
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchSearchText, setBranchSearchText] = useState("");
  // 已选分支的 commitHash（仅选择已有分支时有值，手动输入新分支名时为 undefined）
  const [selectedCommitHash, setSelectedCommitHash] = useState<string | undefined>();
  const watchedArtifactType = Form.useWatch("artifactType", form);
  const sourceRepos = useMemo(
    () => repos.filter((repo) => isSourceRepository(repo) && isEnabledRepository(repo)),
    [repos],
  );
  const hasDefaultSourceRepo = sourceRepos.some((repo) => repo.isDefault);
  const requiresRepositorySelection = sourceRepos.length > 1 && !hasDefaultSourceRepo;

  useEffect(() => {
    if (appId) {
      listRepositories({ applicationId: appId, pageNum: 1, pageSize: 50 }).then((res) => {
        if (res.success) {
          const list = res.data?.list ?? [];
          setRepos(list);
          const defaultSourceRepo = resolveDefaultSourceRepository(list);
          if (defaultSourceRepo) {
            const repoId = getRepositoryId(defaultSourceRepo);
            form.setFieldValue("repositoryId", repoId);
            fetchBranches(repoId);
          }
        }
      });
      getApplicationDetail({ id: appId }).then((res) => {
        if (res.success && res.data) setProductId(res.data.productId ?? "");
      });
      listEnvironments({ applicationId: appId, pageNum: 1, pageSize: 50 }).then((res) => {
        if (res.success) setBuildEnvs(res.data?.list ?? []);
      });
      // 设置默认分支名
      form.setFieldValue("branch", generateDefaultBranch());
      // 设置构建配置默认值
      form.setFieldsValue({ artifactPath: "dist/", artifactType: "zip", timeoutSec: 600 });
    }
  }, [appId, form]);

  async function fetchBranches(repositoryId: string) {
    setBranches([]);
    setLoadingBranches(true);
    const res = await listRepositoryBranches(repositoryId);
    setLoadingBranches(false);
    if (res.success && res.data) {
      setBranches(res.data);
    }
  }

  function handleRepoChange(repositoryId?: string) {
    // 切换仓库时清空已选分支并重新加载
    form.setFieldValue("branch", generateDefaultBranch());
    setBranchSearchText("");
    setSelectedCommitHash(undefined);
    if (repositoryId) {
      fetchBranches(repositoryId);
    } else {
      setBranches([]);
    }
  }

  async function handleSubmit(values: FormValues) {
    if (!appId) return;
    setSubmitting(true);
    const branch = values.branch?.trim() || generateDefaultBranch();
    // 若选择的是已有分支则带上 commitHash，新分支由服务端 resolve-branch 处理
    const commitHash = selectedCommitHash;
    // 关联仓库 ID（服务端用于 resolve-branch）
    const repositoryId = values.repositoryId || undefined;

    if (!repositoryId && sourceRepos.length === 0) {
      message.warning("请先在应用设置中绑定源代码仓库，并设置默认仓库后再创建迭代");
      setSubmitting(false);
      return;
    }

    if (!repositoryId && requiresRepositorySelection) {
      message.warning("当前应用存在多个源代码仓库且未设置默认仓库，请选择仓库或先在应用设置中设置默认仓库");
      setSubmitting(false);
      return;
    }

    // 组装构建配置
    const buildCommands = (values.buildCommandsRaw ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const envVarsObj: Record<string, string> = {};
    (values.envVars ?? []).forEach(({ key, value }) => { if (key) envVarsObj[key] = value; });
    const buildConfig = buildCommands.length > 0 ? {
      buildCommands,
      artifactPath: values.artifactPath,
      artifactType: values.artifactType,
      dockerfilePath: values.artifactType === "docker-image" ? values.dockerfilePath : undefined,
      imageRepo: values.artifactType === "docker-image" ? values.imageRepo : undefined,
      timeoutSec: values.timeoutSec,
      workDir: values.workDir || undefined,
      envVars: Object.keys(envVarsObj).length > 0 ? envVarsObj : undefined,
    } : undefined;

    try {
      const res = await createRelease({
        applicationId: appId,
        tenantId: "default",
        productId,
        version: values.version,
        title: values.title,
        description: values.description,
        currentStage: "DEV",
        git: { branch, ...(commitHash ? { commitHash } : {}) },
        ...(repositoryId ? { repositoryId } : {}),
        ...(values.environmentId ? { environmentId: values.environmentId } : {}),
        ...(buildConfig ? { buildConfig } : {}),
      });
      if (res.success) {
        message.success("迭代创建成功");
        const releaseId = res.data?.id ?? res.data?._id ?? "";
        if (appId && releaseId) {
          navigate(buildReleaseDetailPath(appId, releaseId));
        } else {
          navigate(appId ? buildAppDetailPath(appId) + "?tab=releases" : APP_ROUTE_PATHS.PRODUCT);
        }
      } else {
        const msg = Array.isArray(res.msg) ? res.msg.join("，") : (res.msg ?? "创建失败");
        message.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.pageLayout}>
      <div className={styles.pageBody}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>菜单</div>
          <AppConsoleMenu />
        </aside>
        <div className={styles.pageMain}>
          <div className={styles.pageContent}>
          <div className={styles.pageHeader}>
            <Button
              type="text"
              size="small"
              icon={<ArrowLeftOutlined />}
              onClick={() => (appId ? navigate(buildAppDetailPath(appId)) : navigate(-1))}
            >
              返回
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              创建迭代
            </Title>
          </div>

          <Card className={styles.formCard}>
            <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
              迭代（Release）是应用的一次发布单元，包含代码版本与部署流程。
            </Text>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              style={{ maxWidth: 560 }}
            >
              <Form.Item
                label="版本号"
                name="version"
                rules={[
                  { required: true, message: "请输入版本号" },
                  { pattern: /^[a-zA-Z0-9._-]+$/, message: "仅支持字母、数字、点、短线" },
                ]}
              >
                <Input placeholder="例如 v1.2.0" />
              </Form.Item>

              <Form.Item label="标题" name="title" rules={[{ required: true, message: "请输入迭代标题" }]}>
                <Input placeholder="简要描述本次迭代内容" />
              </Form.Item>

              {sourceRepos.length === 0 && (
                <Alert
                  type="warning"
                  showIcon
                  message="暂未绑定源代码仓库"
                  description="应用创建后会自动绑定默认源仓库；如果这是旧应用，请先到应用设置中绑定或设置默认源仓库。"
                  style={{ marginBottom: 16 }}
                />
              )}

              {requiresRepositorySelection && (
                <Alert
                  type="warning"
                  showIcon
                  message="请选择源代码仓库"
                  description="服务端只会在存在默认源仓库，或仅有一个启用源仓库时自动选择。当前应用有多个源仓库且没有默认项。"
                  style={{ marginBottom: 16 }}
                />
              )}

              {sourceRepos.length > 0 && (
                <Form.Item
                  label="关联仓库"
                  name="repositoryId"
                  rules={requiresRepositorySelection ? [{ required: true, message: "请选择源代码仓库" }] : undefined}
                  extra="默认源仓库会自动选中；也可手动选择其他源仓库覆盖本次迭代。"
                >
                  <Select
                    placeholder="选择源代码仓库"
                    allowClear
                    onChange={handleRepoChange}
                    onClear={() => {
                      setBranches([]);
                      setBranchSearchText("");
                      setSelectedCommitHash(undefined);
                    }}
                  >
                    {sourceRepos.map((r) => (
                      <Select.Option key={getRepositoryId(r)} value={getRepositoryId(r)}>
                        {r.repoName}
                        {r.isDefault && <Tag color="green" style={{ marginLeft: 8 }}>默认</Tag>}
                        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                          {REPOSITORY_ROLE_LABELS[r.repositoryRole ?? REPOSITORY_ROLES.SOURCE]}
                        </Text>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              )}

              <Form.Item
                label="构建分支"
                name="branch"
                extra={
                  branches.length > 0
                    ? "从下拉选择已有分支，或直接输入新分支名（服务端自动创建）"
                    : "留空将自动生成默认分支名，也可手动输入"
                }
              >
                {branches.length > 0 ? (
                  <Select
                    showSearch
                    allowClear
                    placeholder="选择或输入分支名"
                    suffixIcon={loadingBranches ? <Spin size="small" /> : <BranchesOutlined />}
                    loading={loadingBranches}
                    searchValue={branchSearchText}
                    onSearch={(val) => setBranchSearchText(val)}
                    filterOption={(input, opt) =>
                      String(opt?.value ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                    onChange={(val: string) => {
                      // 从已有分支列表选中：回填 commitHash；清空或手动输入时清除
                      const matched = branches.find((b) => b.name === val);
                      setSelectedCommitHash(matched?.commitHash);
                      setBranchSearchText("");
                    }}
                    onClear={() => {
                      setSelectedCommitHash(undefined);
                      setBranchSearchText("");
                    }}
                    notFoundContent={
                      branchSearchText
                        ? <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                            未找到分支，将使用「{branchSearchText}」创建新分支
                          </span>
                        : "暂无分支"
                    }
                    onBlur={() => {
                      // 用户直接输入时回填到 form（新分支名，无 commitHash）
                      if (branchSearchText && !branches.find((b) => b.name === branchSearchText)) {
                        form.setFieldValue("branch", branchSearchText);
                        setSelectedCommitHash(undefined);
                      }
                    }}
                    options={branches.map((b) => ({
                      value: b.name,
                      label: (
                        <span>
                          <BranchesOutlined style={{ marginRight: 6, color: "var(--text-tertiary)" }} />
                          {b.name}
                          <span style={{ marginLeft: 8, fontSize: 11, color: "var(--text-tertiary)" }}>
                            {b.commitHash.slice(0, 7)}
                          </span>
                        </span>
                      ),
                    }))}
                  />
                ) : (
                  <Input
                    placeholder="例如 main、release/v1.2，留空自动生成"
                    prefix={<BranchesOutlined style={{ color: "var(--text-tertiary)" }} />}
                  />
                )}
              </Form.Item>

              <Form.Item label="描述" name="description">
                <Input.TextArea rows={3} placeholder="选填，本次迭代的说明" />
              </Form.Item>

              {/* 构建配置折叠区 */}
              <Collapse ghost size="small" style={{ marginBottom: 8, border: "1px solid var(--border-color-base)", borderRadius: 6 }}>
                <Collapse.Panel header="构建配置（选填，创建后也可编辑）" key="build">
                  {buildEnvs.length > 0 && (
                    <Form.Item label="构建环境" name="environmentId" extra="选择此迭代使用的构建服务器环境">
                      <Select
                        placeholder="选择构建环境（可选）"
                        allowClear
                        options={buildEnvs.map((e) => ({ value: e.id ?? e._id ?? "", label: e.name }))}
                      />
                    </Form.Item>
                  )}

                  <Form.Item
                    label="构建命令"
                    name="buildCommandsRaw"
                    extra="每行一条命令，按顺序执行"
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder={"npm ci\nnpm run build"}
                      style={{ fontFamily: "monospace" }}
                    />
                  </Form.Item>

                  <Form.Item label="产物类型" name="artifactType">
                    <Select
                      options={[
                        { value: "zip", label: "ZIP 压缩包" },
                        { value: "docker-image", label: "Docker 镜像" },
                        { value: "binary", label: "二进制文件" },
                        { value: "static", label: "静态资源" },
                      ]}
                    />
                  </Form.Item>

                  {watchedArtifactType === "docker-image" ? (
                    <>
                      <Form.Item label="Dockerfile 路径" name="dockerfilePath">
                        <Input placeholder="Dockerfile" />
                      </Form.Item>
                      <Form.Item label="镜像仓库地址" name="imageRepo">
                        <Input placeholder="留空使用应用名" />
                      </Form.Item>
                    </>
                  ) : (
                    <Form.Item label="产物路径" name="artifactPath" extra="构建输出目录">
                      <Input placeholder="dist/" />
                    </Form.Item>
                  )}

                  <Form.Item label="超时时间（秒）" name="timeoutSec">
                    <InputNumber min={60} max={7200} style={{ width: "100%" }} />
                  </Form.Item>

                  <Form.Item label="构建环境变量">
                    <Form.List name="envVars">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map((field) => (
                            <Space key={field.key} align="baseline" style={{ display: "flex", marginBottom: 4 }}>
                              <Form.Item {...field} name={[field.name, "key"]} noStyle>
                                <Input placeholder="KEY" style={{ width: 140 }} />
                              </Form.Item>
                              <Form.Item {...field} name={[field.name, "value"]} noStyle>
                                <Input placeholder="VALUE" style={{ width: 180 }} />
                              </Form.Item>
                              <MinusCircleOutlined
                                onClick={() => remove(field.name)}
                                style={{ color: "var(--color-error)" }}
                              />
                            </Space>
                          ))}
                          <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} size="small">
                            添加环境变量
                          </Button>
                        </>
                      )}
                    </Form.List>
                  </Form.Item>
                </Collapse.Panel>
              </Collapse>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  创建迭代
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
