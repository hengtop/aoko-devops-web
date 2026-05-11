import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Divider,
  Form,
  Input,
  Radio,
  Select,
  Space,
  Steps,
  Tag,
  Typography,
  message,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import AppConsoleMenu from "@components/AppConsoleMenu";
import AppFooter from "@components/AppFooter";
import {
  CREDENTIAL_TYPE_LABELS,
  CREDENTIAL_TYPES,
  buildAppDetailPath,
  buildProductDetailPath,
} from "@constants";
import {
  createApplication,
  getApplicationDetail,
  listCredentials,
  listProducts,
  listTemplates,
  type CredentialRecord,
  type ProductRecord,
  type TemplateRecord,
} from "@service/api";
import styles from "./styles.module.less";

// 公司默认 Git 服务域名前缀，后端统一配置
const DEFAULT_REPO_PREFIX = "http://git.1145161.xyz/";
const DEFAULT_REPO_BRANCH = "main";
const DEFAULT_TEMPLATE_INIT_MESSAGE = "chore: initialize application from template";
const TEMPLATE_INIT_REQUEST_TIMEOUT_MS = 180000;

const { Title, Text } = Typography;

type RepoMode = "default" | "existing";
type TemplateMode = "none" | "template";
type ResponseMessage = string | string[];

type FormValues = {
  productId: string;
  name: string;
  code: string;
  repoMode: RepoMode;
  repoCode?: string;
  repo_url?: string;
  repo_default_branch?: string;
  repo_credential_id?: string;
  templateMode: TemplateMode;
  template_id?: string;
  template_init_message?: string;
  description?: string;
  structure?: string;
  level?: string;
};

type IdRecord = {
  id?: string;
  _id?: string;
};

type ServiceError = Error & {
  handled?: boolean;
  data?: {
    msg?: ResponseMessage;
  };
};

const STRUCTURE_OPTIONS = [
  { value: "frontend", label: "前端" },
  { value: "backend", label: "后端" },
  { value: "microservice", label: "微服务" },
  { value: "fullstack", label: "全栈" },
  { value: "other", label: "其他" },
];

const LEVEL_OPTIONS = [
  { value: "P0", label: "P0 - 核心" },
  { value: "P1", label: "P1 - 重要" },
  { value: "P2", label: "P2 - 一般" },
  { value: "P3", label: "P3 - 低优先" },
];

const INIT_STEP_ITEMS = [
  { title: "校验仓库", description: "检查模板与目标分支" },
  { title: "复制模板", description: "clone 模板仓库内容" },
  { title: "推送提交", description: "写入目标应用仓库" },
  { title: "创建完成", description: "查询应用详情并跳转" },
];

function getRecordId(record: IdRecord) {
  return record.id ?? record._id ?? "";
}

function normalizeOptionalField(value?: string) {
  const text = value?.trim();
  return text ? text : undefined;
}

function formatResponseMessage(msg: ResponseMessage | undefined, fallback: string) {
  if (Array.isArray(msg)) {
    const text = msg.filter(Boolean).join("，");
    return text || fallback;
  }

  if (typeof msg === "string" && msg.trim()) {
    return msg;
  }

  return fallback;
}

function isHandledError(error: unknown): error is ServiceError {
  return Boolean(error && typeof error === "object" && "handled" in error && error.handled);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    const serviceError = error as ServiceError;
    return formatResponseMessage(serviceError.data?.msg, serviceError.message || fallback);
  }

  return fallback;
}

function getCredentialLabel(record: CredentialRecord) {
  const typeLabel = CREDENTIAL_TYPE_LABELS[record.type] ?? record.type;
  return `${record.name} · ${typeLabel}`;
}

function getTemplateLabel(record: TemplateRecord) {
  return `${record.name}（${record.code}）`;
}

