# PRD：应用初始化默认仓库前端适配

> 日期：2026-05-12 | 任务：`05-12-application-default-repository-frontend`

## 背景

服务端未提交改动调整了应用创建、仓库绑定和迭代创建的协作逻辑：

- `ApplicationInitializationService` 在应用保存后，会根据 `repo_url` 自动创建或更新应用默认 `source` 仓库绑定。
- 默认仓库会写入 `credentialId`、`isDefault=true`、`repositoryRole=source`，并将 `httpUrl` 归一化为不带 `.git` 的地址。
- `Repository` 新增 `isDefault` 和 `repositoryRole`，同一应用同一用途只保留一个默认仓库，旧数据缺少 `repositoryRole` 时兼容为 `source` 候选。
- Release 创建时，前端传 `repositoryId` 仍优先使用；未传时服务端会取应用默认源仓库，或兜底唯一启用源仓库；多仓库且无默认时会要求用户传 `repositoryId` 或先设置默认仓库。
- Release 记录新增持久化 `repositoryId` 字段。

## 目标

- 前端 API 类型补齐 `repo_provider_type`、`isDefault`、`repositoryRole`、Release `repositoryId`。
- 应用创建时明确传递仓库托管平台，并说明创建后会自动绑定为默认源仓库。
- 仓库配置页支持查看和编辑仓库用途、是否默认仓库。
- 迭代创建页优先选中默认源仓库；多源仓库无默认时前端先要求选择仓库，减少后端错误。
- 保持模板初始化的长耗时交互，不改无关业务流程。

## 非目标

- 不新增后端接口。
- 不改仓库凭据创建逻辑。
- 不改流水线、部署执行逻辑。
- 不重构应用创建页整体布局。

## 验收标准

- [x] 创建应用 payload 支持 `repo_provider_type`，公司默认仓库域名为 `http://git.1145161.xyz/`。
- [x] 创建应用页面说明默认源仓库会在应用创建后自动绑定，并绑定所选凭据。
- [x] 仓库 API 类型包含 `isDefault`、`repositoryRole`。
- [x] 仓库抽屉可配置仓库用途和默认仓库；列表展示默认标识和用途。
- [x] Release API 类型包含持久化 `repositoryId`。
- [x] 迭代创建页优先选择默认源仓库，旧仓库缺少 `repositoryRole` 时仍作为源仓库候选。
- [x] 多个源仓库且没有默认仓库时，迭代创建前提示用户选择仓库或先设置默认仓库。
- [x] TypeScript、定向 lint、生产构建通过。
