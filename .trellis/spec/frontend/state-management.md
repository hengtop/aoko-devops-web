# State Management

> How state is managed in this project.

---

## Overview

- **全局状态**：Zustand（`zustand` v5）
- **本地状态**：React `useState` / `useReducer`
- **URL 状态**：`react-router-dom` v7 的 `useLocation` / `useNavigate`
- **无服务端缓存层**（不使用 React Query / SWR）

---

## State Categories

| 类型 | 方案 | 示例 |
|------|------|------|
| 认证状态 | Zustand `useAuthStore` | token、permissions |
| 全局业务状态 | Zustand `useMessageInboxStore` | 未读消息数、最近消息 |
| 页面本地状态 | `useState` | 表格数据、搜索表单、分页、loading |
| 主题状态 | React Context（`AppThemeProvider`） | dark/light 模式 |
| 路由状态 | react-router-dom | 当前路径、路由参数 |

---

## Zustand Store 模式

一个 store 一个文件，通过 `src/store/index.ts` barrel 导出：

```typescript
// src/store/auth.ts
import { create } from "zustand";

type AuthState = {
  token: string | null;
  permissions: string[];
  setToken: (token: string) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: readStoredAccessToken(),
  permissions: resolveCurrentPermissions(),
  setToken: (token) => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    set({ token });
  },
  clearAuth: () => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    set({ token: null, permissions: [] });
  },
}));
```

**特点**：
- 直接在 store 中读写 `localStorage`（初始值从 localStorage 恢复）
- action 和 state 定义在同一个 type 中
- 不使用 middleware（无 persist、devtools 等）

---

## When to Use Global State

| 场景 | 方案 |
|------|------|
| 跨页面共享且需持久化（token） | Zustand + localStorage |
| 跨页面共享不持久化（消息信箱轮询） | Zustand |
| 单页面内的表单/列表/loading | `useState` |
| 主题模式 | Context（因为需要 Provider 包裹） |

---

## Server State

- 无统一缓存策略，每次页面加载时重新请求
- 全局数据（消息数）通过 Zustand store 的 async action 刷新
- 页面数据通过组件 `useEffect` 直接请求

---

## Common Mistakes

- **避免**：为只在一个页面使用的状态创建 Zustand store
- **避免**：在 store 中存放可以从 URL 派生的状态（如当前页码）
