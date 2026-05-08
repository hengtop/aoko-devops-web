# PRD: 迭代构建交互完善

> **Task ID**: `build-interaction`
> **Created**: 2026-05-08
> **Status**: Draft

---

## 1. 背景

当前前端 ReleaseDetail 页面的「构建」按钮仅调用 `POST /release/build/:id`，但后端 `startBuild` 有 3 个前置校验：

1. **必须关联 `environmentId`**（构建环境，类型为 build 的 Environment）
2. **必须配置 `buildConfig.buildCommands`**（至少一条构建命令）
3. **必须有 `git.branch`**

当前前端在创建迭代时未传 `environmentId` 和 `buildConfig`，且 `ReleaseRecord` 类型中缺失这两个字段，导致点击「构建」必然报错。

构建是异步执行的：后端通过事件 `release.build.started` → `BuildListener` → `BuildExecutorService.execute()` 异步 SSH 到构建服务器执行脚本，构建过程会生成日志（通过 `DeploymentLogService`），构建完成后状态变为 `build_success` / `build_failed`。

---

## 2. 目标

让用户能从前端**完整闭环**地完成：创建迭代 → 配置构建 → 触发构建 → 查看构建进度与日志 → 构建成功/失败处理。

---

## 3. 功能点清单

### 3.1 数据层补全

| # | 改动 | 文件 | 说明 |
|---|------|------|------|
| 1 | `ReleaseRecord` 类型补字段 | `src/service/api/release.ts` | 新增 `environmentId?: string`、`buildConfig?: BuildConfig`、`buildArtifact?: BuildArtifact`、`buildStartedAt?: string`、`buildCompletedAt?: string`、`buildLog?: string`、`errorMessage?: string` |
| 2 | 新增 `BuildConfig` 接口 | `src/service/api/release.ts` | `{ buildCommands: string[]; artifactPath?: string; artifactType?: string; dockerfilePath?: string; imageRepo?: string; preCommands?: string[]; postCommands?: string[]; envVars?: Record<string, string>; timeoutSec?: number; workDir?: string }` |
| 3 | 新增 `BuildArtifact` 接口 | `src/service/api/release.ts` | `{ type: string; dockerImage?: string; packageUrl?: string; packageChecksum?: string; buildJobId?: string; buildNumber?: number }` |
| 4 | `CreateReleaseParams` 补字段 | `src/service/api/release.ts` | 新增 `environmentId?: string`、`buildConfig?: BuildConfig` |
| 5 | `UpdateReleaseParams` 补字段 | `src/service/api/release.ts` | 新增 `environmentId?: string`、`buildConfig?: BuildConfig` |
| 6 | `updateRelease` 函数 | `src/service/api/release.ts` | 确认已有，用于保存构建配置 |

### 3.2 创建迭代时支持构建配置（ReleaseCreate）

| # | 改动 | 文件 | 说明 |
|---|------|------|------|
| 7 | 新增「构建环境」下拉框 | `src/pages/ReleaseCreate/index.tsx` | `<Select>` 加载当前应用的 Environment 列表（`listEnvironments({ applicationId })`），选择后写入 `environmentId` |
| 8 | 新增「构建配置」折叠区域 | `src/pages/ReleaseCreate/index.tsx` | 可折叠 `<Collapse>`，包含：构建命令（`TextArea`，每行一条命令）、产物路径（`Input`，默认 `dist/`）、产物类型（`Select`：zip/docker-image）、超时秒数（`InputNumber`，默认 600）、工作目录（`Input`，选填） |
| 9 | Docker 模式额外字段 | `src/pages/ReleaseCreate/index.tsx` | 当产物类型为 `docker-image` 时展示：Dockerfile 路径（默认 `Dockerfile`）、镜像仓库地址 |
| 10 | 环境变量编辑 | `src/pages/ReleaseCreate/index.tsx` | 动态 key/value 行，与 PipelineCreate 的 variables 编辑器一致 |
| 11 | 提交时组装 `buildConfig` | `src/pages/ReleaseCreate/index.tsx` | 将表单值转为 `BuildConfig` 对象，与 `environmentId` 一起传给 `createRelease` |

### 3.3 迭代详情页构建交互（ReleaseDetail）

