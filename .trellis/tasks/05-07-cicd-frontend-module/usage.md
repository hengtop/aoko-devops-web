# CI/CD 模块使用说明

> 适用版本: v1.0 | 最后更新: 2026-05-07

---

## 一、模块概览

本模块实现了完整的构建部署自动化链路：

```
产品（Product）
  └─ 应用（Application）
       ├─ 迭代（Release）─── 部署（Deployment）─── 环境（Environment）
       ├─ 流水线（Pipeline）─── 流水线运行（PipelineRun）
       └─ 设置（仓库 / 凭据 / 变量）
```

---

## 二、完整操作流程

### 步骤 1：创建产品

| 入口 | 路径 |
|------|------|
| 顶部「创建项目」按钮 | `/product/create` |
| 产品列表页「新建」 | `/product` → 「新建产品」|

**必填字段**：名称、Code（自动从名称生成，可手动修改）

提交成功后自动跳转至产品详情页 `/product/:id`。

---

### 步骤 2：创建应用

在产品详情页点击「创建应用」按钮，或直接访问 `/app/create?productId=<id>`。

**必填字段**：名称、Code、所属产品、仓库地址

提交成功后跳转至应用详情页 `/app/:id`。

---

### 步骤 3：配置环境

进入**应用详情 → 环境 Tab**，点击「创建环境」：

| 字段 | 说明 |
|------|------|
| 名称 | 如 dev / test / prod |
| Code | 环境唯一标识 |
| 类型 | dev / test / staging / prod |
| 部署方式 | ssh / docker |
| 服务器 | 关联服务器 ID（多个） |

> ⚠️ 迭代详情页的「部署流程图」会自动读取已配置的环境，**请先配置环境再创建迭代**。

---

### 步骤 4：配置流水线（可选）

进入**应用详情 → 流水线 Tab**，点击「创建流水线」或访问 `/app/:id/pipelines/create`。

**阶段编排**：
- 右侧阶段编排器中可添加多个 Stage
- 每个 Stage 可包含多个 Job，选择执行类型（Shell / Docker / 部署等）
- 支持设置重试次数

流水线创建后可在「流水线详情」页手动触发运行，进入 `/pipeline-run/:runId` 查看实时日志。

---

### 步骤 5：创建迭代（Release）

进入**应用详情 → 迭代 Tab**，点击「创建迭代」或访问 `/app/:appId/releases/create`。

| 字段 | 必填 | 说明 |
|------|------|------|
| 版本号 | ✅ | 如 `v1.2.0`，支持字母/数字/点/短线 |
| 标题 | ✅ | 本次迭代的简要描述 |
| 构建分支 | ✅ | Git 分支名，如 `main`、`release/v1.2` |
| 关联仓库 | ❌ | 从已绑定仓库中选择 |
| 描述 | ❌ | 详细说明 |

---

### 步骤 6：开始构建

进入**迭代详情页** `/app/:appId/releases/:releaseId`：

- 点击顶部「**构建**」按钮触发构建流程
- 点击「**标记就绪**」将迭代标记为可部署状态
- 迭代状态：`draft → pending → building → build_success → ready`

---

### 步骤 7：发起部署

在迭代详情页的**部署流程图**中：

1. 点击目标环境卡片（如 `dev`）
2. 右侧抽屉弹出，点击「**发起部署**」
3. 系统自动创建部署记录并触发部署流程

**环境推进顺序**：`dev → test → staging → prod`（根据实际配置的环境显示）

---

### 步骤 8：查看部署日志

在部署抽屉中，历史部署记录表格点击「查看日志」，即可看到终端风格的部署日志输出。

---

### 步骤 9：流水线运行详情

访问 `/pipeline-run/:runId`：

- **左侧**：阶段列表（Step），点击可切换
- **右侧**：对应阶段的 Job 列表，点击 Job 下方显示实时日志
- 支持**取消**（运行中）和**重试**（失败/取消时）操作

---

### 步骤 10：应用设置

进入**应用详情 → 设置 Tab**，包含三个子 Tab：

