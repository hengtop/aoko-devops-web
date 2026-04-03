import { useEffect, useMemo, useState } from "react";
import { ArrowLeftOutlined, CopyOutlined, EditOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Space, message } from "antd";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AppConsoleMenu from "../../components/AppConsoleMenu";
import ConfigCodeViewer from "../../components/ConfigCodeViewer";
import { getConfigCodePresentation } from "../../components/ConfigCodeViewer/utils";
import AppFooter from "../../components/AppFooter";
import {
  createConfiguration,
  getConfigurationDetail,
  updateConfiguration,
  type ConfigurationMutationPayload,
  type ConfigurationRecord,
} from "../../service/api";
import styles from "./styles.module.less";

type ConfigurationEditorFormValues = Omit<ConfigurationMutationPayload, "status">;

function getConfigurationId(record: Partial<ConfigurationRecord>) {
  return record.id ?? record._id ?? "";
}

function inferExtensionFromFileName(fileName?: string) {
  const normalizedFileName = fileName?.trim() ?? "";

  if (!normalizedFileName) {
    return "";
  }

  if (/^dockerfile$/i.test(normalizedFileName)) {
    return "dockerfile";
  }

  if (/^\.env(\..+)?$/i.test(normalizedFileName)) {
    return "env";
  }

  const matchedExtension = normalizedFileName.match(/\.([^.]+)$/);

  return matchedExtension?.[1]?.toLowerCase() ?? "";
}

