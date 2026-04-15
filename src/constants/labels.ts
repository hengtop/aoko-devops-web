import type {
  ApprovalActionRecord,
  ApprovalInstanceStatus,
  ApprovalTaskStatus,
  ApprovalTemplateBizType,
  ApprovalTemplateStatus,
  MessageReadStatus,
  MessageStatus,
  MessageTargetType,
} from "@service/api";
import {
  APPROVAL_ACTION_TYPES,
  APPROVAL_INSTANCE_STATUSES,
  APPROVAL_TASK_STATUSES,
  APPROVAL_TEMPLATE_BIZ_TYPES,
  APPROVAL_TEMPLATE_STATUSES,
  MESSAGE_READ_STATUSES,
  MESSAGE_STATUSES,
  MESSAGE_TARGET_TYPES,
} from "./status";

export function getApprovalTemplateBizTypeLabel(value?: ApprovalTemplateBizType) {
  switch (value) {
    case APPROVAL_TEMPLATE_BIZ_TYPES.RELEASE:
      return "发布审批";
    case APPROVAL_TEMPLATE_BIZ_TYPES.DEPLOYMENT:
      return "部署审批";
    case APPROVAL_TEMPLATE_BIZ_TYPES.API_GATE:
      return "接口门禁";
    default:
      return "未设置";
  }
}

export function getApprovalTemplateStatusLabel(value?: ApprovalTemplateStatus) {
  return value === APPROVAL_TEMPLATE_STATUSES.DISABLE ? "禁用" : "启用";
}

export function getApprovalInstanceStatusLabel(value?: ApprovalInstanceStatus) {
  switch (value) {
    case APPROVAL_INSTANCE_STATUSES.PENDING:
      return "待提交";
    case APPROVAL_INSTANCE_STATUSES.IN_PROGRESS:
      return "审批中";
    case APPROVAL_INSTANCE_STATUSES.APPROVED:
      return "已通过";
    case APPROVAL_INSTANCE_STATUSES.REJECTED:
      return "已拒绝";
    case APPROVAL_INSTANCE_STATUSES.CANCELED:
      return "已取消";
    case APPROVAL_INSTANCE_STATUSES.EXPIRED:
      return "已过期";
    default:
      return "未知";
  }
}

export function getApprovalTaskStatusLabel(value?: ApprovalTaskStatus) {
  switch (value) {
    case APPROVAL_TASK_STATUSES.PENDING:
      return "待处理";
    case APPROVAL_TASK_STATUSES.APPROVED:
      return "已通过";
    case APPROVAL_TASK_STATUSES.REJECTED:
      return "已拒绝";
    case APPROVAL_TASK_STATUSES.TRANSFERRED:
      return "已转交";
    case APPROVAL_TASK_STATUSES.CANCELED:
      return "已取消";
    case APPROVAL_TASK_STATUSES.SKIPPED:
      return "已跳过";
    default:
      return "未知";
  }
}

export function getApprovalActionLabel(value?: ApprovalActionRecord["action"]) {
  switch (value) {
    case APPROVAL_ACTION_TYPES.SUBMIT:
      return "提交审批";
    case APPROVAL_ACTION_TYPES.APPROVE:
      return "审批通过";
    case APPROVAL_ACTION_TYPES.REJECT:
      return "审批拒绝";
    case APPROVAL_ACTION_TYPES.CANCEL:
      return "取消审批";
    case APPROVAL_ACTION_TYPES.TRANSFER:
      return "转交审批";
    case APPROVAL_ACTION_TYPES.ADD_APPROVER:
      return "当前节点加签";
    case APPROVAL_ACTION_TYPES.SYSTEM_NOTIFY:
      return "系统通知";
    default:
      return "未知动作";
  }
}

export function getMessageReadStatusLabel(readStatus?: MessageReadStatus) {
  return readStatus === MESSAGE_READ_STATUSES.READ ? "已读" : "未读";
}

export function getMessageStatusLabel(status?: MessageStatus) {
  return status === MESSAGE_STATUSES.SENT ? "已发送" : "草稿";
}

export function getMessageTargetTypeLabel(targetType?: MessageTargetType) {
  switch (targetType) {
    case MESSAGE_TARGET_TYPES.PERSONAL:
      return "个人消息";
    case MESSAGE_TARGET_TYPES.GROUP:
      return "群发消息";
    default:
      return "全员消息";
  }
}