| 子 Tab | 功能 |
|--------|------|
| 仓库配置 | 查看已绑定仓库列表，可编辑 |
| 凭据管理 | 管理 Git Token / SSH Key / Docker 认证等凭据（内容脱敏显示） |
| 变量管理 | 管理应用/环境/流水线级别的变量，支持加密变量（`isSecret`） |

---

## 三、页面路由一览

| 路由 | 页面 | 说明 |
|------|------|------|
| `/product` | 产品列表 | 卡片网格展示所有产品 |
| `/product/create` | 创建产品 | 表单页 |
| `/product/:id` | 产品详情 | 基本信息 + 应用列表 |
| `/app/create` | 创建应用 | 表单页，支持 `?productId=` 预填 |
| `/app/:id` | 应用详情 | 概览/迭代/流水线/环境/设置 Tabs |
| `/app/:appId/releases/create` | 创建迭代 | 表单页 |
| `/app/:appId/releases/:releaseId` | 迭代详情 | 含横向部署流程图 |
| `/app/:appId/pipelines/create` | 创建流水线 | 含阶段编排器 |
| `/app/:appId/pipelines/:pipelineId` | 流水线详情 | 含运行历史 |
| `/pipeline-run/:runId` | 流水线运行详情 | Stage + Job + 日志 |

---

## 四、状态流转说明

### Release 状态
```
draft → pending → building → build_success / build_failed
                                    ↓
                                testing → test_success / test_failed
                                              ↓
                                           ready → cancelled / archived
```

### Deployment 状态
```
pending → preparing → deploying → verifying → success / failed
                                                   ↓
                                             rolling_back → rolled_back / cancelled
```

### Pipeline Run 状态
```
created → queued → running → success / failed / canceled / timeout
```

---

## 五、注意事项

1. **tenantId** 当前硬编码为 `"default"`，多租户场景需从用户 Store 读取
2. **部署流程图**环境卡片按「创建顺序」展示，建议按 dev / test / staging / prod 顺序创建环境
3. **变量加密**：`isSecret=true` 的变量值在列表页以 `••••••••` 显示，可点击眼睛图标临时展示
4. **凭据内容**不会在列表接口返回，编辑时需重新填写
5. **流水线运行**跳转 `/pipeline-run/:runId` 需要后端返回 `id` 字段，确认 API 响应格式

---

## 六、页面布局规范（重要，防止再次出现布局问题）

### 问题背景

在本次开发过程中，部分页面（Product、ProductCreate、ProductDetail、AppCreate、AppDetail、PipelineCreate、PipelineDetail、PipelineRunDetail、ReleaseCreate、ReleaseDetail）采用了 `flex + margin-left: 220px` 的方式实现侧边菜单布局，导致：

- 菜单与内容区错位
- 页面宽度异常（内容区溢出或收缩）
- 与项目其他页面视觉风格不一致

### 正确的布局模式

所有控制台主页面必须采用以下结构，**严禁使用 `flex + margin-left` 方式**：

**TSX 结构：**
```tsx
<div className={styles.layout}>        {/* 外层容器：flex column */}
  <div className={styles.body}>        {/* grid 双列容器 */}
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>菜单</div>
      <AppConsoleMenu />
    </aside>
    <main className={styles.main}>     {/* 主内容区，min-width: 0 防止溢出 */}
      {/* 页面内容 */}
    </main>
  </div>
  <AppFooter />
</div>
```

**LESS 样式：**
```less
.layout {
  min-height: calc(100vh - var(--app-topbar-height));
  background: var(--page-shell-bg);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
}

.body {
  flex: 1;
  display: grid;
  grid-template-columns: var(--console-sidebar-width) minmax(0, 1fr);
  gap: var(--console-gap);
  padding: var(--console-shell-padding);
  align-items: start;
}

.sidebar {
  position: sticky;
  top: calc(var(--app-topbar-height) + 18px);
  border-radius: var(--surface-radius-lg);
  padding: 18px 16px 16px;
  background: var(--surface-bg);
  border: 1px solid var(--surface-border);
  box-shadow: var(--surface-shadow-soft);
  backdrop-filter: blur(18px);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sidebarHeader {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding-inline: 6px;
}

.main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
```

> 参考实现：`src/pages/Server/`、`src/pages/Template/`、`src/pages/Configuration/`

