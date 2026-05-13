# Component Guidelines

> How components are built in this project.

---

## Overview

- UI 库：**Ant Design 6**（`antd`），图标使用 `@ant-design/icons`
- 样式方案：**CSS Modules + Less**（`styles.module.less`）
- React 版本：19（启用了 React Compiler via babel plugin）
- 路由：`react-router-dom` v7

---

## Component Structure

每个组件一个目录，包含 `index.tsx` 和 `styles.module.less`：

```
components/AppTopBar/
├── index.tsx          # 组件实现 + 默认导出
└── styles.module.less # 组件私有样式
```

页面组件可选地包含 `shared.ts`（页面内共享的类型/工具）：

```
pages/ApprovalInstance/
├── index.tsx
├── shared.ts
└── styles.module.less
```

---

## Props Conventions

- 使用 `type` 定义 props（非 `interface`），定义在组件文件顶部
- 组件内部的子类型（如 MenuItem）也用 `type` 定义在同文件

```tsx
// 实际代码示例 - src/components/AppConsoleMenu/index.tsx
type MenuChildItem = {
  key: string;
  label: string;
  hint: string;
};

type MenuItem = {
  key: string;
  label: string;
  hint: string;
  icon: typeof AppstoreOutlined;
  children?: MenuChildItem[];
};
```

- 带 children 的 props 使用 `PropsWithChildren`：

```tsx
// src/router/RouteGuard.tsx
type RouteGuardProps = PropsWithChildren<{
  access?: RouteAccess;
}>;
```

---

## Styling Patterns

- 使用 **CSS Modules**（`styles.module.less`）
- 导入方式：`import styles from "./styles.module.less";`
- 使用 `className={styles.xxx}` 绑定
- 动态类名拼接：`` className={`${styles.statusDot} ${styles[item.tone]}`} ``
- 全局样式仅放在 `src/styles/global.less`

---

## Page Component Pattern

页面组件通常是独立的 default export 函数组件，内部组合 Ant Design 组件 + 本地状态：

```tsx
// 典型结构
export default function Configuration() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({...});

  // 数据加载
  useEffect(() => { fetchData(); }, []);

  return (
    <>
      <AppConsoleMenu />
      {/* 页面内容 */}
      <AppFooter />
    </>
  );
}
```

---

## Lazy Loading

所有页面组件通过 `React.lazy()` 在路由配置中按需加载，用 `<Suspense fallback={<AppLoading />}>` 包裹。

---

## Common Patterns

- 页面都包含 `<AppConsoleMenu />` 侧边菜单 + `<AppFooter />` 底部
- 顶栏布局由 `ConsoleLayout`（`<AppTopBar /> + <Outlet />`）提供
- 列表页使用 Ant Design `<Table>` + `<Form>` 搜索栏 + 分页状态
- 编辑器页面命名为 `XxxEditor`，与列表页 `Xxx` 对应

<!-- Component-related mistakes your team has made -->

## Form Page UX Conventions

### 提交按钮 Loading 状态

表单提交必须用 `try/finally` 保证 loading 状态复原：

```tsx
async function handleSubmit(values: FormValues) {
  setSubmitting(true);
  try {
    const res = await someApi(values);
    if (res.success) { /* 跳转 */ }
    else { message.error(res.msg); }
  } finally {
    setSubmitting(false); // 网络异常也会执行
  }
}
```

❌ **不要这样写**（接口异常会导致按钮卡在 loading）：
```tsx
setSubmitting(true);
const res = await someApi(values);
// ... 处理结果
setSubmitting(false); // 如果上面抛异常，这行不会执行
```

### 长耗时同步提交（如模板仓库初始化）

#### 1. Scope / Trigger
- Trigger: 后端接口在一次请求内同步执行 clone、push、构建初始化、远程校验等长耗时流程。
- 典型页面：创建应用时选择模板初始化目标仓库。

#### 2. Signatures
- API 调用仍使用 `@service/api` 封装函数，第二个参数传 `ServiceRequestOptions`。
- 长耗时请求必须显式设置 `timeout`，不要沿用全局默认 10 秒。

#### 3. Contracts
- 请求字段应完整表达后端契约，例如 `template_id`、`repo_default_branch`、`repo_credential_id`、`template_init_message`。
- 成功响应可能没有 `data`；创建类页面不能假设 `res.data.id` 一定存在。
- 失败响应优先展示后端 `msg`，用于暴露 clone/push/目标仓库非空等业务错误。

#### 4. Validation & Error Matrix
- 未选择必填资源 -> Ant Design `Form.Item.rules` 阻止提交。
- 请求超时 -> 显示本地错误面板，允许用户修正后重试。
- 后端 `success=false` -> 使用 `res.msg` 填充页面级 `Alert`。
- 创建成功但未返回 id -> 按唯一字段查询详情，仍失败则跳转到上一级业务页并提示。

