export const APP_ROUTE_PATHS = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  APPROVAL: "/approval",
  APPROVAL_TEMPLATE: "/approval/template",
  APPROVAL_TEMPLATE_CREATE: "/approval/template/create",
  APPROVAL_TEMPLATE_EDIT: "/approval/template/:id/edit",
  APPROVAL_POLICY: "/approval/policy",
  APPROVAL_POLICY_CREATE: "/approval/policy/create",
  APPROVAL_POLICY_EDIT: "/approval/policy/:id/edit",
  APPROVAL_INSTANCE: "/approval/instance",
  APPROVAL_INSTANCE_CREATE: "/approval/instance/create",
  APPROVAL_TASK: "/approval/task",
  TEMPLATE: "/template",
  CONFIGURATION: "/configuration",
  CONFIGURATION_CREATE: "/configuration/create",
  CONFIGURATION_DETAIL: "/configuration/:id",
  CONFIGURATION_EDIT: "/configuration/:id/edit",
  SERVER: "/server",
  MESSAGE: "/message",
  MESSAGE_DETAIL: "/message/:id",
  MESSAGE_MANAGE: "/message/manage",
  MESSAGE_MANAGE_CREATE: "/message/manage/create",
  MESSAGE_MANAGE_DETAIL: "/message/manage/:id",
  MESSAGE_MANAGE_EDIT: "/message/manage/:id/edit",
  LOGIN: "/login",
  REGISTER: "/register",
  FORBIDDEN: "/403",
} as const;

export const LOGIN_REDIRECT_QUERY_KEY = "redirect";

export function buildMessageDetailPath(messageId: string) {
  return `/message/${messageId}`;
}

export function buildMessageManageDetailPath(messageId: string) {
  return `/message/manage/${messageId}`;
}

export function buildMessageManageEditPath(messageId: string) {
  return `/message/manage/${messageId}/edit`;
}

export function buildConfigurationDetailPath(configurationId: string) {
  return `/configuration/${configurationId}`;
}

export function buildConfigurationEditPath(configurationId: string) {
  return `/configuration/${configurationId}/edit`;
}

export function buildApprovalTemplateEditPath(templateId: string) {
  return `/approval/template/${templateId}/edit`;
}

export function buildApprovalPolicyEditPath(policyId: string) {
  return `/approval/policy/${policyId}/edit`;
}
