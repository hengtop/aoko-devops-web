# PRD：应用创建关联模板前端交互设计与开发

> 日期：2026-05-11 | 任务：`05-11-app-create-template-association`

## 背景

后端 `aoko-devops` 已补充应用创建时关联模板并初始化目标仓库的能力。创建应用时如果传入 `template_id`，后端会在 `POST /application/create` 内同步执行模板仓库 clone、目标仓库 init、commit、push 等流程；任一步失败则应用不会保存。

当前前端 `AppCreate` 已有“自动创建默认仓库 / 使用已有仓库”两种仓库配置方式，但没有模板选择、目标仓库凭据、初始化分支和初始化提交信息等字段，也没有针对 Git 初始化长耗时的等待提示。

## 目标

- 在创建应用页面支持选择应用模板，并向后端传递模板初始化相关字段。
- 在模板配置页支持维护模板来源分支与模板仓库凭据。
- 设计明确的异步等待交互：让用户知道提交后正在创建应用并初始化仓库，不要误以为页面卡住。
- 成功后稳定跳转到应用详情页。由于后端创建接口成功时不返回应用数据，前端需按应用 `code` 查询详情后跳转。
- 失败时展示后端返回的受控错误，例如模板不存在、目标仓库非空、clone/push 失败。
- 补充本前端项目的中文环境 skill 约束，后续 PRD、总结和交互文案默认使用简体中文。

## 非目标

- 不在前端创建远程 Git 仓库，目标仓库仍由用户提前准备。
- 不做模板变量渲染配置，模板文件按后端能力原样复制。
- 不实现初始化日志流或后台任务状态轮询；当前后端为同步接口。
- 不重构模板管理、凭据管理或仓库管理模块的大范围结构。

## 后端契约

### `POST /application/create`

新增/确认字段：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `template_id` | 否 | 选择的模板 ID，不传则沿用普通创建流程 |
| `repo_default_branch` | 否 | 目标仓库初始化分支，默认 `main` |
| `repo_credential_id` | 否 | 目标仓库 push 凭据 ID |
| `template_init_message` | 否 | 首次初始化提交信息 |

后端同步流程：

1. 校验模板存在。
2. 检查目标仓库目标分支是否为空。
3. clone 模板仓库。
4. 删除模板 `.git` 后重新初始化目标仓库。
5. commit 并 push 到目标仓库。
6. 初始化成功后保存应用并初始化权限。

前端影响：

- 提交按钮 loading 可能持续较久，需要更强的页面级等待反馈。
- 全局请求默认超时为 10 秒，模板初始化请求需单独放宽超时时间。
- 成功响应 `data` 可能为空，不能依赖 `res.data.id`。
- 失败响应消息应直接暴露给用户，帮助定位 Git 初始化问题。

### `POST /template/list`

模板列表现有接口已可用于选择模板。后端模板模型新增：

| 字段 | 说明 |
| --- | --- |
| `repo_default_branch` | 模板来源分支 |
| `repo_credential_id` | 私有模板仓库凭据 |

前端选择模板时展示模板名、编码、仓库地址和来源分支。

### `POST /credential/list`

用于选择目标仓库凭据。当前凭据可按 `type` 查询；目标仓库初始化优先展示 Git/Token 类凭据。如果接口枚举不足，第一版可加载当前用户可见的通用凭据并在 UI 文案中说明用途。

## 交互设计

### 表单结构

创建应用页面继续保持独立表单页与控制台侧边栏布局，表单宽度保持当前项目约定。

表单分组：

1. 基础信息
   - 所属产品线
   - 应用名称
   - 应用 Code
   - 应用描述
   - 应用架构
   - 应用等级
2. 仓库配置
   - 仓库配置方式
   - 仓库 Code 或仓库地址
   - 目标初始化分支，默认 `main`
   - 目标仓库凭据，可选
3. 模板初始化
   - 是否使用模板：默认不使用，避免破坏原流程
   - 模板选择：选择后展示模板仓库与来源分支
   - 初始化提交信息：默认 `chore: initialize application from template`

### 等待态

普通创建：

- 提交按钮显示 `创建中`。
- 页面保持当前轻量 loading。

使用模板创建：

- 提交后按钮文案显示 `初始化仓库中`。
- 表单区域展示页面级等待面板，包含 `Steps`：
  1. 校验模板与目标仓库
  2. 复制模板仓库
  3. 推送初始化提交
  4. 创建应用并跳转
- 当前后端没有细粒度进度事件，因此前端用“预估阶段”表达同步等待，不伪造真实完成百分比。
- 等待期间禁用表单，避免重复提交。

### 成功态

- 普通创建和模板创建成功后，都按 `code` 调用应用详情接口。
- 拿到 `id` 或 `_id` 后跳转 `/app/:id`。
- 如果详情查询失败或未返回 id，兜底回产品详情/上一页，并显示提示。

### 失败态

- 接口失败时取消等待态并恢复表单。
- 使用 `Alert` 在表单顶部保留最后一次错误，`message.error` 做即时提醒。
- 对后端数组消息使用中文顿号/逗号拼接。
- 目标仓库非空、模板不存在、Git push 失败等信息尽量展示后端原文。

## API 类型变更

### `ApplicationRecord`

新增：

- `repo_default_branch?: string`
- `repo_credential_id?: string`

### `CreateApplicationParams`

新增：

- `repo_default_branch?: string`
- `repo_credential_id?: string`
- `template_init_message?: string`

### `TemplateRecord`

新增：

- `repo_default_branch?: string`
- `repo_credential_id?: string`

## 实现计划

1. 补充 `.codex/skills/chinese-output/SKILL.md`，同步中文环境约束。
2. 扩展 `src/service/api/application.ts` 和 `src/service/api/template.ts` 类型。
3. 改造 `src/pages/Template/index.tsx`：
   - 模板表单支持 `repo_default_branch` 与 `repo_credential_id`。
   - 模板列表展示来源分支与凭据状态。
4. 改造 `src/pages/AppCreate/index.tsx`：
   - 加载模板列表和凭据列表。
   - 增加模板初始化、分支、凭据、提交信息字段。
   - 提交 payload 带上后端新增字段。
   - 选择模板时单独放宽创建请求超时时间。
   - 使用模板时展示等待步骤和错误 Alert。
   - 创建成功后按 `code` 查询详情再跳转。
5. 调整 `src/pages/AppCreate/styles.module.less`，补充等待面板、分组标题、模板预览等样式。
6. 运行 `pnpm build`，必要时运行 `pnpm lint`。

## 验收标准

- [ ] 不选择模板时，创建应用仍可按原流程提交。
- [ ] 模板配置页可以维护模板来源分支与私有模板仓库凭据。
- [ ] 选择模板时，请求包含 `template_id`、`repo_default_branch`、`repo_credential_id`、`template_init_message`。
- [ ] 模板初始化等待期间有明确的阶段提示，表单不会重复提交。
- [ ] 后端返回失败时，表单可恢复，错误信息可见。
- [ ] 创建成功后能稳定跳转到应用详情页，不依赖 `create` 响应返回 id。
- [ ] TypeScript 构建通过。

## 待确认问题

- 是否要把“使用模板”改成必选流程。当前按兼容策略保持可选。
- 凭据是否需要限定为某个后端枚举类型。当前优先使用现有凭据列表能力。
- 后端后续若改成异步任务，前端需要新增初始化状态轮询或日志流。
