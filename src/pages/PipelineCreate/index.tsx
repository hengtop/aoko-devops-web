import { useState } from "react";
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
} from "antd";
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import AppConsoleMenu from "@components/AppConsoleMenu";
import AppFooter from "@components/AppFooter";
import { buildAppDetailPath } from "@constants";
import {
  PIPELINE_TYPE_LABELS,
  TRIGGER_MODE_LABELS,
} from "@constants";
import { createPipeline, type PipelineStage, type PipelineJob } from "@service/api";
import styles from "./styles.module.less";

const { Title, Text } = Typography;

type FormValues = {
  name: string;
  code: string;
  type: string;
  triggerMode: string;
  description?: string;
};

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

  function addStage() {
    const order = stages.length + 1;
    setStages((prev) => [
      ...prev,
      {
        key: `stage-${Date.now()}`,
        name: `阶段 ${order}`,
        order,
        jobs: [],
      },
    ]);
  }

  function removeStage(key: string) {
    setStages((prev) => prev.filter((s) => s.key !== key));
  }

  function updateStageName(key: string, name: string) {
    setStages((prev) => prev.map((s) => (s.key === key ? { ...s, name } : s)));
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

  async function handleSubmit(values: FormValues) {
    if (!appId) return;
    if (stages.length === 0) {
      message.warning("请至少添加一个阶段");
      return;
    }
    setSubmitting(true);
    const res = await createPipeline({
      applicationId: appId,
      name: values.name,
      code: values.code,
      type: values.type as "build" | "release",
      triggerMode: values.triggerMode as "manual" | "webhook" | "schedule" | "mixed",
      description: values.description,
      definition: { stages },
    });
    setSubmitting(false);
    if (res.success) {
      message.success("流水线创建成功");
      navigate(buildAppDetailPath(appId, "pipelines"));
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
            {/* 基础信息 */}
            <Card title="基础信息" className={styles.formCard}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                onValuesChange={(changed) => {
                  if (changed.name) {
                    form.setFieldValue("code", slugify(changed.name));
                  }
                }}
              >
                <Form.Item label="名称" name="name" rules={[{ required: true }]}>
                  <Input placeholder="流水线名称" />
                </Form.Item>
                <Form.Item
                  label="Code"
                  name="code"
                  rules={[
                    { required: true },
                    { pattern: /^[a-z0-9-]+$/, message: "只允许小写字母、数字和短线" },
                  ]}
                >
                  <Input placeholder="pipeline-code" />
                </Form.Item>
                <Form.Item label="类型" name="type" initialValue="build" rules={[{ required: true }]}>
                  <Select>
                    {Object.entries(PIPELINE_TYPE_LABELS).map(([v, l]) => (
                      <Select.Option key={v} value={v}>
                        {l}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  label="触发方式"
                  name="triggerMode"
                  initialValue="manual"
                  rules={[{ required: true }]}
                >
                  <Select>
                    {Object.entries(TRIGGER_MODE_LABELS).map(([v, l]) => (
                      <Select.Option key={v} value={v}>
                        {l}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="描述" name="description">
                  <Input.TextArea rows={2} placeholder="选填" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={submitting}>
                    创建流水线
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            {/* Stage 编排 */}
            <div className={styles.stagesArea}>
              <div className={styles.stagesHeader}>
                <Text strong>阶段编排</Text>
                <Button size="small" icon={<PlusOutlined />} onClick={addStage}>
                  添加阶段
                </Button>
              </div>

              {stages.map((stage) => (
                <Card
                  key={stage.key}
                  size="small"
                  className={styles.stageCard}
                  title={
                    <Input
                      value={stage.name}
                      size="small"
                      style={{ width: 160, fontWeight: 500 }}
                      onChange={(e) => updateStageName(stage.key, e.target.value)}
                    />
                  }
                  extra={
                    <Space>
                      <Button
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => addJob(stage.key)}
                      >
                        添加任务
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeStage(stage.key)}
                      />
                    </Space>
                  }
                >
                  {stage.jobs.length === 0 && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      暂无任务，点击「添加任务」
                    </Text>
                  )}
                  {stage.jobs.map((job) => (
                    <div key={job.key} className={styles.jobRow}>
                      <Input
                        size="small"
                        value={job.name}
                        placeholder="任务名称"
                        style={{ width: 120 }}
                        onChange={(e) =>
                          updateJob(stage.key, job.key, { name: e.target.value })
                        }
                      />
                      <Select
                        size="small"
                        value={job.executorType}
                        style={{ width: 120 }}
                        onChange={(v) =>
                          updateJob(stage.key, job.key, {
                            executorType: v as PipelineJob["executorType"],
                          })
                        }
                        options={EXECUTOR_TYPES}
                      />
                      <Switch
                        size="small"
                        checked={!!job.retry}
                        checkedChildren="重试"
                        unCheckedChildren="不重试"
                        onChange={(v) =>
                          updateJob(stage.key, job.key, { retry: v ? 1 : 0 })
                        }
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
