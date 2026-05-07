# 应用设置模块（仓库 / 凭据 / 变量）完整 CRUD — 补充 PRD

> 版本: v1.1
> 日期: 2026-05-07
> 依赖: CI/CD 主 PRD v1.0 已完成的基础设施

---

## 一、背景

当前 `TabSettings.tsx` 已实现三个子 Tab（仓库配置、凭据管理、变量管理）的**列表展示**，但缺少以下交互：

1. **新增/编辑表单**（Drawer 抽屉方式）
2. **删除确认 + 实际删除请求**
3. **刷新列表**（操作后自动刷新）
4. **表单校验与错误提示**
5. **仓库详情 / Webhook 事件查看**

---

## 二、功能需求

### 2.1 仓库管理（Repository）

#### 2.1.1 绑定仓库（Drawer）

**触发**: 点击「绑定仓库」按钮

**表单字段**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 仓库名称 | Input | ✅ | 仓库显示名（如 `user-service`） |
| 代码托管平台 | Select | ✅ | `gitlab` / `github` / `gitee` / `self-hosted` |
| 仓库地址（HTTPS） | Input | ✅ | `https://github.com/org/repo.git` |
| SSH 地址 | Input | ❌ | `git@github.com:org/repo.git` |
| 默认分支 | Input | ✅ | 默认 `main` |
| 认证方式 | Select | ✅ | `token` / `ssh_key` |
| 关联凭据 | Select | ❌ | 从当前应用凭据列表中选择（筛选对应 type） |
| Webhook Secret | Input | ❌ | 用于验证 Webhook 签名 |

**交互**:
- 提交调用 `POST /repository/create`，`applicationId` 自动带入
- 成功后关闭 Drawer，自动刷新列表
- 错误信息展示在表单顶部 Alert 或具体字段下方

#### 2.1.2 编辑仓库（Drawer）

**触发**: 列表操作列「编辑」按钮

- 复用绑定仓库的 Drawer，回填当前数据
- 提交调用 `POST /repository/update`

#### 2.1.3 删除仓库

**触发**: 列表操作列「删除」按钮

- Popconfirm 确认："删除后无法恢复，确认删除该仓库绑定？"
- 确认后调用 `POST /repository/delete`
- 成功后自动刷新列表

#### 2.1.4 查看 Webhook 事件（Drawer 或 Modal）

**触发**: 列表操作列「Webhook」按钮

- 调用 `POST /repository/webhook-events`，展示事件列表
- 字段：事件类型、Ref（分支/Tag）、Commit SHA、处理状态、时间

---

### 2.2 凭据管理（Credential）

#### 2.2.1 新增凭据（Drawer）

**触发**: 点击「新增凭据」按钮

**表单字段**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 凭据名称 | Input | ✅ | 如 `gitlab-deploy-token` |
| 凭据类型 | Select | ✅ | `git_token` / `ssh_key` / `docker_auth` / `kubeconfig` / `password` |
| 凭据内容 | TextArea / Password | ✅ | 根据类型展示不同输入控件：Token 用 Password 输入框，SSH Key 用 TextArea |
| 额外配置 | JSON Editor | ❌ | 类型为 `docker_auth` 时需填写 registry 等 |
| 描述 | TextArea | ❌ | 凭据用途说明 |

**联动逻辑**:
- 当 `type = git_token` → 内容输入框 placeholder: "请输入 Personal Access Token"
- 当 `type = ssh_key` → 内容输入框变为多行 TextArea，placeholder: "粘贴 SSH 私钥"
- 当 `type = docker_auth` → 显示额外配置字段（registry / username）
- 当 `type = kubeconfig` → 内容为 YAML 格式，可考虑代码编辑器
- 当 `type = password` → 显示用户名 + 密码两个字段

**交互**:
- 提交调用 `POST /credential/create`，`applicationId` 自动带入
- 成功后关闭 Drawer，自动刷新列表
- **凭据内容在列表中不展示**（后端不会返回 content 字段）

#### 2.2.2 编辑凭据（Drawer）

- 复用新增凭据 Drawer
- 回填除 `content` 外的字段
- `content` 字段显示占位提示："如需更新凭据内容请重新填写，留空则保持不变"
- 提交调用 `POST /credential/update`

#### 2.2.3 删除凭据

- Popconfirm 确认："删除后关联的仓库绑定可能失效，确认删除？"
- 确认后调用 `POST /credential/delete`
- 成功后自动刷新列表

---

### 2.3 变量管理（Variable）

#### 2.3.1 新增变量（Drawer）

**触发**: 点击「新增变量」按钮

**表单字段**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| 变量名（Key） | Input | ✅ | 大写 + 下划线格式，如 `DATABASE_URL` |
| 变量值（Value） | Input / TextArea | ✅ | 普通变量用 Input，加密变量用 Password |
| 作用域类型 | Select | ✅ | `application`（应用级）/ `environment`（环境级）/ `pipeline`（流水线级） |
| 关联环境 | Select | 条件必填 | 当 scopeType = `environment` 时必填，从应用环境列表选择 |
| 关联流水线 | Select | 条件必填 | 当 scopeType = `pipeline` 时必填，从应用流水线列表选择 |
| 是否加密 | Switch | ❌ | 默认关闭，开启后 Value 输入框切换为 Password 模式 |
| 描述 | Input | ❌ | 变量用途说明 |

**联动逻辑**:
- `scopeType = application`：隐藏关联环境、关联流水线
- `scopeType = environment`：显示关联环境 Select，隐藏关联流水线
- `scopeType = pipeline`：显示关联流水线 Select，隐藏关联环境
- `isSecret = true` 时：Value 输入框切换为 `Input.Password`

