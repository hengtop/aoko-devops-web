import type {
  ApprovalApproverSourceType,
  ApprovalNodeMode,
  ApprovalNotifyChannel,
  ApprovalTemplateBizType,
  ApprovalTemplateListParams,
  ApprovalTemplateMutationPayload,
  ApprovalTemplateNode,
  ApprovalTemplateRecord,
  ApprovalTemplateStatus,
  UserProfile,
} from "../../service/api";

export const approvalTemplateBizTypeOptions: Array<{
  label: string;
  value: ApprovalTemplateBizType;
}> = [
  { label: "发布审批", value: "release" },
  { label: "部署审批", value: "deployment" },
  { label: "接口门禁", value: "api_gate" },
];

export const approvalTemplateStatusOptions: Array<{
  label: string;
  value: ApprovalTemplateStatus;
}> = [
  { label: "启用", value: "enable" },
  { label: "禁用", value: "disable" },
];

export const approvalNodeModeOptions: Array<{ label: string; value: ApprovalNodeMode }> = [
  { label: "任一通过", value: "OR" },
  { label: "全部通过", value: "AND" },
];

export const approvalApproverSourceOptions: Array<{
  label: string;
  value: ApprovalApproverSourceType;
}> = [
  { label: "指定用户", value: "USER" },
  { label: "角色成员", value: "ROLE" },
];

export const approvalNotifyChannelOptions: Array<{
  label: string;
  value: ApprovalNotifyChannel;
}> = [
  { label: "站内消息", value: "site" },
  { label: "邮件通知", value: "email" },
];

export const defaultApprovalTemplateNodeValue: ApprovalTemplateNode = {
  nodeCode: "",
  nodeName: "",
  order: 1,
  approvalMode: "OR",
  approverSourceType: "USER",
  approverIds: [],
  allowTransfer: true,
  allowAddApprover: true,
  notifyChannels: ["site"],
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

export function getApprovalTemplateBizTypeLabel(value?: ApprovalTemplateBizType) {
  return approvalTemplateBizTypeOptions.find((item) => item.value === value)?.label ?? "未设置";
}

export function getApprovalTemplateStatusLabel(value?: ApprovalTemplateStatus) {
  return approvalTemplateStatusOptions.find((item) => item.value === value)?.label ?? "启用";
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
      notifyChannels: node.notifyChannels?.length ? node.notifyChannels : ["site"],
    })),
  };
}
