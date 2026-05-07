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

(To be filled by the team)
