# PRD：环境流水线配置前端适配

> 日期：2026-05-12 | 任务：`05-12-environment-pipeline-config-frontend`

## 背景

服务端最新提交 `c5da349 feat: 环境添加流水线配置&排序` 为环境模块新增了部署流水线配置：

- `includeInDeploymentPipeline?: boolean`：该环境是否参与部署流水线。
- `promotionOrder?: number`：部署流水线执行顺序。
- 环境列表支持通过 `includeInDeploymentPipeline` 过滤。
- 环境列表默认按 `promotionOrder ASC, createdAt ASC` 排序。

默认值：

| 环境类型 | includeInDeploymentPipeline | promotionOrder |
| --- | --- | --- |
| `build` | `false` | `0` |
| `dev` | `true` | `10` |
| `test` | `true` | `20` |
| `staging` | `true` | `30` |
| `prod` | `true` | `40` |
| 其他 | `true` | `100` |

## 目标

- 前端环境 API 类型补齐新增字段。
- 应用详情的环境管理页支持配置“是否参与部署流水线”和“流水线顺序”。
- 环境列表展示该配置，帮助用户理解部署流水线顺序。
- Release 详情页部署流水线只加载 `includeInDeploymentPipeline=true` 的环境，使用服务端排序结果。

## 非目标

- 不改部署执行逻辑。
- 不改构建环境配置逻辑之外的 Release 流程。
- 不重构环境管理页面布局。
- 不修改用户已有的 `AppCreate` 未提交改动。

## 验收标准

- [x] 创建/编辑环境时可配置是否参与部署流水线。
- [x] 创建/编辑环境时可配置非负整数 `promotionOrder`。
- [x] 选择 `build` 环境类型时默认不参与部署流水线，默认顺序为 `0`。
- [x] `dev/test/staging/prod` 默认参与部署流水线，默认顺序分别为 `10/20/30/40`。
- [x] 环境列表展示流水线参与状态和顺序。
- [x] Release 详情页部署流水线只展示参与部署流水线的环境。
- [x] TypeScript 构建通过。
