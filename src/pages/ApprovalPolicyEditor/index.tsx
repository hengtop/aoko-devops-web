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
  APPROVAL_POLICY_MATCH_MODES,
  APPROVAL_TEMPLATE_STATUSES,
  EDITOR_PAGE_MODES,
} from "@constants";
import AppConsolePageShell from "@components/AppConsolePageShell";
import {
  createApprovalPolicy,
  getApprovalPolicyDetail,
  listApprovalTemplates,
  listUsers,
  updateApprovalPolicy,
  type ApprovalPolicyMutationPayload,
} from "@service/api";
import editorStyles from "@pages/ApprovalEditor/styles.module.less";
import {
  approvalPolicyMatchModeOptions,
  approvalPolicyStatusOptions,
  approvalPolicyTargetTypeOptions,
  buildApprovalPolicyPayload,
  defaultApprovalPolicyRuleValue,
  getApprovalPolicyTemplateId,
  getApprovalPolicyUserId,
} from "@pages/ApprovalPolicy/shared";

type PolicyFormValues = ApprovalPolicyMutationPayload;

export default function ApprovalPolicyEditor() {
  const [form] = Form.useForm<PolicyFormValues>();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [templateOptions, setTemplateOptions] = useState<Array<{ label: string; value: string }>>(
    [],
  );
  const [userOptions, setUserOptions] = useState<Array<{ label: string; value: string }>>([]);

  const pageMode = id ? EDITOR_PAGE_MODES.EDIT : EDITOR_PAGE_MODES.CREATE;

  useEffect(() => {
    let cancelled = false;

    async function fetchDependencies() {
      try {
        const [templateResponse, userResponse] = await Promise.all([
          listApprovalTemplates({
            pageNum: 1,
            pageSize: 200,
          }),
          listUsers({
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
              value: getApprovalPolicyTemplateId(item),
            })),
          );
        }

        if (userResponse.success) {
          setUserOptions(
            (userResponse.data?.list ?? []).map((item) => {
              const userId = getApprovalPolicyUserId(item);
              const label = item.name?.trim() || item.email?.trim() || item.phone?.trim() || userId;

              return {
                label: `${label}${userId ? ` (${userId})` : ""}`,
                value: userId,
              };
            }),
          );
        }
      } catch {
        if (!cancelled) {
          setTemplateOptions([]);
          setUserOptions([]);
        }
      }
    }

    void fetchDependencies();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!id) {
      form.resetFields();
      form.setFieldsValue({
        status: "enable",
        matchMode: APPROVAL_POLICY_MATCH_MODES.FIRST_MATCH,
        rules: [{ ...defaultApprovalPolicyRuleValue }],
      });
      return;
    }

    let cancelled = false;
    const policyId = id;

    async function fetchPolicyDetail() {
      setLoading(true);

      try {
        const response = await getApprovalPolicyDetail(policyId);

        if (!response.success || !response.data || cancelled) {
          return;
        }

        form.setFieldsValue({
          name: response.data.name,
          code: response.data.code,
          status: response.data.status ?? APPROVAL_TEMPLATE_STATUSES.ENABLE,
          targetType: response.data.targetType,
          targetCode: response.data.targetCode,
          matchMode: response.data.matchMode ?? APPROVAL_POLICY_MATCH_MODES.FIRST_MATCH,
          rules:
            response.data.rules?.map((rule) => ({
              ...rule,
              conditions: {
                tenantIds: [...(rule.conditions?.tenantIds ?? [])],
                productIds: [...(rule.conditions?.productIds ?? [])],
                applicationIds: [...(rule.conditions?.applicationIds ?? [])],
                environments: [...(rule.conditions?.environments ?? [])],
                operatorIds: [...(rule.conditions?.operatorIds ?? [])],
                httpMethod: rule.conditions?.httpMethod,
                gateCode: rule.conditions?.gateCode,
              },
            })) ?? [{ ...defaultApprovalPolicyRuleValue }],
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (error && typeof error === "object" && "handled" in error && error.handled) {
          return;
        }

        const errorMessage =
          error instanceof Error ? error.message : "审批策略详情加载失败，请稍后重试";
        messageApi.error(errorMessage);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchPolicyDetail();

    return () => {
      cancelled = true;
    };
  }, [form, id, messageApi]);

  async function handleSubmit() {
    try {
      const values = await form.validateFields();
      const payload = buildApprovalPolicyPayload(values);

      setSubmitting(true);

      if (pageMode === EDITOR_PAGE_MODES.EDIT) {
        if (!id) {
          messageApi.error("当前记录缺少 id，无法更新");
          return;
        }

        const response = await updateApprovalPolicy({
          id,
          ...payload,
        });

        if (!response.success) {
          return;
        }

        messageApi.success("审批策略已更新");
      } else {
        const response = await createApprovalPolicy(payload);

        if (!response.success) {
          return;
        }

        messageApi.success("审批策略已创建");
      }

      navigate(APP_ROUTE_PATHS.APPROVAL_POLICY);
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) {
        return;
      }

      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "审批策略保存失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppConsolePageShell
      title={pageMode === EDITOR_PAGE_MODES.EDIT ? "编辑审批策略" : "新建审批策略"}
      subtitle="审批策略的匹配条件较多，独立页面更方便完整配置目标和规则。"
      note="这里专注审批策略的创建与编辑。保存后会返回策略列表，审批模板和审批单的逻辑保持不变。"
      actions={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(APP_ROUTE_PATHS.APPROVAL_POLICY)}>
            返回列表
          </Button>
          <Button type="primary" loading={submitting} onClick={() => void handleSubmit()}>
            {pageMode === EDITOR_PAGE_MODES.EDIT ? "保存修改" : "创建策略"}
          </Button>
        </Space>
      }
    >
      {contextHolder}

      <Card className={editorStyles.formCard} variant="borderless" loading={loading}>
        <Form<PolicyFormValues> form={form} layout="vertical" className={editorStyles.editorForm}>
          <div className={editorStyles.formGrid}>
            <Form.Item
              name="name"
              label="策略名称"
              rules={[{ required: true, whitespace: true, message: "请输入策略名称" }]}
            >
              <Input placeholder="例如：生产部署审批策略" />
            </Form.Item>
            <Form.Item
              name="code"
              label="策略编码"
              rules={[{ required: true, whitespace: true, message: "请输入策略编码" }]}
            >
              <Input placeholder="例如：deploy_prod_policy" />
            </Form.Item>
            <Form.Item
              name="targetType"
              label="目标类型"
              rules={[{ required: true, message: "请选择目标类型" }]}
            >
              <Select options={approvalPolicyTargetTypeOptions} placeholder="请选择目标类型" />
            </Form.Item>
            <Form.Item name="status" label="状态" initialValue={APPROVAL_TEMPLATE_STATUSES.ENABLE}>
              <Select options={approvalPolicyStatusOptions} />
            </Form.Item>
            <Form.Item name="targetCode" label="目标编码">
              <Input placeholder="可选，限定某个具体业务编码" />
            </Form.Item>
            <Form.Item name="matchMode" label="匹配模式" initialValue={APPROVAL_POLICY_MATCH_MODES.FIRST_MATCH}>
              <Select options={approvalPolicyMatchModeOptions} />
            </Form.Item>
          </div>

          <div className={editorStyles.blockTitle}>规则列表</div>

          <Form.List name="rules">
            {(fields, { add, remove }) => (
              <div className={editorStyles.ruleList}>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    className={editorStyles.ruleCard}
                    variant="borderless"
                    title={`规则 ${index + 1}`}
                    extra={
                      fields.length > 1 ? (
                        <Button type="link" danger onClick={() => remove(field.name)}>
                          删除规则
                        </Button>
                      ) : null
                    }
                  >
                    <div className={editorStyles.formGrid}>
                      <Form.Item
                        name={[field.name, "priority"]}
                        label="优先级"
                        initialValue={0}
                      >
                        <InputNumber className={editorStyles.fullWidth} precision={0} />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "templateId"]}
                        label="匹配模板"
                        rules={[{ required: true, message: "请选择匹配模板" }]}
                      >
                        <Select
                          options={templateOptions}
                          placeholder="请选择审批模板"
                          optionFilterProp="label"
                        />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "enabled"]}
                        label="是否启用"
                        valuePropName="checked"
                        initialValue
                      >
                        <Switch />
                      </Form.Item>
                    </div>

                    <div className={editorStyles.subBlockTitle}>匹配条件</div>

                    <div className={editorStyles.formGrid}>
                      <Form.Item name={[field.name, "conditions", "tenantIds"]} label="租户 ID">
                        <Select
                          mode="tags"
                          tokenSeparators={[",", "，", "\n"]}
                          placeholder="输入租户 ID，回车后添加"
                        />
                      </Form.Item>
                      <Form.Item name={[field.name, "conditions", "productIds"]} label="产品 ID">
                        <Select
                          mode="tags"
                          tokenSeparators={[",", "，", "\n"]}
                          placeholder="输入产品 ID，回车后添加"
                        />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "conditions", "applicationIds"]}
                        label="应用 ID"
                      >
                        <Select
                          mode="tags"
                          tokenSeparators={[",", "，", "\n"]}
                          placeholder="输入应用 ID，回车后添加"
                        />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, "conditions", "environments"]}
                        label="环境标识"
                      >
                        <Select
                          mode="tags"
                          tokenSeparators={[",", "，", "\n"]}
                          placeholder="输入环境标识，回车后添加"
                        />
                      </Form.Item>
                      <Form.Item name={[field.name, "conditions", "operatorIds"]} label="操作人">
                        <Select
                          mode="multiple"
                          options={userOptions}
                          placeholder="请选择操作人"
                          optionFilterProp="label"
                        />
                      </Form.Item>
                      <Form.Item name={[field.name, "conditions", "httpMethod"]} label="HTTP 方法">
                        <Input placeholder="例如：POST / PUT" />
                      </Form.Item>
                      <Form.Item name={[field.name, "conditions", "gateCode"]} label="门禁编码">
                        <Input placeholder="例如：deploy_gate_prod" />
                      </Form.Item>
                    </div>
                  </Card>
                ))}

                <Button type="dashed" block onClick={() => add({ ...defaultApprovalPolicyRuleValue })}>
                  新增规则
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      </Card>
    </AppConsolePageShell>
  );
}
