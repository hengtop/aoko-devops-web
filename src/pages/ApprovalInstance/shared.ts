import type {
  ApprovalInstanceRecord,
  ApprovalInstanceStatus,
  ApprovalListParams,
  ApprovalPolicyRecord,
  ApprovalSourceType,
  ApprovalTemplateBizType,
  ApprovalTemplateRecord,
  CreateApprovalPayload,
} from "../../service/api";

export type ApprovalCreateFormValues = CreateApprovalPayload & {
  resolveMode: "template" | "policy";
  requestSnapshotText?: string;
  metadataText?: string;
};

export const approvalInstanceBizTypeOptions: Array<{
  label: string;
  value: ApprovalTemplateBizType;
}> = [
  { label: "发布审批", value: "release" },
  { label: "部署审批", value: "deployment" },
  { label: "接口门禁", value: "api_gate" },
];

export const approvalInstanceStatusOptions: Array<{
  label: string;
  value: ApprovalInstanceStatus;
}> = [
  { label: "审批中", value: "in_progress" },
  { label: "已通过", value: "approved" },
  { label: "已拒绝", value: "rejected" },
  { label: "已取消", value: "canceled" },
  { label: "已过期", value: "expired" },
];

export const approvalSourceTypeOptions: Array<{ label: string; value: ApprovalSourceType }> = [
  { label: "手动发起", value: "manual" },
  { label: "系统发起", value: "system" },
  { label: "接口门禁", value: "api_gate" },
];

export function getApprovalInstanceId(record: Partial<ApprovalInstanceRecord>) {
  return record.id ?? record._id ?? "";
}

export function getApprovalInstanceTemplateId(record: Partial<ApprovalTemplateRecord>) {
  return record.id ?? record._id ?? "";
}

export function getApprovalInstancePolicyId(record: Partial<ApprovalPolicyRecord>) {
  return record.id ?? record._id ?? "";
}

export function normalizeApprovalInstanceOptionalField(value?: string) {
  const text = value?.trim();
  return text ? text : undefined;
}

export function buildApprovalInstanceSearchParams(
  values: Pick<ApprovalListParams, "title" | "bizType" | "status" | "bizNo">,
) {
  return {
    title: normalizeApprovalInstanceOptionalField(values.title),
    bizType: values.bizType,
    status: values.status,
    bizNo: normalizeApprovalInstanceOptionalField(values.bizNo),
  };
}

export function parseApprovalInstanceJsonObject(text: string | undefined, label: string) {
  const trimmedText = text?.trim();
  if (!trimmedText) {
    return undefined;
  }

  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(trimmedText);
  } catch {
    throw new Error(`${label} 不是合法的 JSON`);
  }

  if (!parsedValue || Array.isArray(parsedValue) || typeof parsedValue !== "object") {
    throw new Error(`${label} 需要是 JSON 对象`);
  }

  return parsedValue as Record<string, unknown>;
}

export function buildApprovalInstancePayload(values: ApprovalCreateFormValues): CreateApprovalPayload {
  return {
    title: values.title.trim(),
    bizType: values.bizType,
    bizId: normalizeApprovalInstanceOptionalField(values.bizId),
    bizNo: normalizeApprovalInstanceOptionalField(values.bizNo),
    sourceType: values.sourceType,
    templateId: values.resolveMode === "template" ? values.templateId : undefined,
    policyId: values.resolveMode === "policy" ? values.policyId : undefined,
    policyTargetCode: normalizeApprovalInstanceOptionalField(values.policyTargetCode),
    tenantId: normalizeApprovalInstanceOptionalField(values.tenantId),
    productId: normalizeApprovalInstanceOptionalField(values.productId),
    applicationId: normalizeApprovalInstanceOptionalField(values.applicationId),
    environment: normalizeApprovalInstanceOptionalField(values.environment),
    httpMethod: normalizeApprovalInstanceOptionalField(values.httpMethod),
    gateCode: normalizeApprovalInstanceOptionalField(values.gateCode),
    reason: normalizeApprovalInstanceOptionalField(values.reason),
    requestSnapshot: parseApprovalInstanceJsonObject(values.requestSnapshotText, "请求快照"),
    metadata: parseApprovalInstanceJsonObject(values.metadataText, "附加元数据"),
  };
}

export function getApprovalInstanceBizTypeLabel(value?: ApprovalTemplateBizType) {
  return approvalInstanceBizTypeOptions.find((item) => item.value === value)?.label ?? "未设置";
}

export function getApprovalInstanceStatusLabel(value?: ApprovalInstanceStatus) {
  switch (value) {
    case "pending":
      return "待提交";
    case "in_progress":
      return "审批中";
    case "approved":
      return "已通过";
    case "rejected":
      return "已拒绝";
    case "canceled":
      return "已取消";
    case "expired":
      return "已过期";
    default:
      return "未知";
  }
}
