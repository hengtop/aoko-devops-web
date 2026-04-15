export const APPROVAL_TEMPLATE_BIZ_TYPES = {
  RELEASE: "release",
  DEPLOYMENT: "deployment",
  API_GATE: "api_gate",
} as const;

export const APPROVAL_TEMPLATE_STATUSES = {
  ENABLE: "enable",
  DISABLE: "disable",
} as const;

export const APPROVAL_NODE_MODES = {
  OR: "OR",
  AND: "AND",
} as const;

export const APPROVAL_APPROVER_SOURCE_TYPES = {
  USER: "USER",
  ROLE: "ROLE",
} as const;

export const APPROVAL_NOTIFY_CHANNELS = {
  SITE: "site",
  EMAIL: "email",
} as const;

export const APPROVAL_POLICY_MATCH_MODES = {
  FIRST_MATCH: "first_match",
} as const;

export const APPROVAL_SOURCE_TYPES = {
  MANUAL: "manual",
  SYSTEM: "system",
  API_GATE: "api_gate",
} as const;

export const APPROVAL_INSTANCE_STATUSES = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELED: "canceled",
  EXPIRED: "expired",
} as const;

export const APPROVAL_TASK_STATUSES = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  TRANSFERRED: "transferred",
  CANCELED: "canceled",
  SKIPPED: "skipped",
} as const;

export const APPROVAL_ACTION_TYPES = {
  SUBMIT: "submit",
  APPROVE: "approve",
  REJECT: "reject",
  CANCEL: "cancel",
  TRANSFER: "transfer",
  ADD_APPROVER: "add_approver",
  SYSTEM_NOTIFY: "system_notify",
} as const;

export const MESSAGE_STATUSES = {
  DRAFT: "draft",
  SENT: "sent",
} as const;

export const MESSAGE_TARGET_TYPES = {
  PERSONAL: "personal",
  GROUP: "group",
  ALL: "all",
} as const;

export const MESSAGE_READ_STATUSES = {
  UNREAD: "unread",
  READ: "read",
} as const;

export const SERVER_STATUSES = {
  ENABLE: "enable",
  DISABLE: "disable",
} as const;

export const SERVER_AUTH_TYPES = {
  PASSWORD: "password",
  KEY: "key",
} as const;

export const LOGIN_TYPES = {
  PASSWORD: "password",
  PHONE: "phone",
  EMAIL: "email",
} as const;

export const EDITOR_PAGE_MODES = {
  CREATE: "create",
  EDIT: "edit",
  DETAIL: "detail",
} as const;

export const TASK_TABS = {
  PENDING: "pending",
  DONE: "done",
} as const;
