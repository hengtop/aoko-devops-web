# CI/CD 构建部署自动化前端模块 — PRD

> 版本: v1.0
> 日期: 2026-05-07
> 基于: 后端 `aoko-devops` 已完成的 CI/CD 模块接口

---

## 一、目标

为 `aoko-devops-web` 前端新增完整的 CI/CD 模块，覆盖**产品管理 → 应用管理 → 迭代发布 → 流水线构建 → 环境部署**全链路。交互风格参考 Cloudflare Dashboard 和蚂蚁雨燕工作台。

---

## 二、后端接口清单（已实现）

### 2.1 产品线（Product）

| 接口 | 说明 |
|------|------|
| `POST /product/create` | 创建产品 `{tenantId, name, code, description?, avatar?}` |
| `POST /product/list` | 产品列表（分页） |
| `POST /product/detail` | 产品详情 |
| `POST /product/update` | 更新产品 |
| `POST /product/delete` | 删除产品 |
| `POST /product/relative/user` | 添加产品成员 |
| `POST /product/remove/user` | 移除产品成员 |
| `POST /product/user` | 产品成员列表 |

### 2.2 应用（Application）

| 接口 | 说明 |
|------|------|
| `POST /application/create` | 创建应用 `{tenantId, productId, name, code, repo_url, description?, avatar?, structure?, level?, template_id?}` |
| `POST /application/list` | 应用列表（分页） |
| `POST /application/detail` | 应用详情 |
| `POST /application/update` | 更新应用 |
| `POST /application/delete` | 删除应用 |
| `POST /application/relative/user` | 添加应用成员 |
| `POST /application/remove/user` | 移除应用成员 |
| `POST /application/user` | 应用成员列表 |

### 2.3 迭代/发布（Release）

| 接口 | 说明 |
|------|------|
| `POST /release/create` | 创建迭代 `{tenantId, productId, applicationId, version, title, description?, currentStage, git: {branch, commitHash, ...}, metadata?}` |
| `POST /release/list` | 迭代列表（分页） |
| `POST /release/detail/:id` | 迭代详情 |
| `POST /release/update/:id` | 更新迭代 |
| `POST /release/build/:id` | 开始构建 |
| `POST /release/ready/:id` | 标记就绪 |
| `POST /release/cancel/:id` | 取消发布 |
| `POST /release/delete/:id` | 删除迭代 |
| `POST /release/relative/user` | 添加迭代成员 |
| `POST /release/remove/user` | 移除迭代成员 |
| `POST /release/user` | 迭代成员列表 |
| `POST /release/application/:applicationId/statistics` | 应用发布统计 |

**Release 状态**: `draft → pending → building → build_success/build_failed → testing → test_success/test_failed → ready → cancelled/archived`

**Release Stage**: `DEV | TEST | PRE | PROD`

### 2.4 部署（Deployment）

| 接口 | 说明 |
|------|------|
| `POST /deployments/create` | 创建部署 `{releaseId, environment, deployStrategy, targetServers[], deployConfig, accessUrls?, metadata?}` |
| `POST /deployments/list` | 部署列表（分页） |
| `POST /deployments/detail/:id` | 部署详情 |
| `POST /deployments/start/:id` | 开始部署 |
| `POST /deployments/cancel/:id` | 取消部署 |
| `POST /deployments/rollback/:id` | 回滚部署 |
| `POST /deployments/logs/:id` | 部署日志 |
| `POST /deployments/history/:id` | 部署历史 |
| `POST /deployments/statistics/overview` | 部署统计 |

**Deployment Status**: `pending → preparing → deploying → verifying → success/failed → rolling_back → rolled_back/cancelled`

**Environment**: `dev | test | staging | prod`

**Deploy Strategy**: `rolling | blue-green | canary | recreate`

### 2.5 流水线（Pipeline）

| 接口 | 说明 |
|------|------|
| `POST /pipeline/create` | 创建流水线 `{applicationId, repositoryId?, name, code, type, triggerMode, definition, description?}` |
| `POST /pipeline/list` | 流水线列表（分页） |
| `POST /pipeline/detail` | 流水线详情 |
| `POST /pipeline/update` | 更新流水线 |
| `POST /pipeline/delete` | 删除流水线 |
| `POST /pipeline/toggle` | 启用/禁用 |
| `POST /pipeline/validate` | 校验 definition |

