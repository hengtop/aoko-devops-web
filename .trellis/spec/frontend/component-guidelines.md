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
