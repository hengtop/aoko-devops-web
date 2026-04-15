import type {
  ApprovalApproverSourceType,
  ApprovalInstanceStatus,
  ApprovalNodeMode,
  ApprovalNotifyChannel,
  ApprovalPolicyMatchMode,
  ApprovalPolicyStatus,
  ApprovalPolicyTargetType,
  ApprovalSourceType,
  ApprovalTaskStatus,
  ApprovalTemplateBizType,
  ApprovalTemplateStatus,
  MessageReadStatus,
  MessageStatus,
  MessageTargetType,
  ServerAuthType,
  ServerStatus,
} from "@service/api";
import {
  APPROVAL_APPROVER_SOURCE_TYPES,
  APPROVAL_INSTANCE_STATUSES,
  APPROVAL_NODE_MODES,
  APPROVAL_NOTIFY_CHANNELS,
  APPROVAL_POLICY_MATCH_MODES,
  APPROVAL_SOURCE_TYPES,
  APPROVAL_TASK_STATUSES,
  APPROVAL_TEMPLATE_BIZ_TYPES,
  APPROVAL_TEMPLATE_STATUSES,
  MESSAGE_READ_STATUSES,
  MESSAGE_STATUSES,
  MESSAGE_TARGET_TYPES,
  SERVER_AUTH_TYPES,
  SERVER_STATUSES,
} from "./status";

export const approvalTemplateBizTypeOptions: Array<{
  label: string;
  value: ApprovalTemplateBizType;
}> = [
  { label: "发布审批", value: APPROVAL_TEMPLATE_BIZ_TYPES.RELEASE },
  { label: "部署审批", value: APPROVAL_TEMPLATE_BIZ_TYPES.DEPLOYMENT },
  { label: "接口门禁", value: APPROVAL_TEMPLATE_BIZ_TYPES.API_GATE },
];

export const approvalTemplateStatusOptions: Array<{
  label: string;
  value: ApprovalTemplateStatus;
}> = [
  { label: "启用", value: APPROVAL_TEMPLATE_STATUSES.ENABLE },
  { label: "禁用", value: APPROVAL_TEMPLATE_STATUSES.DISABLE },
];

export const approvalNodeModeOptions: Array<{ label: string; value: ApprovalNodeMode }> = [
  { label: "任一通过", value: APPROVAL_NODE_MODES.OR },
  { label: "全部通过", value: APPROVAL_NODE_MODES.AND },
];

export const approvalApproverSourceOptions: Array<{
  label: string;
  value: ApprovalApproverSourceType;
}> = [
  { label: "指定用户", value: APPROVAL_APPROVER_SOURCE_TYPES.USER },
  { label: "角色成员", value: APPROVAL_APPROVER_SOURCE_TYPES.ROLE },
];

export const approvalNotifyChannelOptions: Array<{
  label: string;
  value: ApprovalNotifyChannel;
}> = [
  { label: "站内消息", value: APPROVAL_NOTIFY_CHANNELS.SITE },
  { label: "邮件通知", value: APPROVAL_NOTIFY_CHANNELS.EMAIL },
];

export const approvalInstanceStatusOptions: Array<{
  label: string;
  value: ApprovalInstanceStatus;
}> = [
  { label: "审批中", value: APPROVAL_INSTANCE_STATUSES.IN_PROGRESS },
  { label: "已通过", value: APPROVAL_INSTANCE_STATUSES.APPROVED },
  { label: "已拒绝", value: APPROVAL_INSTANCE_STATUSES.REJECTED },
  { label: "已取消", value: APPROVAL_INSTANCE_STATUSES.CANCELED },
  { label: "已过期", value: APPROVAL_INSTANCE_STATUSES.EXPIRED },
];

export const approvalSourceTypeOptions: Array<{ label: string; value: ApprovalSourceType }> = [
  { label: "手动发起", value: APPROVAL_SOURCE_TYPES.MANUAL },
  { label: "系统发起", value: APPROVAL_SOURCE_TYPES.SYSTEM },
  { label: "接口门禁", value: APPROVAL_SOURCE_TYPES.API_GATE },
];

export const approvalTaskStatusOptions: Array<{ label: string; value: ApprovalTaskStatus }> = [
  { label: "待处理", value: APPROVAL_TASK_STATUSES.PENDING },
  { label: "已通过", value: APPROVAL_TASK_STATUSES.APPROVED },
  { label: "已拒绝", value: APPROVAL_TASK_STATUSES.REJECTED },
  { label: "已转交", value: APPROVAL_TASK_STATUSES.TRANSFERRED },
  { label: "已取消", value: APPROVAL_TASK_STATUSES.CANCELED },
  { label: "已跳过", value: APPROVAL_TASK_STATUSES.SKIPPED },
];

export const approvalPolicyTargetTypeOptions: Array<{
  label: string;
  value: ApprovalPolicyTargetType;
}> = [
  { label: "发布审批", value: APPROVAL_TEMPLATE_BIZ_TYPES.RELEASE },
  { label: "部署审批", value: APPROVAL_TEMPLATE_BIZ_TYPES.DEPLOYMENT },
  { label: "接口门禁", value: APPROVAL_TEMPLATE_BIZ_TYPES.API_GATE },
];

export const approvalPolicyStatusOptions: Array<{ label: string; value: ApprovalPolicyStatus }> = [
  { label: "启用", value: APPROVAL_TEMPLATE_STATUSES.ENABLE },
  { label: "禁用", value: APPROVAL_TEMPLATE_STATUSES.DISABLE },
];

export const approvalPolicyMatchModeOptions: Array<{
  label: string;
  value: ApprovalPolicyMatchMode;
}> = [{ label: "首条命中规则", value: APPROVAL_POLICY_MATCH_MODES.FIRST_MATCH }];

export const messageStatusOptions: Array<{ label: string; value: MessageStatus }> = [
  { label: "草稿", value: MESSAGE_STATUSES.DRAFT },
  { label: "已发送", value: MESSAGE_STATUSES.SENT },
];

export const messageTargetTypeOptions: Array<{ label: string; value: MessageTargetType }> = [
  { label: "个人消息", value: MESSAGE_TARGET_TYPES.PERSONAL },
  { label: "群发消息", value: MESSAGE_TARGET_TYPES.GROUP },
  { label: "全员消息", value: MESSAGE_TARGET_TYPES.ALL },
];

export const messageReadStatusOptions: Array<{ label: string; value: MessageReadStatus }> = [
  { label: "未读", value: MESSAGE_READ_STATUSES.UNREAD },
  { label: "已读", value: MESSAGE_READ_STATUSES.READ },
];

export const serverStatusOptions: Array<{ label: string; value: ServerStatus }> = [
  { label: "启用", value: SERVER_STATUSES.ENABLE },
  { label: "禁用", value: SERVER_STATUSES.DISABLE },
];

export const serverAuthTypeOptions: Array<{ label: string; value: ServerAuthType }> = [
  { label: "账号密码", value: SERVER_AUTH_TYPES.PASSWORD },
  { label: "密钥认证", value: SERVER_AUTH_TYPES.KEY },
];