| # | 改动 | 文件 | 说明 |
|---|------|------|------|
| 12 | 构建信息卡片 | `src/pages/ReleaseDetail/index.tsx` | 在描述信息卡片下方新增「构建信息」Card，展示：构建环境名称、构建状态（StatusBadge）、构建开始/完成时间、构建耗时、产物信息（类型+URL/镜像地址）、错误信息（BUILD_FAILED 时红色 Alert） |
| 13 | 构建按钮前置校验 | `src/pages/ReleaseDetail/index.tsx` | 点击「构建」前检查 `release.environmentId` 和 `release.buildConfig?.buildCommands?.length`，缺失时 `message.warning()` 提示并引导用户先配置，不发请求 |
| 14 | 构建状态轮询 | `src/pages/ReleaseDetail/index.tsx` | 当 `release.status === 'building'` 时，每 5 秒自动调用 `getReleaseDetail` 刷新状态，直到状态变为 `build_success` / `build_failed` 后停止轮询 |
| 15 | 构建日志查看 | `src/pages/ReleaseDetail/index.tsx` | 新增「查看构建日志」按钮，打开 Drawer，调用 `getDeploymentLogs({ deploymentId: releaseId })` 获取日志列表（后端复用 deploymentId 字段存 releaseId），按时间排序展示，支持 level 颜色区分（info=默认, warn=黄, error=红） |
| 16 | 构建日志实时刷新 | `src/pages/ReleaseDetail/index.tsx` | 构建中（status=building）时日志 Drawer 每 3 秒自动追加新日志 |
| 17 | 构建配置编辑 | `src/pages/ReleaseDetail/index.tsx` | 新增「编辑构建配置」按钮（仅 draft/build_failed 状态可用），打开 Drawer 表单编辑 `environmentId` + `buildConfig`，保存调用 `updateRelease(releaseId, { environmentId, buildConfig })` |
| 18 | 重新构建 | `src/pages/ReleaseDetail/index.tsx` | 当状态为 `build_failed` 时，「构建」按钮文案改为「重新构建」，点击调用 `startReleaseBuild` |
| 19 | 构建按钮状态管理 | `src/pages/ReleaseDetail/index.tsx` | `building` 状态下「构建」按钮 disabled 并显示 loading + "构建中…"；`build_success`/`ready` 状态下按钮 disabled 并提示"已构建" |

### 3.4 状态流转按钮可用性约束

| # | 改动 | 文件 | 说明 |
|---|------|------|------|
| 20 | 构建按钮可用态 | `src/pages/ReleaseDetail/index.tsx` | 仅 `draft` / `build_failed` 状态可点击 |
| 21 | 标记就绪按钮可用态 | `src/pages/ReleaseDetail/index.tsx` | 仅 `build_success` 状态可点击 |
| 22 | 取消按钮可用态 | `src/pages/ReleaseDetail/index.tsx` | `cancelled` / `archived` 状态下 disabled |
| 23 | 部署流水线可用态 | `src/pages/ReleaseDetail/index.tsx` | 仅 `ready` 状态时环境卡片可点击发起部署 |

### 3.5 常量/标签补全

| # | 改动 | 文件 | 说明 |
|---|------|------|------|
| 24 | 补全构建相关状态颜色和文案 | `src/constants/cicd.ts` | 确认 `BUILDING` / `BUILD_SUCCESS` / `BUILD_FAILED` 状态已有 label 和 color，若缺失则补全 |

---

## 4. 后端接口映射

| 前端操作 | 后端接口 | 说明 |
|----------|----------|------|
| 创建迭代 | `POST /release/create` | body 含 `environmentId` + `buildConfig` |
| 更新构建配置 | `POST /release/update/:id` | body 含 `environmentId` + `buildConfig` |
| 触发构建 | `POST /release/build/:id` | 后端校验 environmentId + buildConfig + git.branch |
| 查询详情 | `POST /release/detail/:id` | 返回含 buildConfig/buildArtifact/buildStartedAt/buildCompletedAt/errorMessage |
| 查看构建日志 | `POST /deployments/logs/:id` | 后端复用 deploymentId=releaseId 存储构建日志 |
| 标记就绪 | `POST /release/ready/:id` | 仅 build_success 可转换 |
| 取消迭代 | `POST /release/cancel/:id` | body 含 reason |
| 加载构建环境列表 | `POST /environment/list` | 按 applicationId 过滤 |

---

## 5. 状态机（前端展示参考）

```
draft → building → build_success → ready → (部署)
                 → build_failed → (重新构建 → building)
任意非终态 → cancelled
```

终态：`cancelled`、`archived`

---

## 6. 交互流程

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  创建迭代     │────→│  配置构建     │────→│  触发构建     │────→│  查看日志     │
│  选择构建环境  │     │  编辑命令配置  │     │  前置校验     │     │  实时刷新     │
│  填写构建配置  │     │  保存到Release │     │  调用build API │     │  等待完成     │
└──────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                      │
                                                          ┌───────────┴───────────┐
                                                          │                       │
                                                    build_success           build_failed
                                                          │                       │
                                                    标记就绪 →              查看错误 →
                                                    发起部署               编辑配置 →
                                                                          重新构建
```

---

## 7. 不涉及

- 不修改后端任何代码
- 不涉及 Pipeline Run 构建（那是流水线维度，这里是迭代维度的构建）
- 不涉及审批流程（后端 approvalRequired 已有，本 PRD 不处理）
- 不新增路由，所有交互在 ReleaseDetail + ReleaseCreate 现有页面完成

---

## 8. 实现优先级

**P0（核心闭环）**：#1~#6 数据层 → #13 前置校验 → #12 构建信息卡片 → #14 构建轮询 → #19 按钮状态

**P1（创建时配置）**：#7~#11 ReleaseCreate 表单

**P2（日志+编辑）**：#15~#18 日志查看 + 构建配置编辑 + 重新构建

**P3（体验优化）**：#20~#24 按钮可用态约束 + 常量补全
