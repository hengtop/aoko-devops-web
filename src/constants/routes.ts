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

  // ===== Product =====
  PRODUCT: "/product",
  PRODUCT_CREATE: "/product/create",
  PRODUCT_EDIT: "/product/:id/edit",
  PRODUCT_DETAIL: "/product/:id",

  // ===== Application =====
  APP_CREATE: "/app/create",
  APP_DETAIL: "/app/:id",
  APP_DETAIL_TAB: "/app/:id/:tab",

  // ===== Release =====
  RELEASE_CREATE: "/app/:appId/releases/create",
  RELEASE_DETAIL: "/app/:appId/releases/:releaseId",

  // ===== Pipeline =====
  PIPELINE_CREATE: "/app/:appId/pipelines/create",
  PIPELINE_DETAIL: "/app/:appId/pipelines/:pipelineId",

  // ===== Pipeline Run =====
  PIPELINE_RUN_DETAIL: "/pipeline-run/:runId",
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

export function buildProductDetailPath(productId: string) {
  return `/product/${productId}`;
}

export function buildProductEditPath(productId: string) {
  return `/product/${productId}/edit`;
}

export function buildAppDetailPath(appId: string, tab?: string) {
  return tab ? `/app/${appId}/${tab}` : `/app/${appId}`;
}

export function buildReleaseCreatePath(appId: string) {
  return `/app/${appId}/releases/create`;
}

export function buildReleaseDetailPath(appId: string, releaseId: string) {
  return `/app/${appId}/releases/${releaseId}`;
}

export function buildPipelineCreatePath(appId: string) {
  return `/app/${appId}/pipelines/create`;
}

export function buildPipelineDetailPath(appId: string, pipelineId: string) {
  return `/app/${appId}/pipelines/${pipelineId}`;
}

export function buildPipelineRunDetailPath(runId: string) {
  return `/pipeline-run/${runId}`;
}
