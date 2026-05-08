import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Form, Input, message, Select, Spin, Typography } from "antd";
import { ArrowLeftOutlined, BranchesOutlined } from "@ant-design/icons";
import AppConsoleMenu from "@components/AppConsoleMenu";
import AppFooter from "@components/AppFooter";
import { APP_ROUTE_PATHS, buildAppDetailPath, buildReleaseDetailPath } from "@constants";
import {
  createRelease,
  getApplicationDetail,
  listRepositories,
  listRepositoryBranches,
  type BranchInfo,
  type RepositoryRecord,
} from "@service/api";
import styles from "./styles.module.less";

const { Title, Text } = Typography;

type FormValues = {
  version: string;
  title: string;
  branch?: string;
  description?: string;
  repositoryId?: string;
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

export default function ReleaseCreate() {
  const navigate = useNavigate();
  const { appId = "" } = useParams<{ appId: string }>();
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [repos, setRepos] = useState<RepositoryRecord[]>([]);
  const [productId, setProductId] = useState("");
  // 分支相关状态
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchSearchText, setBranchSearchText] = useState("");
  // 已选分支的 commitHash（仅选择已有分支时有值，手动输入新分支名时为 undefined）
  const [selectedCommitHash, setSelectedCommitHash] = useState<string | undefined>();

  useEffect(() => {
    if (appId) {
      listRepositories({ applicationId: appId, pageNum: 1, pageSize: 50 }).then((res) => {
        if (res.success) {
          const list = res.data?.list ?? [];
          setRepos(list);
          // 若只有一个仓库，自动选中并加载分支
          if (list.length === 1) {
            const repoId = list[0].id ?? list[0]._id ?? "";
            form.setFieldValue("repositoryId", repoId);
            fetchBranches(repoId);
          }
        }
      });
      getApplicationDetail({ id: appId }).then((res) => {
        if (res.success && res.data) setProductId(res.data.productId ?? "");
      });
      // 设置默认分支名
      form.setFieldValue("branch", generateDefaultBranch());
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

  function handleRepoChange(repositoryId: string) {
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
    const repositoryId = values.repositoryId ?? undefined;
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

              {repos.length > 0 && (
                <Form.Item label="关联仓库" name="repositoryId">
                  <Select
                    placeholder="选择仓库（可选）"
                    allowClear
                    onChange={(val) => handleRepoChange(val as string)}
                    onClear={() => { setBranches([]); setBranchSearchText(""); }}
                  >
                    {repos.map((r) => (
                      <Select.Option key={r.id ?? r._id} value={r.id ?? r._id}>
                        {r.repoName}
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