**Pipeline Type**: `build | release`

**Trigger Mode**: `manual | webhook | schedule | mixed`

**Pipeline Definition** 结构:
```typescript
{
  variables?: Array<{ key: string; value: string; isSecret?: boolean }>;
  approvalRequired?: boolean;
  stages: Array<{
    key: string;
    name: string;
    order: number;
    condition?: string;
    jobs: Array<{
      key: string;
      name: string;
      executorType: 'shell' | 'docker' | 'deploy' | 'artifact' | 'system' | 'manual_approval';
      timeoutSec?: number;
      retry?: number;
      config: Record<string, any>;
    }>;
  }>;
}
```

### 2.6 流水线运行（Pipeline Run）

| 接口 | 说明 |
|------|------|
| `POST /pipeline-run/trigger` | 触发运行 `{pipelineId, sourceRef?, sourceType?, commitSha?, commitMessage?, variables?}` |
| `POST /pipeline-run/list` | 运行记录列表 |
| `POST /pipeline-run/detail` | 运行详情 |
| `POST /pipeline-run/cancel` | 取消运行 |
| `POST /pipeline-run/retry` | 重试运行 |
| `POST /pipeline-run/stages` | 阶段列表 |
| `POST /pipeline-run/jobs` | 任务列表 |
| `POST /pipeline-run/job-detail` | 任务详情（含日志） |

**Pipeline Run Status**: `created | queued | running | success | failed | canceled | timeout`

### 2.7 环境（Environment）

| 接口 | 说明 |
|------|------|
| `POST /environment/create` | 创建环境 `{applicationId, name, code, type, deployType, serverIds[], description?, status?}` |
| `POST /environment/list` | 环境列表 |
| `POST /environment/detail` | 环境详情 |
| `POST /environment/update` | 更新环境 |
| `POST /environment/delete` | 删除环境 |
| `POST /environment/current-deployment` | 当前部署版本 |
| `POST /environment/lock` | 加锁 |
| `POST /environment/unlock` | 解锁 |

**Environment Type**: `dev | test | staging | prod`

**Deploy Type**: `ssh | docker`

### 2.8 代码仓库（Repository）

| 接口 | 说明 |
|------|------|
| `POST /repository/create` | 绑定仓库 `{applicationId, providerType, repoName, repoUrl, httpUrl?, sshUrl?, defaultBranch, authType, credentialId?, webhookSecret?, status?}` |
| `POST /repository/list` | 仓库列表 |
| `POST /repository/detail` | 仓库详情 |
| `POST /repository/update` | 更新仓库 |
| `POST /repository/delete` | 删除仓库 |
| `POST /repository/webhook-events` | Webhook 事件列表 |

**Provider Type**: `gitlab | github | gitee | self-hosted`

**Auth Type**: `token | ssh_key`

### 2.9 凭据（Credential）

| 接口 | 说明 |
|------|------|
| `POST /credential/create` | 创建凭据 `{applicationId?, name, type, content, extraConfig?, description?}` |
| `POST /credential/list` | 凭据列表 |
| `POST /credential/detail` | 凭据详情 |
| `POST /credential/update` | 更新凭据 |
| `POST /credential/delete` | 删除凭据 |

**Credential Type**: `git_token | ssh_key | docker_auth | kubeconfig | password`

### 2.10 变量（Variable）

| 接口 | 说明 |
|------|------|
| `POST /variable/create` | 创建变量 `{applicationId, environmentId?, pipelineId?, scopeType, key, value, isSecret?, description?}` |
| `POST /variable/list` | 变量列表 |
| `POST /variable/update` | 更新变量 |
| `POST /variable/delete` | 删除变量 |

**Scope Type**: `application | environment | pipeline`

### 2.11 构建产物（Artifact）

| 接口 | 说明 |
|------|------|
| `POST /artifact/register` | 登记产物 |
| `POST /artifact/list` | 产物列表 |
| `POST /artifact/detail` | 产物详情 |
| `POST /artifact/update-status` | 更新状态 |
| `POST /artifact/releasable` | 可发布产物 |

**Artifact Status**: `available | deprecated | deleted`

---

## 三、页面架构设计

### 3.1 新增路由

