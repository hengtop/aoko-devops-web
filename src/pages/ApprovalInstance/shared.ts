import type {
  ApprovalInstanceRecord,
  ApprovalListParams,
  ApprovalPolicyRecord,
  ApprovalTemplateRecord,
  CreateApprovalPayload,
} from "@service/api";
import {
  approvalInstanceStatusOptions,
  approvalSourceTypeOptions,
  approvalTemplateBizTypeOptions,
  getApprovalInstanceStatusLabel,
  getApprovalTemplateBizTypeLabel,
} from "@constants";

export {
  approvalInstanceStatusOptions,
  approvalSourceTypeOptions,
  getApprovalInstanceStatusLabel,
};

export const approvalInstanceBizTypeOptions = approvalTemplateBizTypeOptions;
export const getApprovalInstanceBizTypeLabel = getApprovalTemplateBizTypeLabel;

export type ApprovalCreateFormValues = CreateApprovalPayload & {
  resolveMode: "template" | "policy";
  requestSnapshotText?: string;
  metadataText?: string;
};

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
