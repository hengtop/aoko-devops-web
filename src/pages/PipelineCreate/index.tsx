import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Select,
  Space,
  Switch,
  Typography,
  Divider,
  InputNumber,
} from "antd";
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, MinusCircleOutlined } from "@ant-design/icons";
import AppConsoleMenu from "@components/AppConsoleMenu";
import AppFooter from "@components/AppFooter";
import { buildAppDetailPath, buildPipelineDetailPath } from "@constants";
import {
  PIPELINE_TYPE_LABELS,
  TRIGGER_MODE_LABELS,
} from "@constants";
import {
  createPipeline,
  listRepositories,
  type PipelineStage,
  type PipelineJob,
  type RepositoryRecord,
} from "@service/api";
import styles from "./styles.module.less";

const { Title, Text } = Typography;

type FormValues = {
  name: string;
  code: string;
  type: string;
  triggerMode: string;
  repositoryId?: string;
  approvalRequired?: boolean;
  description?: string;
};

// 变量行（definition.variables）
type VariableRow = { key: string; varKey: string; value: string; isSecret: boolean };

const EXECUTOR_TYPES = [
  { value: "shell", label: "Shell 脚本" },
  { value: "docker", label: "Docker" },
  { value: "deploy", label: "部署" },
  { value: "artifact", label: "产物" },
  { value: "system", label: "系统" },
  { value: "manual_approval", label: "人工审批" },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

export default function PipelineCreate() {
  const navigate = useNavigate();
  const { id: appId = "" } = useParams<{ id: string }>();
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [repos, setRepos] = useState<RepositoryRecord[]>([]);
  const [variables, setVariables] = useState<VariableRow[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([
    {
      key: "stage-1",
      name: "构建",
      order: 1,
      jobs: [
        {
          key: "job-1",
          name: "编译",
          executorType: "shell",
          config: { script: "echo build" },
        },
      ],
    },
  ]);

  useEffect(() => {
    if (appId) {
      listRepositories({ applicationId: appId, pageNum: 1, pageSize: 50 }).then((res) => {
        if (res.success) setRepos(res.data?.list ?? []);
      });
    }
  }, [appId]);

  // ── Stage / Job helpers ──────────────────────────────────

  function addStage() {
    const order = stages.length + 1;
    setStages((prev) => [
      ...prev,
      { key: `stage-${Date.now()}`, name: `阶段 ${order}`, order, jobs: [] },
    ]);
  }

  function removeStage(key: string) {
    setStages((prev) => prev.filter((s) => s.key !== key));
  }

  function updateStageName(key: string, name: string) {
    setStages((prev) => prev.map((s) => (s.key === key ? { ...s, name } : s)));
  }

  function updateStageCondition(key: string, condition: string) {
    setStages((prev) => prev.map((s) => (s.key === key ? { ...s, condition } : s)));
  }

  function addJob(stageKey: string) {
    setStages((prev) =>
      prev.map((s) =>
        s.key === stageKey
          ? {
              ...s,
              jobs: [
                ...s.jobs,
                {
                  key: `job-${Date.now()}`,
                  name: "新任务",
                  executorType: "shell" as const,
                  config: {},
                },
              ],
            }
          : s,
      ),
    );
  }

  function removeJob(stageKey: string, jobKey: string) {
    setStages((prev) =>
      prev.map((s) =>
        s.key === stageKey ? { ...s, jobs: s.jobs.filter((j) => j.key !== jobKey) } : s,
      ),
    );
  }

  function updateJob(stageKey: string, jobKey: string, patch: Partial<PipelineJob>) {
    setStages((prev) =>
      prev.map((s) =>
        s.key === stageKey
          ? { ...s, jobs: s.jobs.map((j) => (j.key === jobKey ? { ...j, ...patch } : j)) }
          : s,
      ),
    );
  }

  // ── Variables helpers ────────────────────────────────────

  function addVariable() {
    setVariables((prev) => [
      ...prev,
      { key: `var-${Date.now()}`, varKey: "", value: "", isSecret: false },
    ]);
  }

  function removeVariable(key: string) {
    setVariables((prev) => prev.filter((v) => v.key !== key));
  }

  function updateVariable(key: string, patch: Partial<Omit<VariableRow, "key">>) {
    setVariables((prev) => prev.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  }

  // ── Submit ───────────────────────────────────────────────

  async function handleSubmit(values: FormValues) {
    if (!appId) return;
    if (stages.length === 0) {
      message.warning("请至少添加一个阶段");
      return;
    }

    // 重新排序 stages order
    const orderedStages = stages.map((s, idx) => ({ ...s, order: idx + 1 }));

    // 过滤掉 key 为空的变量
    const validVariables = variables
      .filter((v) => v.varKey.trim())
      .map(({ varKey, value, isSecret }) => ({ key: varKey, value, isSecret }));

    setSubmitting(true);
    try {
      const res = await createPipeline({
        applicationId: appId,
        repositoryId: values.repositoryId || undefined,
        name: values.name,
        code: values.code,
        type: values.type as "build" | "release",
        triggerMode: values.triggerMode as "manual" | "webhook" | "schedule" | "mixed",
        description: values.description,
        definition: {
          stages: orderedStages,
          approvalRequired: values.approvalRequired ?? false,
          ...(validVariables.length > 0 ? { variables: validVariables } : {}),
        },
      });

      if (res.success) {
        message.success("流水线创建成功");
        const pipelineId = res.data?.id ?? res.data?._id ?? "";
        if (pipelineId) {
          navigate(buildPipelineDetailPath(appId, pipelineId));
        } else {
          navigate(buildAppDetailPath(appId, "pipelines"));
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
              onClick={() => navigate(buildAppDetailPath(appId, "pipelines"))}
            >
              返回
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              创建流水线
            </Title>
          </div>

          <div className={styles.twoCol}>
            {/* ── 基础信息 ── */}
            <Card title="基础信息" className={styles.formCard}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                requiredMark={false}
                onValuesChange={(changed) => {
                  if (changed.name) {
                    form.setFieldValue("code", slugify(changed.name));
                  }
                }}
              >
                <Form.Item label="流水线名称" name="name" rules={[{ required: true, message: "请输入名称" }]}>
                  <Input placeholder="例如：主干构建" />
                </Form.Item>
                <Form.Item
                  label="Code"
                  name="code"
                  rules={[
                    { required: true, message: "请输入 Code" },
                    { pattern: /^[a-z0-9-]+$/, message: "只允许小写字母、数字和短线" },
                  ]}
                  extra="流水线唯一标识，创建后不可修改"
                >
                  <Input placeholder="pipeline-code" />
                </Form.Item>
                <Form.Item label="类型" name="type" initialValue="build" rules={[{ required: true }]}>
                  <Select options={Object.entries(PIPELINE_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
                </Form.Item>
                <Form.Item label="触发方式" name="triggerMode" initialValue="manual" rules={[{ required: true }]}>
                  <Select options={Object.entries(TRIGGER_MODE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
                </Form.Item>

                {repos.length > 0 && (
                  <Form.Item label="关联仓库" name="repositoryId" extra="流水线拉取代码的仓库（选填）">
                    <Select
                      placeholder="选择仓库（可选）"
                      allowClear
                      options={repos.map((r) => ({ value: r.id ?? r._id, label: r.repoName }))}
                    />
                  </Form.Item>
                )}

                <Form.Item label="需要审批" name="approvalRequired" valuePropName="checked" initialValue={false}>
                  <Switch checkedChildren="需要" unCheckedChildren="不需要" />
                </Form.Item>

                <Form.Item label="描述" name="description">
                  <Input.TextArea rows={2} placeholder="选填" />
                </Form.Item>

                <Divider orientationMargin={0} style={{ fontSize: 13, margin: "16px 0 10px" }}>
                  流水线变量
                </Divider>
                <div style={{ marginBottom: 12 }}>
                  {variables.map((v) => (
                    <div key={v.key} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                      <Input
                        size="small"
                        placeholder="变量名"
                        value={v.varKey}
                        style={{ flex: 1 }}
                        onChange={(e) => updateVariable(v.key, { varKey: e.target.value })}
                      />
                      <Input
                        size="small"
                        placeholder="默认值"
                        value={v.value}
                        style={{ flex: 1 }}
                        onChange={(e) => updateVariable(v.key, { value: e.target.value })}
                      />
                      <Switch
                        size="small"
                        checked={v.isSecret}
                        checkedChildren="密"
                        unCheckedChildren="明"
                        onChange={(checked) => updateVariable(v.key, { isSecret: checked })}
                      />
                      <Button
                        size="small"
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => removeVariable(v.key)}
                      />
                    </div>
                  ))}
                  <Button size="small" icon={<PlusOutlined />} onClick={addVariable}>
                    添加变量
                  </Button>
                </div>

                <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                  <Button type="primary" htmlType="submit" loading={submitting}>
                    创建流水线
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            {/* ── Stage 编排 ── */}
            <div className={styles.stagesArea}>
              <div className={styles.stagesHeader}>
                <Text strong>阶段编排</Text>
                <Button size="small" icon={<PlusOutlined />} onClick={addStage}>
                  添加阶段
                </Button>
              </div>

              {stages.length === 0 && (
                <Text type="secondary" style={{ fontSize: 13 }}>暂无阶段，点击「添加阶段」开始编排</Text>
              )}

              {stages.map((stage) => (
                <Card
                  key={stage.key}
                  size="small"
                  className={styles.stageCard}
                  title={
                    <Input
                      value={stage.name}
                      size="small"
                      style={{ width: 140, fontWeight: 500 }}
                      onChange={(e) => updateStageName(stage.key, e.target.value)}
                    />
                  }
                  extra={
                    <Space>
                      <Button size="small" icon={<PlusOutlined />} onClick={() => addJob(stage.key)}>
                        添加任务
                      </Button>
                      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeStage(stage.key)} />
                    </Space>
                  }
                >
                  <div style={{ marginBottom: 8 }}>
                    <Input
                      size="small"
                      placeholder="执行条件（可选，如：${{ success() }}）"
                      value={stage.condition ?? ""}
                      onChange={(e) => updateStageCondition(stage.key, e.target.value)}
                      prefix={<span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>条件</span>}
                    />
                  </div>

                  {stage.jobs.length === 0 && (
                    <Text type="secondary" style={{ fontSize: 12 }}>暂无任务，点击「添加任务」</Text>
                  )}

                  {stage.jobs.map((job) => (
                    <div key={job.key} className={styles.jobRow}>
                      <Input
                        size="small"
                        value={job.name}
                        placeholder="任务名称"
                        style={{ flex: 1, minWidth: 80 }}
                        onChange={(e) => updateJob(stage.key, job.key, { name: e.target.value })}
                      />
                      <Select
                        size="small"
                        value={job.executorType}
                        style={{ width: 110 }}
                        onChange={(v) => updateJob(stage.key, job.key, { executorType: v as PipelineJob["executorType"] })}
                        options={EXECUTOR_TYPES}
                      />
                      <InputNumber
                        size="small"
                        min={0}
                        max={3600}
                        value={job.timeoutSec ?? 0}
                        placeholder="超时(s)"
                        style={{ width: 76 }}
                        onChange={(v) => updateJob(stage.key, job.key, { timeoutSec: v ?? 0 })}
                      />
                      <Switch
                        size="small"
                        checked={!!job.retry}
                        checkedChildren="重试"
                        unCheckedChildren="不重"
                        onChange={(v) => updateJob(stage.key, job.key, { retry: v ? 1 : 0 })}
                      />
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeJob(stage.key, job.key)}
                      />
                    </div>
                  ))}
                </Card>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