#### 5. Good/Base/Bad Cases
- Good: 选择模板时提交按钮显示长耗时文案，页面展示步骤提示，请求单独放宽 `timeout`。
- Base: 普通创建继续使用轻量 loading，不额外打扰。
- Bad: 只让按钮 spinning，10 秒后被全局 timeout 中断，用户不知道 clone/push 是否仍在执行。

#### 6. Tests Required
- Type-check/build 覆盖新增 payload 字段。
- 定向 lint 覆盖页面组件无未使用导入、无 `any`、无 hook 依赖问题。
- 手工联调覆盖：模板成功、目标仓库非空失败、创建成功但 `data` 为空的跳转兜底。

#### 7. Wrong vs Correct

```tsx
// ❌ Wrong: 长耗时接口沿用默认 timeout，并假设 create 返回 id
const res = await createApplication(payload);
navigate(buildAppDetailPath(res.data?.id ?? ""));

// ✅ Correct: 长耗时接口单独放宽 timeout，并在成功后查询详情
const res = await createApplication(payload, {
  timeout: 180000,
  useGlobalErrorHandler: false,
});
if (res.success) {
  const detail = await getApplicationDetail({ code: payload.code });
  navigate(buildAppDetailPath(detail.data?.id ?? detail.data?._id ?? ""));
}
```

### 应用创建默认源仓库绑定

#### 1. Scope / Trigger
- Trigger: 后端 `ApplicationInitializationService`、`RepositoryService` 或 Release 创建仓库解析逻辑变更。
- 影响页面：`src/pages/AppCreate/index.tsx`、`src/pages/AppDetail/RepositoryDrawer.tsx`、`src/pages/AppDetail/TabSettings.tsx`、`src/pages/ReleaseCreate/index.tsx`、应用/仓库/迭代 API 类型。

#### 2. Contracts
- 创建应用时，后端会在应用保存后根据 `repo_url` 自动 upsert 默认 `source` 仓库绑定。
- 创建应用 payload 需要支持 `repo_provider_type`；公司默认 Git 服务地址使用 `http://git.1145161.xyz/`。
- 自动绑定出的仓库应被视为 `isDefault=true`、`repositoryRole=source`，并绑定 `repo_credential_id` 到 `Repository.credentialId`。
- 仓库配置页需要展示和编辑 `isDefault`、`repositoryRole`。旧仓库没有 `repositoryRole` 时，前端按 `source` 处理。
- Release 创建可省略 `repositoryId` 交给后端解析默认源仓库；但如果前端已加载到默认源仓库，应主动选中它用于分支列表和清晰回显。
- 多个启用源仓库且没有默认项时，前端应先要求用户选择仓库或去设置默认仓库，避免提交后才收到后端错误。

#### 3. Good/Base/Bad Cases
- Good: 应用创建成功后用户能在仓库配置页看到默认源仓库；创建迭代时默认源仓库自动选中并加载分支。
- Base: 只有一个启用源仓库时可自动选中，兼容旧数据缺少 `repositoryRole`。
- Bad: 多仓库无默认时仍允许空 `repositoryId` 创建迭代，导致后端要求补传仓库。

#### 4. Tests Required
- 定向 lint 覆盖应用创建、仓库配置、迭代创建页面和 API 类型。
- Type-check 覆盖 `repo_provider_type`、`isDefault`、`repositoryRole`、Release `repositoryId`。
- 手工联调覆盖：新应用创建后默认源仓库绑定、凭据回填、Release 默认仓库自动选中、多源仓库无默认时前端阻断。

### Release 状态机操作门控

#### 1. Scope / Trigger
- Trigger: 后端 `StateMachineService` 修改 Release 状态转换规则，或新增 `/release/*` 状态变更接口。
- 影响页面：`src/pages/ReleaseDetail/index.tsx`、Release API 封装、状态常量。

#### 2. Signatures
- `POST /release/build/:id`：触发构建。
- `POST /release/ready/:id`：标记就绪。
- `POST /release/unready/:id`：取消就绪，回到 `build_success`。
- `POST /release/cancel/:id`：取消迭代。
- `POST /release/cancel/:id`：构建中取消构建时也复用该接口，传入构建取消原因。

#### 3. Contracts
- `build` 可从 `draft / pending / build_failed / build_success / test_success / ready` 进入 `building`。
- `ready` 可从 `build_success / test_success` 进入。
- `unready` 仅从 `ready` 回到 `build_success`。
- `cancel` 可从 `building` 进入 `cancelled`，用于取消正在运行的构建。
- `cancel` 仅在后端允许取消的非运行态展示可用；`ready` 不应直接取消。
- “取消构建”入口只在 `building` 状态展示，不要在非构建态展示。