```
/product                          # 产品列表
/product/create                   # 创建产品（独立页面）
/product/:id                      # 产品详情
/product/:id/apps                 # 产品下的应用列表

/app/:id                          # 应用详情（概览）
/app/:id/releases                 # 迭代列表
/app/:id/releases/create          # 创建迭代（独立页面）
/app/:id/releases/:releaseId      # 迭代详情（含部署流程图）
/app/:id/pipelines                # 流水线列表
/app/:id/pipelines/create         # 创建流水线（独立页面）
/app/:id/pipelines/:pipelineId    # 流水线详情
/app/:id/environments             # 环境列表
/app/:id/environments/create      # 创建环境
/app/:id/settings                 # 应用设置（仓库、凭据、变量）

/pipeline-run/:runId              # 流水线运行详情（日志）
```

### 3.2 顶部工作栏入口

在 `AppTopBar` 新增**「创建项目」**按钮，点击跳转 `/product/create`。

### 3.3 左侧菜单新增

```
工作台
产品管理          ← 新增
  └ 产品列表
模版配置
配置管理
审批中心
  └ ...
服务器管理
消息中心
  └ ...
```

---

## 四、交互设计详情

### 4.1 创建产品（独立页面 `/product/create`）

**入口**: 顶部工作栏「创建项目」按钮 + 产品列表页「新建」按钮

**表单字段**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 名称 | Input | ✅ | 产品名称 |
| Code | Input | ✅ | 产品唯一编码（自动从名称生成，可编辑） |
| 描述 | TextArea | ❌ | 产品描述 |
| 头像 | Upload | ❌ | 产品图标 |

**交互**:
- 提交成功后跳转至产品详情页
- 产品详情页显示「创建应用」入口

### 4.2 产品详情页（`/product/:id`）

**布局**: 上方产品基本信息卡片 + 下方 Tab 切换

**Tab 内容**:
- **应用列表**: 该产品下的所有应用，卡片网格展示
- **成员管理**: 产品成员列表，可添加/移除

### 4.3 创建应用（独立页面）

**表单字段**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 名称 | Input | ✅ | 应用名称 |
| Code | Input | ✅ | 应用唯一编码 |
| 产品线 | Select | ✅ | 选择所属产品（从产品列表获取） |
| 仓库地址 | Input | ✅ | Git 仓库 URL |
| 描述 | TextArea | ❌ | 应用描述 |
| 应用架构 | Select | ❌ | 前端/后端/微服务/... |
| 应用等级 | Select | ❌ | P0/P1/P2/P3 |
| 模板 | Select | ❌ | 关联部署模板 |

**创建完成后**: 进入应用详情页，引导用户可选地创建首个迭代

### 4.4 应用详情页（`/app/:id`）

**布局**: 参考 Cloudflare 项目概览

**顶部**: 应用名称 + Code + 状态 + 快捷操作（创建迭代、触发构建）

**内容区 Tabs**:
- **概览**: 应用基本信息 + 最新部署状态卡片（按环境展示 dev/test/staging/prod）+ 最近活动
- **迭代**: 迭代列表（表格），可筛选状态
- **流水线**: 流水线列表 + 最近运行状态
- **环境**: 环境配置列表
- **设置**: 仓库配置、凭据管理、变量管理

### 4.5 创建迭代（独立页面 `/app/:id/releases/create`）

**表单字段**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 版本号 | Input | ✅ | 如 v1.2.0 |
| 标题 | Input | ✅ | 迭代标题 |
| 描述 | TextArea | ❌ | 迭代说明（支持 Markdown） |
| 目标阶段 | Select | ✅ | DEV/TEST/PRE/PROD |
| Git 分支 | Input | ✅ | 部署分支名 |
| Commit Hash | Input | ✅ | 提交哈希（≥7位） |
| Commit 信息 | Input | ❌ | 提交说明 |
| Commit 作者 | Input | ❌ | 提交者 |
| Tag | Input | ❌ | Git Tag |

### 4.6 迭代详情页（`/app/:id/releases/:releaseId`）— **核心页面**

**布局**: 参考蚂蚁雨燕发布详情

**顶部**:
- 迭代标题 + 版本号 + 状态 Badge
- 操作按钮: 开始构建 / 标记就绪 / 取消（根据当前状态动态显示）

