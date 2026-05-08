// CI/CD 模块相关枚举与标签映射

// ===== Release =====
export const RELEASE_STATUSES = {
  DRAFT: "draft",
  PENDING: "pending",
  BUILDING: "building",
  BUILD_SUCCESS: "build_success",
  BUILD_FAILED: "build_failed",
  TESTING: "testing",
  TEST_SUCCESS: "test_success",
  TEST_FAILED: "test_failed",
  READY: "ready",
  CANCELLED: "cancelled",
  ARCHIVED: "archived",
} as const;

export type ReleaseStatus = (typeof RELEASE_STATUSES)[keyof typeof RELEASE_STATUSES];

export const RELEASE_STATUS_LABELS: Record<ReleaseStatus, string> = {
  draft: "草稿",
  pending: "待处理",
  building: "构建中",
  build_success: "构建成功",
  build_failed: "构建失败",
  testing: "测试中",
  test_success: "测试通过",
  test_failed: "测试失败",
  ready: "就绪",
  cancelled: "已取消",
  archived: "已归档",
};

export const RELEASE_STATUS_COLORS: Record<ReleaseStatus, string> = {
  draft: "default",
  pending: "processing",
  building: "processing",
  build_success: "success",
  build_failed: "error",
  testing: "processing",
  test_success: "success",
  test_failed: "error",
  ready: "success",
  cancelled: "default",
  archived: "default",
};

export const RELEASE_STAGES = {
  DEV: "DEV",
  TEST: "TEST",
  PRE: "PRE",
  PROD: "PROD",
} as const;

export type ReleaseStage = (typeof RELEASE_STAGES)[keyof typeof RELEASE_STAGES];

export const RELEASE_STAGE_LABELS: Record<ReleaseStage, string> = {
  DEV: "开发环境",
  TEST: "测试环境",
  PRE: "预发环境",
  PROD: "生产环境",
};

// ===== Deployment =====
export const DEPLOYMENT_STATUSES = {
  PENDING: "pending",
  PREPARING: "preparing",
  DEPLOYING: "deploying",
  VERIFYING: "verifying",
  SUCCESS: "success",
  FAILED: "failed",
  ROLLING_BACK: "rolling_back",
  ROLLED_BACK: "rolled_back",
  CANCELLED: "cancelled",
} as const;

export type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[keyof typeof DEPLOYMENT_STATUSES];

export const DEPLOYMENT_STATUS_LABELS: Record<DeploymentStatus, string> = {
  pending: "待部署",
  preparing: "准备中",
  deploying: "部署中",
  verifying: "验证中",
  success: "部署成功",
  failed: "部署失败",
  rolling_back: "回滚中",
  rolled_back: "已回滚",
  cancelled: "已取消",
};

export const DEPLOYMENT_STATUS_COLORS: Record<DeploymentStatus, string> = {
  pending: "default",
  preparing: "processing",
  deploying: "processing",
  verifying: "processing",
  success: "success",
  failed: "error",
  rolling_back: "warning",
  rolled_back: "warning",
  cancelled: "default",
};

export const DEPLOY_STRATEGIES = {
  ROLLING: "rolling",
  BLUE_GREEN: "blue-green",
  CANARY: "canary",
  RECREATE: "recreate",
} as const;

export type DeployStrategy = (typeof DEPLOY_STRATEGIES)[keyof typeof DEPLOY_STRATEGIES];

export const DEPLOY_STRATEGY_LABELS: Record<DeployStrategy, string> = {
  rolling: "滚动发布",
  "blue-green": "蓝绿发布",
  canary: "金丝雀发布",
  recreate: "重建发布",
};

// ===== Environment =====
export const ENVIRONMENT_TYPES = {
  DEV: "dev",
  TEST: "test",
  STAGING: "staging",
  PROD: "prod",
  BUILD: "build",
} as const;

export type EnvironmentType = (typeof ENVIRONMENT_TYPES)[keyof typeof ENVIRONMENT_TYPES];

export const ENVIRONMENT_TYPE_LABELS: Record<EnvironmentType, string> = {
  dev: "开发",
  test: "测试",
  staging: "预发",
  prod: "生产",
  build: "构建",
};

export const ENVIRONMENT_TYPE_COLORS: Record<EnvironmentType, string> = {
  dev: "blue",
  test: "gold",
  staging: "orange",
  prod: "red",
  build: "purple",
};

export const ENVIRONMENT_DEPLOY_TYPES = {
  SSH: "ssh",
  DOCKER: "docker",
} as const;

export type EnvironmentDeployType =
  (typeof ENVIRONMENT_DEPLOY_TYPES)[keyof typeof ENVIRONMENT_DEPLOY_TYPES];

export const ENVIRONMENT_DEPLOY_TYPE_LABELS: Record<EnvironmentDeployType, string> = {
  ssh: "SSH 部署",
  docker: "Docker 部署",
};

// ===== Pipeline =====
export const PIPELINE_TYPES = {
  BUILD: "build",
  RELEASE: "release",
} as const;

export type PipelineType = (typeof PIPELINE_TYPES)[keyof typeof PIPELINE_TYPES];

