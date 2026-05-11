# PRD：Release 状态机前端适配

> 日期：2026-05-11 | 任务：`05-11-release-state-transition-frontend`

## 背景

后端 `aoko-devops` 调整了 Release 状态机：

- `BUILD_SUCCESS` 可以重新进入 `BUILDING`。
- `TEST_SUCCESS` 可以重新进入 `BUILDING`。
- `READY` 可以回退到 `BUILD_SUCCESS`。
- `READY` 可以直接重新进入 `BUILDING`。
- 新增接口 `POST /release/unready/:id`，用于取消就绪。
- `TEST_SUCCESS` 可重新构建，也可标记为就绪。
- `READY` 不再直接取消，应先取消就绪或重新构建。

当前前端 `ReleaseDetail` 仅允许 `draft / pending / build_failed` 触发构建，仅允许 `build_success` 标记就绪，缺少“取消就绪”入口。

## 目标

- 补充 `RELEASE_UNREADY` API 路径与 `markReleaseNotReady` 请求函数。
- 更新 Release 详情页操作可用性，支持后端新增状态转换。
- 在 `ready` 状态展示“取消就绪”入口，回退到 `build_success` 后可继续调整构建与重新标记就绪。
- `ready / build_success / test_success / build_failed / draft / pending` 都可以触发构建；构建中与终态不可重复操作。
- 前端取消按钮仅在后端允许取消的状态展示可用，避免无效请求。

## 非目标

- 不调整部署状态机。
- 不新增测试阶段 UI。
- 不改后端状态值与枚举命名。

## 验收标准

- [ ] Release 详情页 `ready` 状态可点击“取消就绪”。
- [ ] Release 详情页 `ready` 状态可直接“重新构建”。
- [ ] Release 详情页 `build_success` 与 `test_success` 可重新构建。
- [ ] Release 详情页 `test_success` 可标记就绪。
- [ ] Release 详情页 `ready` 状态不可直接取消迭代。
- [ ] API 类型与路径完整，TypeScript 构建通过。