export default function ConfigurationEditor() {
  const [form] = Form.useForm<ConfigurationEditorFormValues>();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [record, setRecord] = useState<ConfigurationRecord | null>(null);
  const fileName = Form.useWatch("fileName", form) ?? "";
  const ext = Form.useWatch("ext", form) ?? "";
  const content = Form.useWatch("content", form) ?? "";

  const pageMode = !id ? "create" : location.pathname.endsWith("/edit") ? "edit" : "detail";
  const isReadOnly = pageMode === "detail";
  const inferredExt = useMemo(() => inferExtensionFromFileName(fileName), [fileName]);
  const previewPresentation = useMemo(
    () => getConfigCodePresentation(ext, fileName, content),
    [content, ext, fileName],
  );

  useEffect(() => {
    if (!id) {
      setRecord(null);
      form.resetFields();
      return;
    }

    const configurationId = id;

    let cancelled = false;

    async function fetchConfigurationDetail() {
      setLoading(true);

      try {
        const response = await getConfigurationDetail(configurationId);

        if (!response.success || !response.data || cancelled) {
          return;
        }

        setRecord(response.data);
        form.setFieldsValue({
          name: response.data.name,
          fileName: response.data.fileName,
          ext: response.data.ext,
          content: response.data.content,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error && typeof error === "object" && "handled" in error && error.handled) {
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "配置详情加载失败，请稍后重试";
        messageApi.error(errorMessage);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchConfigurationDetail();

    return () => {
      cancelled = true;
    };
  }, [form, id, messageApi]);

  async function handleSubmit() {
    try {
      const values = await form.validateFields();
      const payload: ConfigurationMutationPayload = {
        name: values.name.trim(),
        fileName: values.fileName.trim(),
        ext: values.ext.trim(),
        content: values.content,
        status: record?.status ?? "enable",
      };

      setSubmitting(true);

      if (pageMode === "edit") {
        const recordId = getConfigurationId(record ?? {});

        if (!recordId) {
          messageApi.error("当前记录缺少 id，无法更新");
          return;
        }

        const response = await updateConfiguration({
          id: recordId,
          ...payload,
        });

        if (!response.success) {
          return;
        }

        messageApi.success("配置已更新");
      } else {
        const response = await createConfiguration(payload);

        if (!response.success) {
          return;
        }

        messageApi.success("配置已创建");
      }

      navigate("/configuration");
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) {
        return;
      }

      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "配置保存失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  function handleInferExtension() {
    form.setFieldValue("ext", inferredExt);
  }

  async function handleCopyPreview() {
    const textToCopy = previewPresentation.content;

    if (!textToCopy) {
      messageApi.warning("当前没有可复制的配置内容");
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        messageApi.success("已复制格式化后的配置");
        return;
      }

      throw new Error("Clipboard API unavailable");
    } catch {
      messageApi.error("复制失败，请检查浏览器剪贴板权限");
    }
  }

  function handleBack() {
    if (pageMode === "detail" && typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/configuration");
  }

  return (
    <div className={styles.editorPage}>
      {contextHolder}

      <div className={styles.editorBody}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>菜单</div>
          <AppConsoleMenu />
          <div className={styles.sidebarNote}>
            当前页面聚焦单份配置的结构化编辑与代码预览，保存后返回配置列表。
          </div>
        </aside>

        <main className={styles.mainSection}>
          <section className={styles.sectionHeader}>
            <div>
              <div className={styles.sectionTitle}>
                {pageMode === "edit" ? "编辑配置" : pageMode === "detail" ? "配置详情" : "新建配置"}
              </div>
              <div className={styles.sectionSubtitle}>
                {isReadOnly
                  ? "详情页展示配置的当前结构与正文内容，可直接复制格式化后的配置。"
                  : "维护配置名称、文件名称、扩展名和正文内容，支持按文件名称快速推断扩展名。"}
              </div>
            </div>
            <Space className={styles.quickActions}>
              <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                {pageMode === "detail" ? "返回上级" : "返回列表"}
              </Button>
              {pageMode === "detail" ? (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/configuration/${id}/edit`)}
                >
                  进入编辑
                </Button>
              ) : (
                <Button
                  type="primary"
                  loading={submitting}
                  onClick={() => void handleSubmit()}
                >
                  {pageMode === "edit" ? "保存配置" : "创建配置"}
                </Button>
              )}
            </Space>
          </section>

          <div className={styles.contentLayout}>
            <Card className={styles.formCard} variant="borderless" loading={loading}>
              <Form<ConfigurationEditorFormValues>
                form={form}
                layout="vertical"
                className={styles.editorForm}
              >
                <div className={styles.formGrid}>
                  <Form.Item
                    name="name"
                    label="配置名称"
                    rules={[{ required: true, whitespace: true, message: "请输入配置名称" }]}
                  >
                    <Input placeholder="例如：生产环境发布配置" disabled={isReadOnly} />
                  </Form.Item>
                  <Form.Item
                    name="fileName"
                    label="文件名称"
                    rules={[{ required: true, whitespace: true, message: "请输入文件名称" }]}
                  >
                    <Input
                      placeholder="例如：deploy-prod.yaml / .env.production / Dockerfile"
                      disabled={isReadOnly}
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  name="ext"
                  label="扩展名"
                  extra={inferredExt ? `根据当前文件名称推断：${inferredExt}` : "当前文件名称暂无可推断扩展名"}
                  rules={[{ required: true, whitespace: true, message: "请输入扩展名" }]}
                >
                  <Space.Compact className={styles.extCompact}>
                    <Input
                      placeholder="例如：yaml / json / env / dockerfile"
                      disabled={isReadOnly}
                    />
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={handleInferExtension}
                      disabled={isReadOnly || !inferredExt}
                    >
                      按文件名称推断
                    </Button>
                  </Space.Compact>
                </Form.Item>

                <Form.Item
                  name="content"
                  label="配置内容"
                  rules={[{ required: true, whitespace: true, message: "请输入配置内容" }]}
                >
                  <Input.TextArea
                    rows={20}
                    placeholder="输入完整的配置内容，支持多行文本"
                    className={styles.contentTextarea}
                    spellCheck={false}
                    disabled={isReadOnly}
                  />
                </Form.Item>
              </Form>
            </Card>

            <Card className={styles.previewCard} variant="borderless">
              <div className={styles.previewHeader}>
                <div>
                  <div className={styles.previewTitle}>
                    {isReadOnly ? "配置预览" : "实时预览"}
                  </div>
                  <div className={styles.previewHint}>按文件名称与扩展名自动识别常见配置格式</div>
                </div>
                <Button icon={<CopyOutlined />} onClick={() => void handleCopyPreview()}>
                  复制格式化内容
                </Button>
              </div>
              <ConfigCodeViewer
                content={content}
                ext={ext}
                fileName={fileName}
                variant="full"
              />
            </Card>
          </div>
        </main>
      </div>

      <AppFooter />
    </div>
  );
}