export const PIPELINE_TYPE_LABELS: Record<PipelineType, string> = {
  build: "构建流水线",
  release: "发布流水线",
};

export const TRIGGER_MODES = {
  MANUAL: "manual",
  WEBHOOK: "webhook",
  SCHEDULE: "schedule",
  MIXED: "mixed",
} as const;

export type TriggerMode = (typeof TRIGGER_MODES)[keyof typeof TRIGGER_MODES];

export const TRIGGER_MODE_LABELS: Record<TriggerMode, string> = {
  manual: "手动触发",
  webhook: "Webhook 触发",
  schedule: "定时触发",
  mixed: "混合触发",
};

// ===== Pipeline Run =====
export const PIPELINE_RUN_STATUSES = {
  CREATED: "created",
  QUEUED: "queued",
  RUNNING: "running",
  SUCCESS: "success",
  FAILED: "failed",
  CANCELED: "canceled",
  TIMEOUT: "timeout",
} as const;

export type PipelineRunStatus =
  (typeof PIPELINE_RUN_STATUSES)[keyof typeof PIPELINE_RUN_STATUSES];

export const PIPELINE_RUN_STATUS_LABELS: Record<PipelineRunStatus, string> = {
  created: "已创建",
  queued: "排队中",
  running: "运行中",
  success: "成功",
  failed: "失败",
  canceled: "已取消",
  timeout: "超时",
};

export const PIPELINE_RUN_STATUS_COLORS: Record<PipelineRunStatus, string> = {
  created: "default",
  queued: "processing",
  running: "processing",
  success: "success",
  failed: "error",
  canceled: "default",
  timeout: "warning",
};

// ===== Repository =====
export const REPOSITORY_PROVIDERS = {
  GITLAB: "gitlab",
  GITHUB: "github",
  GITEE: "gitee",
  SELF_HOSTED: "self-hosted",
} as const;

export type RepositoryProvider =
  (typeof REPOSITORY_PROVIDERS)[keyof typeof REPOSITORY_PROVIDERS];

export const REPOSITORY_PROVIDER_LABELS: Record<RepositoryProvider, string> = {
  gitlab: "GitLab",
  github: "GitHub",
  gitee: "Gitee",
  "self-hosted": "自托管",
};

export const REPOSITORY_AUTH_TYPES = {
  TOKEN: "token",
  SSH_KEY: "ssh_key",
} as const;

export type RepositoryAuthType =
  (typeof REPOSITORY_AUTH_TYPES)[keyof typeof REPOSITORY_AUTH_TYPES];

export const REPOSITORY_AUTH_TYPE_LABELS: Record<RepositoryAuthType, string> = {
  token: "Access Token",
  ssh_key: "SSH Key",
};

// ===== Credential =====
export const CREDENTIAL_TYPES = {
  GIT_TOKEN: "git_token",
  SSH_KEY: "ssh_key",
  DOCKER_AUTH: "docker_auth",
  KUBECONFIG: "kubeconfig",
  PASSWORD: "password",
} as const;

export type CredentialType = (typeof CREDENTIAL_TYPES)[keyof typeof CREDENTIAL_TYPES];

export const CREDENTIAL_TYPE_LABELS: Record<CredentialType, string> = {
  git_token: "Git Token",
  ssh_key: "SSH Key",
  docker_auth: "Docker 认证",
  kubeconfig: "Kubeconfig",
  password: "密码",
};

// ===== Variable =====
export const VARIABLE_SCOPE_TYPES = {
  APPLICATION: "application",
  ENVIRONMENT: "environment",
  PIPELINE: "pipeline",
} as const;

export type VariableScopeType =
  (typeof VARIABLE_SCOPE_TYPES)[keyof typeof VARIABLE_SCOPE_TYPES];

export const VARIABLE_SCOPE_TYPE_LABELS: Record<VariableScopeType, string> = {
  application: "应用级",
  environment: "环境级",
  pipeline: "流水线级",
};

// ===== Executor Types =====
export const EXECUTOR_TYPE_LABELS: Record<string, string> = {
  shell: "Shell 脚本",
  docker: "Docker",
  deploy: "部署",
  artifact: "产物",
  system: "系统",
  manual_approval: "人工审批",
};

// ===== Select Options =====
export const releaseStageOptions = Object.entries(RELEASE_STAGE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const deployStrategyOptions = Object.entries(DEPLOY_STRATEGY_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const environmentTypeOptions = Object.entries(ENVIRONMENT_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const environmentDeployTypeOptions = Object.entries(ENVIRONMENT_DEPLOY_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const pipelineTypeOptions = Object.entries(PIPELINE_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const triggerModeOptions = Object.entries(TRIGGER_MODE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const repositoryProviderOptions = Object.entries(REPOSITORY_PROVIDER_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const repositoryAuthTypeOptions = Object.entries(REPOSITORY_AUTH_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const credentialTypeOptions = Object.entries(CREDENTIAL_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

export const variableScopeTypeOptions = Object.entries(VARIABLE_SCOPE_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);
