# Journal - topzhang (Part 1)

> AI development session journal
> Started: 2026-04-29

---

## Session 1 — 2026-05-07: Bootstrap Frontend Guidelines

**Task**: `00-bootstrap-guidelines`  
**Summary**: 阅读项目代码，归纳并填写了 `.trellis/spec/frontend/` 下的全部 6 个规范文件。

### 完成内容

- `directory-structure.md` — 记录了项目目录结构、命名规范、路径别名、环境配置
- `component-guidelines.md` — 记录了组件结构模式、Props 约定、CSS Modules 样式、页面组件模式、懒加载
- `hook-guidelines.md` — 记录了数据请求模式（直接调用 API + useEffect）、无集中 hooks 目录的约定
- `state-management.md` — 记录了 Zustand store 模式、状态分类（全局/本地/URL/主题）、localStorage 持久化
- `type-safety.md` — 记录了 strict 模式、`as const` 枚举、`import type` 要求、类型就近定义原则
- `quality-guidelines.md` — 记录了 ESLint 配置、禁止模式、必须模式、构建命令

### 关键发现

- 技术栈：Vite 8 + React 19 + TypeScript 5.9 + Ant Design 6 + Zustand 5
- 启用了 React Compiler（babel plugin）
- 使用 umi-request 做网络请求，有审批流拦截机制
- 不使用 React Query/SWR，数据请求在组件内通过 useEffect 完成
- Props 类型统一用 `type`（非 `interface`）

---



## Session 1: UX改造 + 仓库分支接口接入 + finish-work收尾

**Date**: 2026-05-08
**Task**: UX改造 + 仓库分支接口接入 + finish-work收尾
**Branch**: `main`

### Summary

完成 05-07-ux-improvements 任务：修复提交按钮loading(try/finally)、移除名称/code联动、产品编辑按钮补充跳转+ProductCreate改造为编辑模式、createApplication/createRelease成功后跳转详情页、AppCreate双仓库模式、迭代分支Select+commitHash回填+repositoryId透传。接入后端新增 /repository/branches 和 /repository/resolve-branch 接口。修复ESLint no-use-before-define。更新spec component-guidelines.md记录表单UX规范。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `64d7ae4` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete

---

## Session 3: 环境CRUD + 流水线创建 + 服务器绑定 + 部署修复

**Date**: 2026-05-08
**Branch**: `main`

### Summary

完成 TabEnvironments 环境 CRUD（EnvironmentDrawer 增/删/改/锁定/解锁）、PipelineCreate 全功能（repositoryId、variables、approvalRequired、stage condition、job timeout、创建后跳转详情）、Pipeline Trigger API 类型与函数、环境-服务器绑定（EnvironmentDrawer 添加服务器多选）、ReleaseDetail 发起部署修复（从 env.serverIds 构建 targetServers）、全局 loading 状态修复（try/finally）。

### Main Changes

1. **TabEnvironments CRUD** — EnvironmentDrawer 支持添加/编辑/删除环境，锁定/解锁操作
2. **PipelineCreate 全功能** — repositoryId 选择器、pipeline variables (key/value/isSecret)、approvalRequired 开关、stage condition、job timeoutSec、创建后导航到详情页
3. **Pipeline Trigger API** — 新增 `PipelineTriggerRecord`、`CreatePipelineTriggerParams`、`UpdatePipelineTriggerParams` 类型及 CRUD 函数
4. **环境-服务器绑定** — EnvironmentDrawer 新增 `serverIds` 多选字段，Drawer 打开时加载服务器列表，创建/更新时传递 serverIds
5. **部署修复** — ReleaseDetail `handleDeploy` 从 `env.serverIds` 拉取服务器详情构建 `TargetServer[]`，空服务器时 warning 提示
6. **Loading 状态修复** — ReleaseDetail 所有异步操作（handleBuild/handleMarkReady/handleCancel/handleDeploy/loadLogs）改用 try/finally

### Git Commits

| Hash | Message |
|------|---------|
| `527deb8` | feat: complete TabEnvironments - add/edit/delete drawer with full CRUD |
| `8972fb2` | feat: complete PipelineCreate - repositoryId, variables, approvalRequired, stage condition, job timeout, navigate to detail; add pipeline-trigger API |
| `1713093` | feat: add server multi-select binding in EnvironmentDrawer |
| `b9a93a2` | fix: build targetServers from env.serverIds on deploy, add try/finally to all loading states |

### Status

[OK] **Completed**

---

## Session 4: SSE Real-time Log Stream — Full Implementation & Bug Fixes

**Date**: 2026-05-09
**Branch**: `main`

### Summary