#### 4. Validation & Error Matrix
- 缺少 `environmentId` -> 前端先提示并打开构建配置。
- 缺少 `buildConfig.buildCommands` -> 前端先提示并打开构建配置。
- 状态不允许转换 -> 前端按钮应禁用，避免把无效请求交给后端。
- 后端仍返回 `success=false` -> 展示后端 `msg`。

#### 5. Good/Base/Bad Cases
- Good: `ready` 同时支持“重新构建”和“取消就绪”，部署入口只在 `ready` 打开。
- Good: `building` 状态展示“取消构建”，并调用 `cancelRelease(releaseId, "用户取消构建")`。
- Base: `build_success` 与 `test_success` 都能“标记就绪”。
- Bad: 前端只允许 `build_failed` 重建，导致后端支持的 `ready -> building` 功能不可用。
- Bad: 非 `building` 状态展示“取消构建”，让用户误以为可以取消不存在的运行中构建。

#### 6. Tests Required
- Type-check 覆盖新增 API path/function。
- 定向 lint 覆盖 `ReleaseDetail` 操作区。
- 手工联调覆盖 `build_success` 标记就绪、`ready` 取消就绪、`ready` 重新构建。

#### 7. Wrong vs Correct

```tsx
// ❌ Wrong: 只按旧规则开放构建
const canBuild = status === "draft" || status === "pending" || status === "build_failed";

// ✅ Correct: 与服务端状态机保持一致
const canBuild = [
  "draft",
  "pending",
  "build_failed",
  "build_success",
  "test_success",
  "ready",
].includes(status);
```

### 环境部署流水线配置

#### 1. Scope / Trigger
- Trigger: 后端环境模块新增或调整 `includeInDeploymentPipeline`、`promotionOrder`、环境列表排序/过滤逻辑。
- 影响页面：`src/pages/AppDetail/TabEnvironments.tsx`、`src/pages/ReleaseDetail/index.tsx`、环境 API 类型和 `@constants/cicd`。

#### 2. Contracts
- 环境记录需要透传 `includeInDeploymentPipeline?: boolean` 和 `promotionOrder?: number`。
- 创建/编辑环境时允许配置是否参与部署流水线和非负整数顺序。
- 默认值必须与服务端保持一致：`build` 不参与部署流水线且顺序 `0`；`dev/test/staging/prod` 参与部署流水线且顺序分别为 `10/20/30/40`；未知类型兜底顺序 `100`。
- Release 详情的“部署流水线”必须通过 `listEnvironments({ includeInDeploymentPipeline: true })` 获取，由服务端负责过滤和排序。
- Release 详情如果还需要显示构建环境名称，应使用未过滤的环境列表或单独详情数据，避免 `build` 环境因默认不参与部署流水线而无法回显名称。

#### 3. Good/Base/Bad Cases
- Good: 环境管理页展示参与状态和顺序；Release 部署流只展示参与流水线的环境；构建环境名称仍能正常回显。
- Base: 旧数据缺少新增字段时，前端按服务端默认值展示。
- Bad: Release 详情复用过滤后的部署环境列表去查构建环境名称，导致构建环境显示成 ID。

#### 4. Tests Required
- 定向 lint 覆盖 `TabEnvironments`、`ReleaseDetail`、环境 API 类型和常量。
- Type-check 覆盖新增字段、表单值和请求参数。
- 手工联调覆盖 `build` 默认不参与、`dev/test/staging/prod` 默认顺序，以及 Release 部署流过滤结果。

### 创建成功后跳转

创建类页面在成功后应跳转到详情页，而非 `navigate(-1)`：

```tsx
// 创建应用 → 跳转到应用详情
const appId = res.data?.id ?? res.data?._id ?? "";
navigate(buildAppDetailPath(appId));

// 创建迭代 → 跳转到迭代详情
const releaseId = res.data?.id ?? res.data?._id ?? "";
navigate(buildReleaseDetailPath(appId, releaseId));
```

后端返回 id 字段可能是 `id` 或 `_id`（MongoDB ObjectId），始终使用 `res.data?.id ?? res.data?._id` 兼容两种写法。

### 表单字段联动

- **应用名称 → Code 自动填充**：已移除，两个字段独立输入，避免用户误改一个字段影响另一个
- **表单居中**：独立创建/编辑页的表单容器使用 `max-width: 640px; margin: 0 auto; width: 100%`
- **返回按钮**：使用 `<Button type="text" size="small" icon={<ArrowLeftOutlined />}>` 避免按钮过高

### 函数声明顺序（ESLint no-use-before-define）

在 `useEffect` 内调用的函数必须声明在 `useEffect` **之前**，否则触发 ESLint `react-hooks/immutability` 错误：

```tsx
// ✅ 正确
async function loadApps() { ... } // 先声明

useEffect(() => {
  loadApps(); // 再使用
}, [id]);
```

```tsx
// ❌ 错误 - loadApps 在 useEffect 后声明
useEffect(() => {
  loadApps(); // 访问时还未声明
}, [id]);

async function loadApps() { ... }
```