export default function AppCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm<FormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [credentials, setCredentials] = useState<CredentialRecord[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [repoMode, setRepoMode] = useState<RepoMode>("default");
  const [templateMode, setTemplateMode] = useState<TemplateMode>("none");
  const [submitError, setSubmitError] = useState<string>();
  const [activeInitStep, setActiveInitStep] = useState(0);

  const defaultProductId = searchParams.get("productId") ?? undefined;
  const repoCodeValue = Form.useWatch("repoCode", form);
  const selectedTemplateId = Form.useWatch("template_id", form);

  const selectedTemplate = useMemo(
    () => templates.find((item) => getRecordId(item) === selectedTemplateId),
    [selectedTemplateId, templates],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoadingProducts(true);
      try {
        const res = await listProducts({ pageNum: 1, pageSize: 100 });
        if (res.success && !cancelled) {
          setProducts(res.data?.list ?? []);
        }
      } catch (error) {
        if (!cancelled && !isHandledError(error)) {
          messageApi.error(getErrorMessage(error, "产品线加载失败，请稍后重试"));
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    }

    async function loadTemplates() {
      setLoadingTemplates(true);
      try {
        const res = await listTemplates({ pageNum: 1, pageSize: 100 });
        if (res.success && !cancelled) {
          setTemplates(res.data?.list ?? []);
        }
      } catch (error) {
        if (!cancelled && !isHandledError(error)) {
          messageApi.error(getErrorMessage(error, "模板列表加载失败，请稍后重试"));
        }
      } finally {
        if (!cancelled) {
          setLoadingTemplates(false);
        }
      }
    }

    async function loadCredentials() {
      setLoadingCredentials(true);
      try {
        const res = await listCredentials({
          type: CREDENTIAL_TYPES.GIT_TOKEN,
          pageNum: 1,
          pageSize: 100,
        });
        if (res.success && !cancelled) {
          setCredentials(res.data?.list ?? []);
        }
      } catch (error) {
        if (!cancelled && !isHandledError(error)) {
          messageApi.error(getErrorMessage(error, "凭据列表加载失败，请稍后重试"));
        }
      } finally {
        if (!cancelled) {
          setLoadingCredentials(false);
        }
      }
    }

    void loadProducts();
    void loadTemplates();
    void loadCredentials();

    return () => {
      cancelled = true;
    };
  }, [messageApi]);

  useEffect(() => {
    if (defaultProductId) {
      form.setFieldValue("productId", defaultProductId);
    }
  }, [defaultProductId, form]);

  useEffect(() => {
    if (!submitting || templateMode !== "template") {
      return;
    }

    setActiveInitStep(0);
    const cloneTimer = window.setTimeout(() => setActiveInitStep(1), 1200);
    const pushTimer = window.setTimeout(() => setActiveInitStep(2), 4200);

    return () => {
      window.clearTimeout(cloneTimer);
      window.clearTimeout(pushTimer);
    };
  }, [submitting, templateMode]);

  function handleTemplateModeChange(nextMode: TemplateMode) {
    setTemplateMode(nextMode);
    setSubmitError(undefined);

    if (nextMode === "none") {
      form.setFieldsValue({
        template_id: undefined,
        template_init_message: undefined,
      });
      return;
    }

    form.setFieldValue("template_init_message", DEFAULT_TEMPLATE_INIT_MESSAGE);
  }

  async function navigateToCreatedApplication(productId: string, code: string) {
    try {
      const detailRes = await getApplicationDetail({ code });

      if (detailRes.success) {
        const appId = getRecordId(detailRes.data ?? {});
        if (appId) {
          navigate(buildAppDetailPath(appId));
          return;
        }
      }
    } catch (error) {
      if (!isHandledError(error)) {
        messageApi.warning(getErrorMessage(error, "应用已创建，但详情查询失败"));
      }
    }

    messageApi.warning("应用已创建，但暂未拿到详情 ID，已返回产品详情");
    navigate(buildProductDetailPath(productId));
  }

  async function handleSubmit(values: FormValues) {
    setSubmitting(true);
    setSubmitError(undefined);

    const useTemplate = values.templateMode === "template";
    const code = values.code.trim();
    const repoUrl =
      values.repoMode === "default"
        ? `${DEFAULT_REPO_PREFIX}${normalizeOptionalField(values.repoCode) ?? code}`
        : (normalizeOptionalField(values.repo_url) ?? "");

    try {
      const res = await createApplication(
        {
          tenantId: "default",
          productId: values.productId,
          name: values.name.trim(),
          code,
          repo_url: repoUrl,
          repo_default_branch:
            normalizeOptionalField(values.repo_default_branch) ?? DEFAULT_REPO_BRANCH,
          repo_credential_id: normalizeOptionalField(values.repo_credential_id),
          template_id: useTemplate ? values.template_id : undefined,
          template_init_message: useTemplate
            ? normalizeOptionalField(values.template_init_message) ?? DEFAULT_TEMPLATE_INIT_MESSAGE
            : undefined,
          description: normalizeOptionalField(values.description),
          structure: normalizeOptionalField(values.structure),
          level: normalizeOptionalField(values.level),
        },
        {
          timeout: useTemplate ? TEMPLATE_INIT_REQUEST_TIMEOUT_MS : undefined,
          useGlobalErrorHandler: false,
        },
      );

      if (!res.success) {
        const errorMessage = formatResponseMessage(res.msg, "创建失败");
        setSubmitError(errorMessage);
        messageApi.error(errorMessage);
        return;
      }

      if (useTemplate) {
        setActiveInitStep(3);
      }

      messageApi.success(useTemplate ? "应用创建成功，模板仓库已初始化" : "应用创建成功");
      await navigateToCreatedApplication(values.productId, code);
    } catch (error) {
      if (isHandledError(error)) {
        return;
      }

      const errorMessage = getErrorMessage(error, "创建失败，请稍后重试");
      setSubmitError(errorMessage);
      messageApi.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.layout}>
      {contextHolder}
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>菜单</div>
          <AppConsoleMenu />
        </aside>
        <div className={styles.main}>
          <div className={styles.header}>
            <Button type="text" size="small" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              返回
            </Button>
          </div>

          <div className={styles.formContainer}>
            <div className={styles.formTitle}>
              <Title level={4} style={{ margin: 0 }}>
                创建应用
              </Title>
              <Text type="secondary">应用对应一个可独立部署的代码仓库，可选择模板完成首次初始化</Text>
            </div>

            {submitError && (
              <Alert
                className={styles.submitAlert}
                type="error"
                showIcon
                message="创建失败"
                description={submitError}
              />
            )}

            {submitting && templateMode === "template" && (
              <Card className={styles.progressCard}>
                <div className={styles.progressHeader}>
                  <div>
                    <div className={styles.progressTitle}>正在初始化模板仓库</div>
                    <div className={styles.progressDesc}>
                      后端正在同步复制模板、提交并推送到目标仓库，请保持页面打开。
                    </div>
                  </div>
                  <Tag color="processing">预计需要几十秒</Tag>
                </div>
                <Steps
                  size="small"
                  current={activeInitStep}
                  status={submitError ? "error" : "process"}
                  items={INIT_STEP_ITEMS}
                />
              </Card>
            )}

            <Card className={styles.formCard}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                requiredMark={false}
                disabled={submitting}
                initialValues={{
                  repoMode: "default",
                  repo_default_branch: DEFAULT_REPO_BRANCH,
                  templateMode: "none",
                }}
              >
                <div className={styles.formSectionTitle}>基础信息</div>

                <Form.Item
                  label="所属产品线"
                  name="productId"
                  rules={[{ required: true, message: "请选择所属产品线" }]}
                >
                  <Select
                    placeholder="选择产品线"
                    loading={loadingProducts}
                    options={products.map((p) => ({
                      value: getRecordId(p),
                      label: p.name,
                    }))}
                    showSearch
                    filterOption={(input, opt) =>
                      String(opt?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </Form.Item>

                <Form.Item
                  label="应用名称"
                  name="name"
                  rules={[{ required: true, message: "请输入应用名称" }]}
                >
                  <Input placeholder="例如：用户中台" />
                </Form.Item>

                <Form.Item
                  label="应用 Code"
                  name="code"
                  rules={[
                    { required: true, message: "请输入应用 Code" },
                    {
                      pattern: /^[a-z0-9-]+$/,
                      message: "仅支持小写字母、数字和连字符",
                    },
                  ]}
                  extra="应用唯一标识，创建后不可修改"
                >
                  <Input
                    placeholder="例如：user-center"
                    onChange={(e) => form.setFieldValue("repoCode", e.target.value)}
                  />
                </Form.Item>

                <Form.Item label="应用描述" name="description">
                  <Input.TextArea rows={3} placeholder="简要描述应用的功能" />
                </Form.Item>

                <div className={styles.inlineFields}>
                  <Form.Item label="应用架构" name="structure">
                    <Select placeholder="选择应用架构类型" options={STRUCTURE_OPTIONS} allowClear />
                  </Form.Item>

                  <Form.Item label="应用等级" name="level" extra="按照业务重要性分级">
                    <Select placeholder="选择应用等级" options={LEVEL_OPTIONS} allowClear />
                  </Form.Item>
                </div>

                <Divider className={styles.formDivider} />
                <div className={styles.formSectionTitle}>仓库配置</div>

                <Form.Item label="仓库配置方式" name="repoMode">
                  <Radio.Group
                    onChange={(e) => setRepoMode(e.target.value)}
                    options={[
                      { value: "default", label: "自动创建（使用公司默认 Git 服务）" },
                      { value: "existing", label: "已有仓库（粘贴仓库地址）" },
                    ]}
                  />
                </Form.Item>

                {repoMode === "default" && (
                  <Form.Item
                    label="仓库 Code"
                    name="repoCode"
                    rules={[{ required: true, message: "请输入仓库 Code" }]}
                    extra={
                      <span>
                        最终仓库地址：
                        <Typography.Text code className={styles.repoPreview}>
                          {DEFAULT_REPO_PREFIX}{repoCodeValue || "<code>"}
                        </Typography.Text>
                      </span>
                    }
                  >
                    <Input
                      addonBefore={<span className={styles.repoPrefix}>{DEFAULT_REPO_PREFIX}</span>}
                      placeholder="与应用 Code 相同，可修改"
                    />
                  </Form.Item>
                )}

                {repoMode === "existing" && (
                  <Form.Item
                    label="仓库地址"
                    name="repo_url"
                    rules={[{ required: true, message: "请输入仓库地址" }]}
                    extra="目标仓库需要提前存在；选择模板初始化时，目标分支必须为空"
                  >
                    <Input placeholder="https://github.com/org/repo.git" />
                  </Form.Item>
                )}

                <div className={styles.inlineFields}>
                  <Form.Item
                    label="初始化分支"
                    name="repo_default_branch"
                    rules={[{ required: true, message: "请输入初始化分支" }]}
                    extra="选择模板时后端会推送到该分支"
                  >
                    <Input placeholder="main" />
                  </Form.Item>

                  <Form.Item
                    label="目标仓库凭据"
                    name="repo_credential_id"
                    extra="目标仓库无需认证时可留空"
                  >
                    <Select
                      placeholder="选择 Git Token 凭据"
                      loading={loadingCredentials}
                      allowClear
                      showSearch
                      options={credentials.map((item) => ({
                        value: getRecordId(item),
                        label: getCredentialLabel(item),
                      }))}
                      filterOption={(input, opt) =>
                        String(opt?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    />
                  </Form.Item>
                </div>

                <Divider className={styles.formDivider} />
                <div className={styles.formSectionTitle}>模板初始化</div>

                <Form.Item label="是否使用模板" name="templateMode">
                  <Radio.Group
                    onChange={(e) => handleTemplateModeChange(e.target.value)}
                    options={[
                      { value: "none", label: "暂不使用模板" },
                      { value: "template", label: "从模板初始化仓库" },
                    ]}
                  />
                </Form.Item>

                {templateMode === "template" && (
                  <div className={styles.templateSection}>
                    <Alert
                      type="info"
                      showIcon
                      message="模板初始化会同步执行"
                      description="提交后后端会复制模板仓库并推送到目标应用仓库。目标分支已存在提交时会失败，避免覆盖已有代码。"
                    />

                    <Form.Item
                      label="应用模板"
                      name="template_id"
                      rules={[{ required: true, message: "请选择应用模板" }]}
                    >
                      <Select
                        placeholder="选择要复制的模板"
                        loading={loadingTemplates}
                        showSearch
                        options={templates.map((item) => ({
                          value: getRecordId(item),
                          label: getTemplateLabel(item),
                        }))}
                        filterOption={(input, opt) =>
                          String(opt?.label ?? "")
                            .toLowerCase()
                            .includes(input.toLowerCase())
                        }
                      />
                    </Form.Item>

                    {selectedTemplate && (
                      <div className={styles.templatePreview}>
                        <div className={styles.templatePreviewTitle}>
                          {selectedTemplate.name}
                          <Tag className={styles.templateCodeTag}>{selectedTemplate.code}</Tag>
                        </div>
                        <div className={styles.templatePreviewMeta}>
                          <span>仓库：{selectedTemplate.repo_url}</span>
                          <span>
                            来源分支：{selectedTemplate.repo_default_branch || DEFAULT_REPO_BRANCH}
                          </span>
                        </div>
                      </div>
                    )}

                    <Form.Item
                      label="初始化提交信息"
                      name="template_init_message"
                      extra="会作为目标仓库的首次提交 message"
                    >
                      <Input placeholder={DEFAULT_TEMPLATE_INIT_MESSAGE} />
                    </Form.Item>
                  </div>
                )}

                <Form.Item className={styles.submitItem}>
                  <Space>
                    <Button type="primary" htmlType="submit" loading={submitting}>
                      {submitting && templateMode === "template" ? "初始化仓库中" : "创建应用"}
                    </Button>
                    <Button onClick={() => navigate(-1)}>取消</Button>
                  </Space>
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