Implemented SSE real-time log stream end-to-end: installed `@microsoft/fetch-event-source`, created `useLogStream` hook, upgraded `LogViewer` component with structured log rendering + auto-scroll, wired `BuildLogDrawer` to SSE. Fixed three SSE parsing bugs revealed during testing. Aligned with backend commit `7fd523a` to add per-round log filtering (`buildRound`).

### Main Changes

1. **`src/hooks/useLogStream.ts`** *(new)*
   - SSE hook using `@microsoft/fetch-event-source` for Authorization header support
   - Accepts `(deploymentId, enabled, buildRound?)` — `buildRound` filters logs to a specific build round
   - Handles `type: "log"` (append line) and `type: "done"` (close stream) event types
   - Resets `logs` + `lastIdRef` on every new connection (prevents stale state on reopen)
   - Returns `{ logs, status, isStreaming, clear }`

2. **`src/components/LogViewer/index.tsx`** *(upgraded)*
   - Accepts `logs?: LogLine[]` (structured) in addition to legacy `content?: string`
   - Level colors: info `#e6edf3`, warn `#e3b341`, error `#ff7b72`, debug `#8b949e`
   - Source prefix in blue `#79c0ff`, timestamp in `#484f58`
   - Auto-scroll: pauses when user scrolls up, shows "↓ 回到底部" floating button to resume

3. **`src/pages/ReleaseDetail/BuildLogDrawer`** *(rewritten)*
   - Removed polling (`setInterval`) implementation
   - Uses `useLogStream` + `LogViewer` for live SSE display
   - Props: `totalRounds` (from `release.buildRound`) — renders a round selector dropdown
   - Default: latest round; switching rounds clears logs and reconnects SSE with new `buildRound` param
   - `totalRounds` update triggers auto-jump to latest round

4. **`src/service/api/release.ts`**
   - `ReleaseRecord` added `buildRound?: number`

5. **`src/constants/api.ts`**
   - Added `LOG_STREAM` path constant

6. **`vite.config.ts` + `tsconfig.app.json`**
   - Added `@hooks` alias → `src/hooks/`

### Bug Fixes (in order)

| # | Commit | Bug | Root Cause | Fix |
|---|--------|-----|-----------|-----|
| 1 | `a20e641` | Logs not displayed | `ev.event` check was too strict; assumed NestJS maps `type` to SSE `event:` field | Relaxed to also accept empty `ev.event`, check `outer.type` instead |
| 2 | `2da3d1c` | Still not displayed after fix 1 | **Double serialization**: NestJS `@Sse` JSON-stringifies the entire `MessageEvent` object into `data:` field; `toLogEvent()` also pre-stringifies `data`; wire format is `data: '{"type":"log","data":"{...}"}'` — two `JSON.parse()` calls needed | Parse `ev.data` → `{ type, data: string }` then parse `outer.data` → `LogLine` |
| 3 | `2c08b5e` | Reopening drawer shows stale/all logs | `BuildLogDrawer` component persists (Drawer `destroyOnClose` only destroys DOM); on reopen `logs` state and `lastIdRef` are stale; SSE reconnected with `?lastId=xxx` fetching only incremental data | Reset `logs` and `lastIdRef` at the start of every `useEffect` connection |

### Git Commits

| Hash | Message |
|------|---------|
| `0077c25` | feat: SSE real-time log stream - useLogStream hook, upgrade LogViewer, wire BuildLogDrawer |
| `a20e641` | fix: parse SSE log event correctly - remove NestJS data wrapper assumption |
| `2da3d1c` | fix: double-parse SSE data - NestJS wraps MessageEvent as JSON, inner data also pre-serialized |
| `0ec0ba0` | feat: buildRound support - per-round log filter in useLogStream, round selector in BuildLogDrawer |
| `2c08b5e` | fix: reset logs and lastIdRef on each new SSE connection to prevent stale state |

### Key Technical Notes

**NestJS `@Sse` double-serialization** — When a controller returns `{ type: 'log', data: JSON.stringify(obj) }`, the framework JSON-stringifies the entire object again for the SSE `data:` field. Wire format:
```
data: {"type":"log","data":"{\"id\":\"...\",\"level\":\"info\",\"message\":\"...\"}"}
```
Frontend must call `JSON.parse` twice. Additionally `ev.event` is always `""` — event type must be read from `outer.type`.

### Status

[OK] **Completed**

### Next Steps

- Upgrade `DeployDrawer` log section from one-shot `getDeploymentLogs` to SSE (P2)
- Add log level filter UI to `LogViewer` (P2)



## Session 2: 取消构建后支持重新构建

**Date**: 2026-05-13
**Task**: 取消构建后支持重新构建
**Branch**: `main`

### Summary

修复 Release 详情页在 cancelled 状态下无法重新构建的问题，拆分 cancelled 与 archived 门控，并同步前端状态机规范与任务 PRD。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `0423783` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete
