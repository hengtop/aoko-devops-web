# Hook Guidelines

> How hooks are used in this project.

---

## Overview

本项目**没有大量自定义 hook**。状态逻辑主要通过 Zustand store 和组件内直接使用 React hooks 完成。

---

## Custom Hook Patterns

目前项目中的自定义 hook：

| Hook | 位置 | 用途 |
|------|------|------|
| `useAppTheme()` | `src/theme/index.tsx` | 获取当前主题模式和切换方法 |

自定义 hook 定义在使用它的模块内（如 theme 目录），而非集中的 `hooks/` 目录。

---

## Data Fetching

**不使用** React Query / SWR。数据请求模式：

1. 在组件中直接调用 `@service/api` 导出的函数
2. 使用 `useEffect` + `useState` 管理加载状态
3. 对于全局数据（如消息数），在 Zustand store 中封装异步方法

```tsx
// 典型数据加载模式 (页面组件内)
const [data, setData] = useState<Item[]>([]);
const [loading, setLoading] = useState(false);

async function fetchData() {
  setLoading(true);
  const res = await listItems(params);
  if (res.success) {
    setData(res.data?.list ?? []);
  }
  setLoading(false);
}

useEffect(() => { fetchData(); }, []);
```

---

## Naming Conventions

- Zustand store hooks：`use{Domain}Store`（如 `useAuthStore`、`useMessageInboxStore`）
- Theme hook：`useAppTheme`
- React 内置 hooks 正常使用，无额外封装

---

## Common Mistakes

- **避免**：将请求逻辑封装到自定义 hook 中（当前模式是直接在组件内调用 API 函数）
- **避免**：创建 `src/hooks/` 顶层目录（当前没有这个目录，hook 跟随所属模块）
