import { ArrowLeftOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { Button, Card, Form, Input, Select, Space, message } from "antd";
import { useNavigate } from "react-router-dom";
import { APP_ROUTE_PATHS, APPROVAL_SOURCE_TYPES } from "@constants";
import AppConsolePageShell from "@components/AppConsolePageShell";
import {
  createApproval,
  listApprovalPolicies,
  listApprovalTemplates,
} from "@service/api";
import editorStyles from "@pages/ApprovalEditor/styles.module.less";
import {
  approvalInstanceBizTypeOptions,
  approvalSourceTypeOptions,
  buildApprovalInstancePayload,
  getApprovalInstancePolicyId,
  getApprovalInstanceTemplateId,
} from "@pages/ApprovalInstance/shared";
import type { ApprovalCreateFormValues } from "@pages/ApprovalInstance/shared";

export default function ApprovalInstanceEditor() {
  const [form] = Form.useForm<ApprovalCreateFormValues>();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [templateOptions, setTemplateOptions] = useState<Array<{ label: string; value: string }>>(
    [],
  );
  const [policyOptions, setPolicyOptions] = useState<Array<{ label: string; value: string }>>([]);

  useEffect(() => {
    form.setFieldsValue({
      resolveMode: "template",
      sourceType: APPROVAL_SOURCE_TYPES.MANUAL,
    });
  }, [form]);

  useEffect(() => {
    let cancelled = false;

    async function fetchDependencies() {
      setLoading(true);

      try {
        const [templateResponse, policyResponse] = await Promise.all([
          listApprovalTemplates({
            pageNum: 1,
            pageSize: 200,
          }),
          listApprovalPolicies({
            pageNum: 1,
            pageSize: 200,
          }),
        ]);

        if (cancelled) {
          return;
        }

        if (templateResponse.success) {
          setTemplateOptions(
            (templateResponse.data?.list ?? []).map((item) => ({
              label: `${item.name} (${item.code})`,
              value: getApprovalInstanceTemplateId(item),
            })),
          );
        }

        if (policyResponse.success) {
          setPolicyOptions(
            (policyResponse.data?.list ?? []).map((item) => ({
              label: `${item.name} (${item.code})`,
              value: getApprovalInstancePolicyId(item),
            })),
          );
        }
      } catch {
        if (!cancelled) {
          setTemplateOptions([]);
          setPolicyOptions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchDependencies();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit() {
    try {
      const values = await form.validateFields();
      const payload = buildApprovalInstancePayload(values);

      if (values.resolveMode === "template" && !payload.templateId) {
        messageApi.error("请选择审批模板");
        return;
      }

      if (values.resolveMode === "policy" && !payload.policyId) {
        messageApi.error("请选择审批策略");
        return;
      }

      setSubmitting(true);

      const response = await createApproval(payload);

      if (!response.success) {
        return;
      }

      messageApi.success("审批单已发起");
      navigate(APP_ROUTE_PATHS.APPROVAL_INSTANCE);
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) {
        return;
      }

      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "审批单发起失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppConsolePageShell
      title="发起审批单"
      subtitle="审批单发起表单字段较多，改为独立页面后可以更完整地填写上下文信息。"
      note="当前服务端只提供审批单创建接口，没有提供编辑接口，所以这里保留为独立的发起页面。"
      actions={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(APP_ROUTE_PATHS.APPROVAL_INSTANCE)}>
            返回列表
          </Button>
          <Button type="primary" loading={submitting} onClick={() => void handleSubmit()}>
            提交审批
          </Button>
        </Space>
      }
    >
      {contextHolder}

      <Card className={editorStyles.formCard} variant="borderless" loading={loading}>
        <Form<ApprovalCreateFormValues> form={form} layout="vertical" className={editorStyles.editorForm}>
          <div className={editorStyles.formGrid}>
            <Form.Item
              name="title"
              label="审批标题"
              rules={[{ required: true, whitespace: true, message: "请输入审批标题" }]}
            >
              <Input placeholder="例如：生产环境部署审批" />
            </Form.Item>
            <Form.Item
              name="bizType"
              label="业务类型"
              rules={[{ required: true, message: "请选择业务类型" }]}
            >
              <Select options={approvalInstanceBizTypeOptions} placeholder="请选择业务类型" />
            </Form.Item>
            <Form.Item name="bizId" label="业务 ID">
              <Input placeholder="可选，关联具体业务主键" />
            </Form.Item>
            <Form.Item name="bizNo" label="业务编号">
              <Input placeholder="可选，便于查询与展示" />
            </Form.Item>
            <Form.Item name="sourceType" label="发起来源" initialValue={APPROVAL_SOURCE_TYPES.MANUAL}>
              <Select options={approvalSourceTypeOptions} />
            </Form.Item>
            <Form.Item name="resolveMode" label="模板来源" initialValue="template">
              <Select
                options={[
                  { label: "直接选择模板", value: "template" },
                  { label: "通过策略匹配", value: "policy" },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, nextValues) => prevValues.resolveMode !== nextValues.resolveMode}
          >
            {() => {
              const resolveMode = form.getFieldValue("resolveMode") as "template" | "policy" | undefined;

              if (resolveMode === "policy") {
                return (
                  <Form.Item name="policyId" label="审批策略" rules={[{ required: true, message: "请选择审批策略" }]}>
                    <Select
                      options={policyOptions}
                      placeholder="请选择审批策略"
                      optionFilterProp="label"
                    />
                  </Form.Item>
                );
              }

              return (
                <Form.Item name="templateId" label="审批模板" rules={[{ required: true, message: "请选择审批模板" }]}>
                  <Select
                    options={templateOptions}
                    placeholder="请选择审批模板"
                    optionFilterProp="label"
                  />
                </Form.Item>
              );
            }}
          </Form.Item>

          <div className={editorStyles.formGrid}>
            <Form.Item name="policyTargetCode" label="策略目标编码">
              <Input placeholder="策略模式下可选，限定目标编码" />
            </Form.Item>
            <Form.Item name="environment" label="环境标识">
              <Input placeholder="例如：prod / staging" />
            </Form.Item>
            <Form.Item name="tenantId" label="租户 ID">
              <Input placeholder="可选" />
            </Form.Item>
            <Form.Item name="productId" label="产品 ID">
              <Input placeholder="可选" />
            </Form.Item>
            <Form.Item name="applicationId" label="应用 ID">
              <Input placeholder="可选" />
            </Form.Item>
            <Form.Item name="gateCode" label="门禁编码">
              <Input placeholder="接口门禁场景可选" />
            </Form.Item>
            <Form.Item name="httpMethod" label="HTTP 方法">
              <Input placeholder="例如：POST" />
            </Form.Item>
          </div>

          <Form.Item name="reason" label="发起原因">
            <Input.TextArea rows={3} placeholder="补充说明审批背景和原因" />
          </Form.Item>

          <Form.Item name="requestSnapshotText" label="请求快照 JSON">
            <Input.TextArea
              rows={5}
              placeholder='可选，例如：{"version":"1.0.0","operator":"zhangsan"}'
            />
          </Form.Item>

          <Form.Item name="metadataText" label="附加元数据 JSON">
            <Input.TextArea rows={5} placeholder='可选，例如：{"channel":"web"}' />
          </Form.Item>
        </Form>
      </Card>
    </AppConsolePageShell>
  );
}
