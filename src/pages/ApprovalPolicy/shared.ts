import type {
  ApprovalPolicyCondition,
  ApprovalPolicyListParams,
  ApprovalPolicyMatchMode,
  ApprovalPolicyMutationPayload,
  ApprovalPolicyRecord,
  ApprovalPolicyRule,
  ApprovalPolicyStatus,
  ApprovalPolicyTargetType,
  ApprovalTemplateRecord,
  UserProfile,
} from "../../service/api";

export const approvalPolicyTargetTypeOptions: Array<{
  label: string;
  value: ApprovalPolicyTargetType;
}> = [
  { label: "发布审批", value: "release" },
  { label: "部署审批", value: "deployment" },
  { label: "接口门禁", value: "api_gate" },
];

export const approvalPolicyStatusOptions: Array<{ label: string; value: ApprovalPolicyStatus }> = [
  { label: "启用", value: "enable" },
  { label: "禁用", value: "disable" },
];

export const approvalPolicyMatchModeOptions: Array<{
  label: string;
  value: ApprovalPolicyMatchMode;
}> = [{ label: "首条命中规则", value: "first_match" }];

export const defaultApprovalPolicyRuleValue: ApprovalPolicyRule = {
  priority: 0,
  enabled: true,
  templateId: "",
  conditions: {},
};

export function getApprovalPolicyId(record: Partial<ApprovalPolicyRecord>) {
  return record.id ?? record._id ?? "";
}

export function getApprovalPolicyTemplateId(record: Partial<ApprovalTemplateRecord>) {
  return record.id ?? record._id ?? "";
}

export function getApprovalPolicyUserId(record: Partial<UserProfile>) {
  return record.id ?? record._id ?? "";
}

export function normalizeApprovalPolicyOptionalField(value?: string) {
  const text = value?.trim();
  return text ? text : undefined;
}

export function normalizeApprovalPolicyIdList(values?: string[]) {
  return (values ?? []).map((item) => item.trim()).filter(Boolean);
}

export function normalizeApprovalPolicyRuleConditions(conditions?: ApprovalPolicyCondition) {
  return {
    tenantIds: normalizeApprovalPolicyIdList(conditions?.tenantIds),
    productIds: normalizeApprovalPolicyIdList(conditions?.productIds),
    applicationIds: normalizeApprovalPolicyIdList(conditions?.applicationIds),
    environments: normalizeApprovalPolicyIdList(conditions?.environments),
    operatorIds: normalizeApprovalPolicyIdList(conditions?.operatorIds),
    httpMethod: normalizeApprovalPolicyOptionalField(conditions?.httpMethod),
    gateCode: normalizeApprovalPolicyOptionalField(conditions?.gateCode),
  };
}

export function buildApprovalPolicySearchParams(
  values: Pick<ApprovalPolicyListParams, "name" | "code" | "targetType" | "status">,
) {
  return {
    name: normalizeApprovalPolicyOptionalField(values.name),
    code: normalizeApprovalPolicyOptionalField(values.code),
    targetType: values.targetType,
    status: values.status,
  };
}

export function buildApprovalPolicyPayload(
  values: ApprovalPolicyMutationPayload,
): ApprovalPolicyMutationPayload {
  return {
    name: values.name.trim(),
    code: values.code.trim(),
    status: values.status,
    targetType: values.targetType,
    targetCode: normalizeApprovalPolicyOptionalField(values.targetCode),
    matchMode: values.matchMode ?? "first_match",
    rules: (values.rules ?? []).map((rule) => ({
      priority: Number(rule.priority ?? 0),
      enabled: rule.enabled !== false,
      templateId: rule.templateId,
      conditions: normalizeApprovalPolicyRuleConditions(rule.conditions),
    })),
  };
}

export function getApprovalPolicyTargetTypeLabel(value?: ApprovalPolicyTargetType) {
  return approvalPolicyTargetTypeOptions.find((item) => item.value === value)?.label ?? "未设置";
}

export function getApprovalPolicyStatusLabel(value?: ApprovalPolicyStatus) {
  return approvalPolicyStatusOptions.find((item) => item.value === value)?.label ?? "启用";
}
