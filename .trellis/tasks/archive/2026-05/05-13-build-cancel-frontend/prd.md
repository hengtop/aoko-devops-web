# PRD：构建中取消构建前端适配

> 日期：2026-05-13 | 任务：`build-cancel-frontend`

## 背景

服务端当前工作区改造了构建取消能力：

- `StateMachineService` 允许 `building -> cancelled`。
- `ReleaseService.cancel()` 会在取消后发出 `release.cancelled` 事件。
- `BuildListener` 收到取消事件后调用 `BuildExecutorService.requestCancel()`。
- `BuildExecutorService` 会通过 `AbortSignal` 中断当前 SSH 构建命令，并阻止后续命令、产物登记和成功/失败覆盖。

前端已有 `cancelRelease()`，但 Release 详情页没有“取消构建”的明确入口。
取消构建后，Release 会进入 `cancelled` 状态；该状态不应按归档态处理，仍需要支持用户修正配置后重新构建。

## 目标

- Release 详情页在 `building` 状态展示“取消构建”操作。
- “取消构建”复用现有 `cancelRelease(id, reason)` 接口，传入构建取消原因。
- “取消构建”仅在正在构建时展示。
- 原普通“取消迭代”不在 `building` 状态展示，避免和取消构建混淆。
- `cancelled` 状态允许展示“重新构建”，并允许继续编辑构建配置。

## 非目标

- 不新增 API 路径。
- 不修改服务端代码。
- 不调整构建日志 SSE 逻辑。
- 不改部署取消逻辑。

## 联调注意

- 服务端 `StateMachineService` 需要允许 `ReleaseStatus.CANCELLED -> ReleaseStatus.BUILDING`，否则前端放开“重新构建”后仍会被 `/release/build/:id` 状态机校验拒绝。

## 验收标准

- [x] `building` 状态展示“取消构建”按钮。
- [x] 非 `building` 状态不展示“取消构建”按钮。
- [x] 点击“取消构建”调用 `cancelRelease(releaseId, "用户取消构建")`。
- [x] 取消构建成功后刷新 Release 详情。
- [x] `cancelled` 状态展示“重新构建”，可以再次触发构建。
- [x] `cancelled` 状态不再按 `archived` 禁用构建配置。
- [x] 非构建态普通“取消迭代”逻辑保持可用。
- [x] 定向 lint、TypeScript、构建通过。