**中间区域 — 部署环境流程图** ⭐:
- 横向排列环境卡片: `DEV → TEST → STAGING → PROD`
- 每个环境卡片显示:
  - 环境名称
  - 当前部署状态（颜色圆点）
  - 最近部署时间
  - 部署版本/分支
- 卡片间用箭头/连线连接，表示发布流向
- 点击环境卡片 → 展开右侧抽屉，显示:
  - 该环境的部署记录列表
  - 操作：发起部署 / 回滚
  - 部署日志（可展开查看）

**下方 Tabs**:
- **部署记录**: 所有环境的部署历史表格
- **Git 信息**: 分支、Commit、关联 PR
- **构建产物**: 关联的 artifact 信息
- **成员**: 迭代相关人员

### 4.7 发起部署（抽屉 Drawer）

从迭代详情页的环境卡片触发，右侧抽屉打开：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 环境 | 已确定 | - | 从点击的环境卡片带入 |
| 部署策略 | Select | ✅ | rolling/blue-green/canary/recreate |
| 目标服务器 | Select（多选）| ✅ | 从环境关联的服务器中选择 |
| 健康检查 URL | Input | ❌ | /health |
| 自动回滚 | Switch | ❌ | 默认开启 |

### 4.8 流水线运行详情页（`/pipeline-run/:runId`）

**布局**: 左侧 stage 列表（纵向步骤条）+ 右侧 job 详情/日志

- 每个 stage 显示状态图标 + 名称 + 耗时
- 点击 stage 展开其 jobs
- 点击 job 右侧显示实时日志（终端风格，深色背景）
- 顶部显示运行总状态 + 耗时 + 触发信息

### 4.9 应用设置页 Tabs

**仓库配置**:
- 绑定的仓库列表
- 新增仓库表单（抽屉）: provider、repoUrl、authType、credential

**凭据管理**:
- 凭据列表（脱敏显示）
- 新增凭据表单（抽屉）: name、type、content

**变量管理**:
- 变量列表（按 scope 分组）
- 新增变量（行内编辑或抽屉）: key、value、isSecret、scope

---

## 五、前端架构设计

### 5.1 目录结构新增

```
src/
├── pages/
│   ├── Product/                    # 产品列表
│   │   ├── index.tsx
│   │   └── styles.module.less
│   ├── ProductCreate/              # 创建产品
│   │   ├── index.tsx
│   │   └── styles.module.less
│   ├── ProductDetail/              # 产品详情
│   │   ├── index.tsx
│   │   └── styles.module.less
│   ├── AppDetail/                  # 应用详情（含概览/迭代/流水线/环境/设置 tabs）
│   │   ├── index.tsx
│   │   ├── styles.module.less
│   │   ├── TabOverview.tsx
│   │   ├── TabReleases.tsx
│   │   ├── TabPipelines.tsx
│   │   ├── TabEnvironments.tsx
│   │   └── TabSettings.tsx
│   ├── AppCreate/                  # 创建应用
│   │   ├── index.tsx
│   │   └── styles.module.less
│   ├── ReleaseCreate/              # 创建迭代
│   │   ├── index.tsx
│   │   └── styles.module.less
│   ├── ReleaseDetail/              # 迭代详情（含部署流程图）
│   │   ├── index.tsx
│   │   ├── styles.module.less
│   │   ├── DeployPipeline.tsx      # 环境流程图组件
│   │   └── DeployDrawer.tsx        # 发起部署抽屉
│   ├── PipelineCreate/             # 创建流水线
│   │   ├── index.tsx
│   │   └── styles.module.less
│   ├── PipelineDetail/             # 流水线详情
│   │   ├── index.tsx
│   │   └── styles.module.less
│   └── PipelineRunDetail/          # 流水线运行详情（日志）
│       ├── index.tsx
│       └── styles.module.less
├── components/
│   ├── DeployFlowCard/             # 部署环境流程卡片
│   │   ├── index.tsx
│   │   └── styles.module.less
│   ├── PipelineStageGraph/         # 流水线 stage 图形
│   │   ├── index.tsx
│   │   └── styles.module.less
│   ├── LogViewer/                  # 日志查看器（终端风格）
│   │   ├── index.tsx
│   │   └── styles.module.less
│   └── StatusBadge/                # 通用状态 Badge
│       ├── index.tsx
│       └── styles.module.less
├── service/api/
│   ├── product.ts                  # 产品 API
│   ├── application.ts              # 应用 API（已有，需扩展）
│   ├── release.ts                  # 迭代 API
│   ├── deployment.ts               # 部署 API
│   ├── pipeline.ts                 # 流水线 API
│   ├── pipeline-run.ts             # 流水线运行 API
│   ├── environment.ts              # 环境 API
│   ├── repository.ts               # 仓库 API
│   ├── credential.ts               # 凭据 API
│   ├── variable.ts                 # 变量 API
│   └── artifact.ts                 # 产物 API
└── constants/
    ├── cicd.ts                     # CI/CD 相关常量（状态、枚举、标签映射）
    └── api.ts                      # 新增 API 路径
```

