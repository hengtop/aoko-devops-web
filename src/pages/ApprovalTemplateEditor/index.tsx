import { ArrowLeftOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  message,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import {
  APP_ROUTE_PATHS,
  APPROVAL_NOTIFY_CHANNELS,
  APPROVAL_TEMPLATE_STATUSES,
  EDITOR_PAGE_MODES,
} from "@constants";
import AppConsolePageShell from "@components/AppConsolePageShell";
import {
  createApprovalTemplate,
  getApprovalTemplateDetail,
  listUsers,
  updateApprovalTemplate,
  type ApprovalApproverSourceType,
  type ApprovalTemplateMutationPayload,
} from "@service/api";
import editorStyles from "@pages/ApprovalEditor/styles.module.less";
import {
  approvalApproverSourceOptions,
  approvalNodeModeOptions,
  approvalNotifyChannelOptions,
  approvalTemplateBizTypeOptions,
  approvalTemplateStatusOptions,
  buildApprovalTemplatePayload,
  defaultApprovalTemplateNodeValue,
  getApprovalTemplateUserId,
} from "@pages/ApprovalTemplate/shared";

type TemplateFormValues = ApprovalTemplateMutationPayload;

export default function ApprovalTemplateEditor() {
  const [form] = Form.useForm<TemplateFormValues>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userOptions, setUserOptions] = useState<Array<{ label: string; value: string }>>([]);

  const pageMode = id ? EDITOR_PAGE_MODES.EDIT : EDITOR_PAGE_MODES.CREATE;

  useEffect(() => {
    let cancelled = false;

    async function fetchUsers() {
      try {
        const response = await listUsers({
          pageNum: 1,
          pageSize: 200,
        });

        if (!response.success || cancelled) {
          return;
        }

        setUserOptions(
          (response.data?.list ?? []).map((item) => {
            const userId = getApprovalTemplateUserId(item);
            const label = item.name?.trim() || item.email?.trim() || item.phone?.trim() || userId;

            return {
              label: `${label}${userId ? ` (${userId})` : ""}`,
              value: userId,
            };
          }),
        );
      } catch {
        if (!cancelled) {
          setUserOptions([]);
        }
      }
    }

    void fetchUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!id) {
      form.resetFields();
      form.setFieldsValue({
        status: "enable",
        nodes: [{ ...defaultApprovalTemplateNodeValue }],
      });
      return;
    }

    let cancelled = false;
    const templateId = id;

    async function fetchTemplateDetail() {
      setLoading(true);

      try {
        const response = await getApprovalTemplateDetail(templateId);

        if (!response.success || !response.data || cancelled) {
          return;
        }

        form.setFieldsValue({
          name: response.data.name,
          code: response.data.code,
          bizType: response.data.bizType,
          status: response.data.status ?? APPROVAL_TEMPLATE_STATUSES.ENABLE,
          description: response.data.description,
          nodes:
            response.data.nodes?.map((node) => ({
              ...node,
              approverIds: [...(node.approverIds ?? [])],
              notifyChannels: [...(node.notifyChannels ?? [APPROVAL_NOTIFY_CHANNELS.SITE])],
            })) ?? [{ ...defaultApprovalTemplateNodeValue }],
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error && typeof error === "object" && "handled" in error && error.handled) {
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "审批模板详情加载失败，请稍后重试";
        messageApi.error(errorMessage);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchTemplateDetail();

    return () => {
      cancelled = true;
    };
  }, [form, id, messageApi]);

  async function handleSubmit() {
    try {
      const values = await form.validateFields();
      const payload = buildApprovalTemplatePayload(values);

      setSubmitting(true);

      if (pageMode === EDITOR_PAGE_MODES.EDIT) {
        if (!id) {
          messageApi.error("当前记录缺少 id，无法更新");
          return;
        }

        const response = await updateApprovalTemplate({
          id,
          ...payload,
        });

        if (!response.success) {
          return;
        }

        messageApi.success("审批模板已更新");
      } else {
        const response = await createApprovalTemplate(payload);

        if (!response.success) {
          return;
        }

        messageApi.success("审批模板已创建");
      }

      navigate(APP_ROUTE_PATHS.APPROVAL_TEMPLATE);
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) {
        return;
      }

      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "审批模板保存失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppConsolePageShell
      title={pageMode === EDITOR_PAGE_MODES.EDIT ? "编辑审批模板" : "新建审批模板"}
      subtitle="审批模板的节点配置较多，单独页面更适合完整维护审批链路。"
      note="这里专注审批模板的创建与编辑。保存后会返回模板列表，策略和审批单会继续复用这里维护的模板。"
      actions={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(APP_ROUTE_PATHS.APPROVAL_TEMPLATE)}>
            返回列表
          </Button>
          <Button type="primary" loading={submitting} onClick={() => void handleSubmit()}>
            {pageMode === EDITOR_PAGE_MODES.EDIT ? "保存修改" : "创建模板"}
          </Button>
        </Space>
      }
    >
      {contextHolder}

      <Card className={editorStyles.formCard} variant="borderless" loading={loading}>
        <Form<TemplateFormValues> form={form} layout="vertical" className={editorStyles.editorForm}>
          <div className={editorStyles.formGrid}>
            <Form.Item
              name="name"
              label="模板名称"
              rules={[{ required: true, whitespace: true, message: "请输入模板名称" }]}
            >
              <Input placeholder="例如：生产发布审批模板" />
            </Form.Item>
            <Form.Item
              name="code"
              label="模板编码"
              rules={[{ required: true, whitespace: true, message: "请输入模板编码" }]}
            >
              <Input placeholder="例如：release_prod_flow" />
            </Form.Item>
            <Form.Item
              name="bizType"
              label="业务类型"
              rules={[{ required: true, message: "请选择业务类型" }]}
            >
              <Select options={approvalTemplateBizTypeOptions} placeholder="请选择业务类型" />
            </Form.Item>
            <Form.Item name="status" label="状态" initialValue={APPROVAL_TEMPLATE_STATUSES.ENABLE}>
              <Select options={approvalTemplateStatusOptions} />
            </Form.Item>
          </div>

          <Form.Item name="description" label="模板说明">
            <Input.TextArea rows={3} placeholder="补充说明模板适用场景" />
          </Form.Item>

          <div className={editorStyles.blockTitle}>审批节点</div>

          <Form.List name="nodes">
            {(fields, { add, remove }) => (
              <div className={editorStyles.nodeList}>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    className={editorStyles.nodeCard}
                    variant="borderless"
                    title={`节点 ${index + 1}`}
                    extra={
                      fields.length > 1 ? (
                        <Button type="link" danger onClick={() => remove(field.name)}>
                          删除节点
                        </Button>
                      ) : null
                    }
                  >
                    <div className={editorStyles.formGrid}>
                      <Form.Item
                        name={[field.name, "nodeCode"]}
                        label="节点编码"
                        rules={[{ required: true, whitespace: true, message: "请输入节点编码" }]}
                      >
                        <Input placeholder="例如：leader_approve" />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "nodeName"]}
                        label="节点名称"
                        rules={[{ required: true, whitespace: true, message: "请输入节点名称" }]}
                      >
                        <Input placeholder="例如：负责人审批" />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "order"]}
                        label="排序"
                        rules={[{ required: true, message: "请输入排序" }]}
                      >
                        <InputNumber className={editorStyles.fullWidth} min={1} precision={0} />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "approvalMode"]}
                        label="通过方式"
                        rules={[{ required: true, message: "请选择通过方式" }]}
                      >
                        <Select options={approvalNodeModeOptions} />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "approverSourceType"]}
                        label="审批人来源"
                        rules={[{ required: true, message: "请选择审批人来源" }]}
                      >
                        <Select options={approvalApproverSourceOptions} />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "notifyChannels"]}
                        label="通知方式"
                        initialValue={["site"]}
                      >
                        <Select mode="multiple" options={approvalNotifyChannelOptions} />
                      </Form.Item>
                    </div>

                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, nextValues) => {
                        const prevType = prevValues.nodes?.[field.name]?.approverSourceType;
                        const nextType = nextValues.nodes?.[field.name]?.approverSourceType;
                        return prevType !== nextType;
                      }}
                    >
                      {() => {
                        const approverSourceType = form.getFieldValue([
                          "nodes",
                          field.name,
                          "approverSourceType",
                        ]) as ApprovalApproverSourceType | undefined;

                        return (
                          <Form.Item
                            name={[field.name, "approverIds"]}
                            label={approverSourceType === "ROLE" ? "角色 ID" : "审批人"}
                            rules={[
                              {
                                required: true,
                                type: "array",
                                min: 1,
                                message: approverSourceType === "ROLE"
                                  ? "请至少填写一个角色 ID"
                                  : "请至少选择一位审批人",
                              },
                            ]}
                          >
                            {approverSourceType === "ROLE" ? (
                              <Select
                                mode="tags"
                                tokenSeparators={[",", "，", "\n"]}
                                placeholder="输入角色 ID，回车后添加"
                              />
                            ) : (
                              <Select
                                mode="multiple"
                                options={userOptions}
                                placeholder="请选择审批人"
                                optionFilterProp="label"
                              />
                            )}
                          </Form.Item>
                        );
                      }}
                    </Form.Item>

                    <div className={editorStyles.switchRow}>
                      <Form.Item
                        name={[field.name, "allowTransfer"]}
                        label="允许转交"
                        valuePropName="checked"
                        initialValue
                      >
                        <Switch />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "allowAddApprover"]}
                        label="允许加签"
                        valuePropName="checked"
                        initialValue
                      >
                        <Switch />
                      </Form.Item>
                    </div>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  block
                  onClick={() =>
                    add({
                      ...defaultApprovalTemplateNodeValue,
                      order: fields.length + 1,
                    })
                  }
                >
                  新增审批节点
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      </Card>
    </AppConsolePageShell>
  );
}
