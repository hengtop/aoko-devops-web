import type {
  ApprovalTemplateListParams,
  ApprovalTemplateMutationPayload,
  ApprovalTemplateNode,
  ApprovalTemplateRecord,
  UserProfile,
} from "@service/api";
import {
  APPROVAL_APPROVER_SOURCE_TYPES,
  APPROVAL_NODE_MODES,
  APPROVAL_NOTIFY_CHANNELS,
  approvalApproverSourceOptions,
  approvalNodeModeOptions,
  approvalNotifyChannelOptions,
  approvalTemplateBizTypeOptions,
  approvalTemplateStatusOptions,
  getApprovalTemplateBizTypeLabel,
  getApprovalTemplateStatusLabel,
} from "@constants";

export {
  APPROVAL_APPROVER_SOURCE_TYPES,
  APPROVAL_NODE_MODES,
  APPROVAL_NOTIFY_CHANNELS,
  approvalApproverSourceOptions,
  approvalNodeModeOptions,
  approvalNotifyChannelOptions,
  approvalTemplateBizTypeOptions,
  approvalTemplateStatusOptions,
  getApprovalTemplateBizTypeLabel,
  getApprovalTemplateStatusLabel,
};

export const defaultApprovalTemplateNodeValue: ApprovalTemplateNode = {
  nodeCode: "",
  nodeName: "",
  order: 1,
  approvalMode: APPROVAL_NODE_MODES.OR,
  approverSourceType: APPROVAL_APPROVER_SOURCE_TYPES.USER,
  approverIds: [],
  allowTransfer: true,
  allowAddApprover: true,
  notifyChannels: [APPROVAL_NOTIFY_CHANNELS.SITE],
};

export function getApprovalTemplateId(record: Partial<ApprovalTemplateRecord>) {
  return record.id ?? record._id ?? "";
}

export function getApprovalTemplateUserId(record: Partial<UserProfile>) {
  return record.id ?? record._id ?? "";
}

export function normalizeApprovalTemplateOptionalField(value?: string) {
  const text = value?.trim();
  return text ? text : undefined;
}

export function normalizeApprovalTemplateIdList(values?: string[]) {
  return (values ?? []).map((item) => item.trim()).filter(Boolean);
}

export function buildApprovalTemplateSearchParams(
  values: Pick<ApprovalTemplateListParams, "name" | "code" | "bizType" | "status">,
) {
  return {
    name: normalizeApprovalTemplateOptionalField(values.name),
    code: normalizeApprovalTemplateOptionalField(values.code),
    bizType: values.bizType,
    status: values.status,
  };
}

export function buildApprovalTemplatePayload(
  values: ApprovalTemplateMutationPayload,
): ApprovalTemplateMutationPayload {
  return {
    name: values.name.trim(),
    code: values.code.trim(),
    bizType: values.bizType,
    status: values.status,
    description: normalizeApprovalTemplateOptionalField(values.description),
    nodes: (values.nodes ?? []).map((node, index) => ({
      nodeCode: node.nodeCode.trim(),
      nodeName: node.nodeName.trim(),
      order: Number(node.order ?? index + 1),
      approvalMode: node.approvalMode,
      approverSourceType: node.approverSourceType,
      approverIds: normalizeApprovalTemplateIdList(node.approverIds),
      allowTransfer: node.allowTransfer !== false,
      allowAddApprover: node.allowAddApprover !== false,
      notifyChannels: node.notifyChannels?.length ? node.notifyChannels : [APPROVAL_NOTIFY_CHANNELS.SITE],
    })),
  };
}