### 5.2 类型定义（`src/service/api/types.ts` 扩展）

```typescript
// === Product ===
export type ProductRecord = {
  _id: string;
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
};

// === Application ===
export type ApplicationRecord = {
  _id: string;
  id: string;
  tenantId: string;
  productId: string;
  name: string;
  code: string;
  repo_url: string;
  description?: string;
  avatar?: string;
  structure?: string;
  level?: string;
  template_id?: string;
  createdAt: string;
  updatedAt: string;
};

// === Release ===
export type ReleaseStatus = 'draft' | 'pending' | 'building' | 'build_success' | 'build_failed' | 'testing' | 'test_success' | 'test_failed' | 'ready' | 'cancelled' | 'archived';
export type ReleaseStage = 'DEV' | 'TEST' | 'PRE' | 'PROD';

export type GitInfo = {
  branch: string;
  commitHash: string;
  commitMessage?: string;
  commitAuthor?: string;
  tag?: string;
  repositoryUrl?: string;
};

export type ReleaseRecord = {
  _id: string;
  id: string;
  tenantId: string;
  productId: string;
  applicationId: string;
  version: string;
  title: string;
  description?: string;
  currentStage: ReleaseStage;
  status: ReleaseStatus;
  git: GitInfo;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

// === Deployment ===
export type DeploymentStatus = 'pending' | 'preparing' | 'deploying' | 'verifying' | 'success' | 'failed' | 'rolling_back' | 'rolled_back' | 'cancelled';
export type DeployStrategy = 'rolling' | 'blue-green' | 'canary' | 'recreate';
export type EnvironmentEnum = 'dev' | 'test' | 'staging' | 'prod';

export type TargetServer = {
  serverId: string;
  serverName: string;
  ip: string;
  group?: string;
  status?: string;
};

export type DeploymentRecord = {
  _id: string;
  id: string;
  releaseId: string;
  environment: EnvironmentEnum;
  deployStrategy: DeployStrategy;
  status: DeploymentStatus;
  progress: number;
  targetServers: TargetServer[];
  triggeredBy: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
};

// === Pipeline ===
export type PipelineType = 'build' | 'release';
export type TriggerMode = 'manual' | 'webhook' | 'schedule' | 'mixed';

export type PipelineRecord = {
  _id: string;
  id: string;
  applicationId: string;
  repositoryId?: string;
  name: string;
  code: string;
  type: PipelineType;
  triggerMode: TriggerMode;
  definition: object;
  description?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

// === Pipeline Run ===
export type PipelineRunStatus = 'created' | 'queued' | 'running' | 'success' | 'failed' | 'canceled' | 'timeout';

export type PipelineRunRecord = {
  _id: string;
  id: string;
  pipelineId: string;
  applicationId: string;
  status: PipelineRunStatus;
  sourceRef?: string;
  sourceType?: 'branch' | 'tag';
  commitSha?: string;
  runNumber: number;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  createdAt: string;
};

// === Environment ===
export type EnvironmentType = 'dev' | 'test' | 'staging' | 'prod';
export type EnvironmentDeployType = 'ssh' | 'docker';

export type EnvironmentRecord = {
  _id: string;
  id: string;
  applicationId: string;
  name: string;
  code: string;
  type: EnvironmentType;
  deployType: EnvironmentDeployType;
  serverIds: string[];
  description?: string;
  status: string;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
};
```

---

