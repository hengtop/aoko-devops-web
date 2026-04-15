# AOKO DevOps Web

前端控制台项目，用于团队内部进行模版、配置、部署相关资源的管理与维护，服务于项目自动化创建、构建与发布场景。

## 设计上下文

### Users
- 面向 DevOps 与研发协作团队使用。
- 主要在内部控制台场景下完成模版、配置、部署等资源管理工作。

### Brand Personality
- 专业、稳定、直接。
- 界面需要传递清晰、可靠、可控的操作感，适合日常高频后台管理。

### Aesthetic Direction
- 沿用当前项目已有的深色 DevOps 控制台风格。
- 新增管理页优先与现有 `Template`、`Configuration` 页面保持同一视觉体系和交互节奏。
- 优先保证信息密度、可读性与操作效率，不做与现有风格冲突的轻佻化表达。

### Design Principles
- 新增管理页优先保持一致的侧边菜单、主内容区和右侧信息面板布局。
- 表格、筛选、弹窗表单和独立编辑页优先保证清晰、稳定、易维护。
- 长文本、长 ID、配置内容等 DevOps 场景高频信息必须优先处理溢出、预览和复制能力。
- 新页面默认与现有控制台风格对齐，避免风格漂移或重复发明交互模式。

## 技术栈

- 构建：Vite + React 19 + React Compiler
- 语言：TypeScript，`strict` 开启
- UI：Ant Design 6.x + `@ant-design/icons`
- 路由：`react-router-dom`
- 请求：`umi-request`
- 状态：`zustand`
- 样式：Less Module
- 代码高亮：`react-syntax-highlighter`

## 运行方式

- 开发：
  - `pnpm dev` 或 `pnpm dev:dev`
  - `pnpm dev:local`
  - `pnpm dev:prod`
- 构建：
  - `pnpm build` 或 `pnpm build:prod`
  - `pnpm build:dev`
  - `pnpm build:local`
- 预览：`pnpm preview`
- 校验：`pnpm lint`

## 环境变量

- `config/.env.development`：开发环境代理配置
- `config/.env.local`：本地联调代理配置
- `config/.env.production`：生产环境代理配置
- `config/.env.example`：环境变量示例文件
- 当前已使用变量：
  - `VITE_PROXY_TARGET`：Vite 开发代理目标地址

## 目录结构

- `public/`：静态资源与图标
- `src/main.tsx`：应用入口
- `src/App.tsx`：应用根组件与 antd 主题配置
- `src/pages/`：页面级组件
- `src/components/`：公共组件
- `src/router/`：路由配置与守卫
- `src/service/`：请求封装与 API 定义
- `src/store/`：状态管理
- `src/utils/`：公共工具函数与统一导出
- `src/styles/`：全局样式入口

## 当前已实现能力

### 登录与权限

- 登录、注册页面已接入。
- 统一请求层位于 `src/service/request.ts`，已支持 token 注入。
- 已实现登录失效拦截：
  - HTTP `401` 或业务态未登录时统一清理登录态。
  - 失效后只弹一次提示、只跳转一次登录页。
  - 跳转登录时保留原页面地址，登录成功后支持回跳。
- 路由守卫已启用，受保护页面在未登录时会跳转到登录页。

### 控制台页面

- `/`：首页 `Home`
- `/dashboard`：工作台页面 `Dashboard`
- `/template`：模版配置页面 `Template`
- `/configuration`：配置管理列表页 `Configuration`
- `/configuration/create`：配置新建页
- `/configuration/:id`：配置详情页
- `/configuration/:id/edit`：配置编辑页
- `/login`：登录页
- `/register`：注册页
- `/403`：无权限页

### 模版配置模块

- 已接入模版列表、新建、编辑、删除接口。
- 支持按 `name / code / repo_url` 查询。
- 支持维护 `repo_url / description / pipeline_cfg_id / publish_cfg_id`。
- 流水线配置和发布配置在列表中展示为省略态 ID。
- 鼠标移入时通过 Tooltip 查看完整配置 ID。
- 点击流水线配置或发布配置可跳转到对应配置详情页。

### 配置管理模块

- 已按后端 `configuration` 模块完成前端 CRUD 对接。
- 列表页支持按 `name / fileName / status` 查询和分页。
- 列表页展示：
  - 配置名称
  - 文件名称
  - 更新时间
  - 状态
  - 操作
- 操作区支持：
  - 详情
  - 编辑
  - 启用 / 禁用
  - 删除
- 详情页与编辑页已拆分路由：
  - 详情页为只读模式，表单项禁用
  - 编辑页用于修改名称、文件名称、扩展名和配置内容
- 扩展名支持根据文件名称推断，例如 `Dockerfile`、`.env.production`、`deploy-prod.yaml`
- 详情页支持复制格式化后的配置内容
- 返回行为：
  - 详情页优先返回上一级路由
  - 无可返回历史时兜底回配置列表

### 配置内容展示优化

- 已实现常见配置文件内容高亮与预览。
- 当前支持自动识别的常见类型包括：
  - `json`
  - `yaml / yml`
  - `toml`
  - `env / properties`
  - `ini / cfg / conf`
  - `nginx`
  - `xml / html`
  - `dockerfile`
  - `shell`
  - `sql`
  - `js / ts`
- `JSON` 内容会在预览与复制时自动格式化。
- 相关组件：
  - `src/components/ConfigCodeViewer`
  - `src/components/ConfigCodeViewer/utils.ts`

## 关键实现说明

### 路由

- 使用 `react-router-dom` 的懒加载 + `Suspense`
- 路由集中维护于 `src/router/index.tsx`
- 统一由 `RouteGuard` 做登录态访问控制

### 请求层

- 统一请求实例位于 `src/service/request.ts`
- 请求封装支持：
  - token 自动注入
  - 全局错误提示
  - 登录失效处理
  - 公共接口通过 `skipAuthFailureRedirect` 跳过登录失效跳转

### 工具函数

- `src/utils/` 用于维护公共工具函数
- 统一通过 `src/utils/index.ts` 聚合导出
- 当前已包含登录跳转与回跳相关工具

## 公共组件

- `src/components/AppTopBar`：顶栏
- `src/components/AppFooter`：底部信息区
- `src/components/AppConsoleMenu`：控制台左侧菜单
- `src/components/AppLoading`：路由懒加载时的全局加载态
- `src/components/ConfigCodeViewer`：配置内容代码高亮与格式化预览组件

## 主题说明

- 统一在 `src/App.tsx` 通过 `ConfigProvider` 启用 antd 深色主题
- 已配置基础 token：
  - `colorPrimary`
  - `colorInfo`
  - `colorBgBase`
  - `colorBgContainer`
  - `colorText`
  - `colorTextSecondary`
- 页面样式统一使用 `styles.module.less`

## 后续约定

- 新增页面优先放在 `src/pages/`
- 新增 API 优先放在 `src/service/api/`
- 新增公共逻辑优先放在 `src/utils/` 并从 `src/utils/index.ts` 导出
- 需要保持 README 持续更新，反映项目真实状态，而不是初始化状态