**校验规则**:
- Key: `/^[A-Z_][A-Z0-9_]*$/`，提示 "变量名仅支持大写字母、数字和下划线"
- Value: 不能为空

#### 2.3.2 编辑变量（Drawer）

- 复用新增变量 Drawer，回填所有字段
- 加密变量的 Value 显示为 `••••••••`，编辑时需重新输入
- 提交调用 `POST /variable/update`

#### 2.3.3 删除变量

- Popconfirm 确认："确认删除变量 `{key}`？删除后可能影响构建和部署流程。"
- 确认后调用 `POST /variable/delete`
- 成功后自动刷新列表

#### 2.3.4 列表增强

- 支持按 `scopeType` 筛选（Tab 或 Select）
- 加密变量值默认显示 `••••••••`，点击眼睛图标临时展示（已实现）
- 支持按 Key 搜索

---

## 三、组件设计

### 3.1 `RepositoryDrawer` 组件

```typescript
interface RepositoryDrawerProps {
  open: boolean;
  appId: string;
  editRecord?: RepositoryRecord | null; // null = 新增模式
  onClose: () => void;
  onSuccess: () => void; // 操作成功后回调（刷新列表）
}
```

### 3.2 `CredentialDrawer` 组件

```typescript
interface CredentialDrawerProps {
  open: boolean;
  appId: string;
  editRecord?: CredentialRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}
```

### 3.3 `VariableDrawer` 组件

```typescript
interface VariableDrawerProps {
  open: boolean;
  appId: string;
  editRecord?: VariableRecord | null;
  environments: EnvironmentRecord[]; // 用于 scopeType=environment 时的 Select
  pipelines: PipelineRecord[];       // 用于 scopeType=pipeline 时的 Select
  onClose: () => void;
  onSuccess: () => void;
}
```

### 3.4 `WebhookEventsModal` 组件

```typescript
interface WebhookEventsModalProps {
  open: boolean;
  repositoryId: string;
  onClose: () => void;
}
```

---

## 四、实施步骤

### Phase 1：仓库管理 CRUD

1. 创建 `src/pages/AppDetail/RepositoryDrawer.tsx`
2. 创建 `src/pages/AppDetail/WebhookEventsModal.tsx`
3. 更新 `TabSettings.tsx` 中 `RepositoriesTab`：
   - 绑定 Drawer 的 open/close 逻辑
   - 编辑按钮传入 editRecord
   - 删除按钮绑定实际 API
   - 添加 Webhook 按钮

### Phase 2：凭据管理 CRUD

4. 创建 `src/pages/AppDetail/CredentialDrawer.tsx`
5. 更新 `TabSettings.tsx` 中 `CredentialsTab`：
   - 绑定 Drawer
   - 删除绑定实际 API
   - 类型联动展示

### Phase 3：变量管理 CRUD

6. 创建 `src/pages/AppDetail/VariableDrawer.tsx`
7. 更新 `TabSettings.tsx` 中 `VariablesTab`：
   - 绑定 Drawer
   - 删除绑定实际 API
   - scopeType 筛选
   - Key 搜索

### Phase 4：联调验证

8. 整体联调测试
9. 补充 usage.md 中的操作说明

---

## 五、API 调用汇总

| 操作 | 接口 | 已有 Service |
|------|------|:---:|
| 绑定仓库 | `POST /repository/create` | ✅ `createRepository` |
| 仓库列表 | `POST /repository/list` | ✅ `listRepositories` |
| 仓库详情 | `POST /repository/detail` | ✅ `getRepositoryDetail` |
| 编辑仓库 | `POST /repository/update` | ✅ `updateRepository` |
| 删除仓库 | `POST /repository/delete` | ✅ `deleteRepository` |
| Webhook 事件 | `POST /repository/webhook-events` | ✅ `listWebhookEvents` |
| 新增凭据 | `POST /credential/create` | ✅ `createCredential` |
| 凭据列表 | `POST /credential/list` | ✅ `listCredentials` |
| 编辑凭据 | `POST /credential/update` | ✅ `updateCredential` |
| 删除凭据 | `POST /credential/delete` | ✅ `deleteCredential` |
| 新增变量 | `POST /variable/create` | ✅ `createVariable` |
| 变量列表 | `POST /variable/list` | ✅ `listVariables` |
| 编辑变量 | `POST /variable/update` | ✅ `updateVariable` |
| 删除变量 | `POST /variable/delete` | ✅ `deleteVariable` |

> 所有 API Service 函数已在 `src/service/api/repository.ts`、`credential.ts`、`variable.ts` 中实现，无需新增 Service 文件。

---

## 六、交互规范

1. **抽屉宽度**: 560px（表单类抽屉统一宽度）
2. **表单布局**: `layout="vertical"`，`requiredMark={false}`
3. **操作按钮**: 抽屉底部固定，左对齐：「确定」（Primary）+「取消」
4. **删除确认**: 使用 `Popconfirm` 组件，描述包含被删除对象名称
5. **成功提示**: `message.success("操作成功")`
6. **错误处理**: 接口错误通过 `message.error` 展示，表单校验错误展示在字段下方
7. **布局一致性**: 所有内容在 `TabSettings` 内部渲染，不需要独立页面和侧边栏

---

## 七、注意事项

1. **凭据安全**: content 字段仅在创建/编辑时传给后端，列表和详情接口不会返回 content 明文
2. **变量加密**: `isSecret=true` 的变量在列表中显示为 `••••••••`，前端通过 state 控制临时显示
3. **级联删除提醒**: 删除仓库时提醒可能影响流水线触发，删除凭据时提醒可能影响仓库认证
4. **表单联动**: 凭据类型切换时需清空已填内容字段，避免格式混淆
5. **环境/流水线列表预加载**: VariableDrawer 打开时需提前拉取环境和流水线列表用于 Select 选项