## 六、实施步骤拆分

### Phase 1：基础设施（路由 + API + 常量）

1. 新增 `src/constants/cicd.ts` — 所有 CI/CD 相关枚举、状态映射、标签
2. 扩展 `src/constants/api.ts` — 新增所有 CI/CD 模块 API 路径
3. 扩展 `src/constants/routes.ts` — 新增路由路径常量
4. 新增 API service 文件: `product.ts`、`release.ts`、`deployment.ts`、`pipeline.ts`、`pipeline-run.ts`、`environment.ts`、`repository.ts`、`credential.ts`、`variable.ts`、`artifact.ts`
5. 新增通用组件: `StatusBadge`、`LogViewer`

### Phase 2：产品管理模块

6. `Product` 页面（列表，卡片网格 + 表格切换）
7. `ProductCreate` 页面（表单）
8. `ProductDetail` 页面（信息 + 应用列表 + 成员管理）

### Phase 3：应用管理模块

9. `AppCreate` 页面（表单，含产品线选择）
10. `AppDetail` 页面框架（Tabs 容器）
11. `TabOverview` — 应用概览（基本信息 + 环境部署状态卡片）
12. `TabReleases` — 迭代列表
13. `TabPipelines` — 流水线列表
14. `TabEnvironments` — 环境管理
15. `TabSettings` — 仓库/凭据/变量配置

### Phase 4：迭代与部署模块（核心）

16. `ReleaseCreate` 页面（创建迭代表单）
17. `ReleaseDetail` 页面框架
18. `DeployPipeline` 组件 — 环境流程图（横向卡片 + 连线）
19. `DeployDrawer` 组件 — 发起部署抽屉
20. 部署记录列表 + 日志查看

### Phase 5：流水线模块

21. `PipelineCreate` 页面（流水线编排器）
22. `PipelineDetail` 页面（definition 可视化 + 运行历史）
23. `PipelineRunDetail` 页面（stage 步骤条 + job 日志）
24. `PipelineStageGraph` 组件

### Phase 6：顶部入口 + 左侧菜单 + 路由注册

25. `AppTopBar` 新增「创建项目」按钮
26. `AppConsoleMenu` 新增「产品管理」菜单项
27. 路由注册（router/index.tsx）
28. 路由守卫配置

### Phase 7：使用说明 & 测试流程文档

29. 编写完整使用说明文档

---

## 七、使用说明（完整交互流程测试）

### 测试流程

1. **创建产品**: 顶部栏点击「创建项目」→ 填写名称/Code/描述 → 提交 → 进入产品详情
2. **创建应用**: 产品详情页点击「创建应用」→ 填写信息（选产品线、填仓库地址）→ 提交 → 进入应用详情
3. **配置环境**: 应用详情 → 环境 Tab → 创建 dev/test/prod 环境，关联服务器
4. **配置流水线**: 应用详情 → 流水线 Tab → 创建构建流水线（配置 stages/jobs）
5. **创建迭代**: 应用详情 → 迭代 Tab → 「创建迭代」→ 填写版本号、分支、commit 信息 → 提交
6. **开始构建**: 迭代详情页 → 点击「开始构建」→ 查看构建状态
7. **发起部署**: 迭代详情页 → 点击 DEV 环境卡片 → 抽屉中选择部署策略和服务器 → 确认部署
8. **查看日志**: 部署执行中 → 点击查看日志 → 终端风格实时日志
9. **环境推进**: DEV 部署成功 → 点击 TEST 环境卡片 → 发起下一阶段部署
10. **回滚**: 如部署异常 → 点击回滚按钮 → 确认回滚到上一成功版本

---

## 八、设计注意事项

1. **表单多的操作使用独立页面**（创建产品、创建应用、创建迭代、创建流水线）
2. **表单少的操作使用抽屉**（发起部署、新增凭据、新增变量、绑定仓库）
3. **部署流程图**: 横向卡片流，类似蚂蚁雨燕的环境推进交互
4. **日志查看器**: 深色背景终端风格，支持自动滚动和搜索
5. **状态流转**: 所有状态使用统一的 `StatusBadge` 组件，颜色一致
6. **响应式**: 列表页支持卡片/表格视图切换
7. **空状态引导**: 新建应用后无迭代时显示引导卡片
