---
name: request-init
description: Initializes API request layer with umi-request, configures Vite proxy to avoid CORS, and auto-injects auth token. Use when initializing request wrappers, setting API base prefix, or configuring token handling for new pages/services.
---

# Request Init

## 目标
- 统一请求封装（`umi-request`）
- 配置 Vite 代理避免跨域
- 自动注入 token，并保留 token 失效处理钩子

## 适用场景
- 初始化请求封装
- 新增页面/模块需要 API 请求层
- 需要统一 token 注入与失效处理

## 约定（默认）
- API 前缀：`/aoko-devops`
- 代理目标：`http://localhost:3001`
- token 存储：`localStorage`，key 为 `aoko_devops_token`
- token 失效：保留 `onTokenInvalid()` 空函数

## 实施步骤
1. 确认已安装 `umi-request`（如未安装，使用包管理器添加依赖）。
2. 在 `src/service/request.ts` 初始化 `request` 函数并配置拦截器。
3. 在 `vite.config.ts` 配置代理，转发 `/aoko-devops` 到后端地址。
4. 确认所有 API 请求统一使用 `request`。

## 模版代码

### `src/service/request.ts`
```ts
import { extend } from "umi-request";

const TOKEN_STORAGE_KEY = "aoko_devops_token";

function onTokenInvalid() {
  // TODO: token 失效处理（后续按业务实现）
}

export const request = extend({
  prefix: "/aoko-devops",
  timeout: 10000,
});

request.interceptors.request.use((url, options) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return {
    url,
    options: {
      ...options,
      headers,
    },
  };
});

request.interceptors.response.use(async (response) => {
  if (response.status === 401) {
    onTokenInvalid();
  }
  return response;
});
```

### `vite.config.ts`
```ts
export default defineConfig({
  // ...
  server: {
    proxy: {
      "/aoko-devops": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
```

## 注意事项
- 若后端地址或前缀变更，需同步更新 `prefix` 与代理配置。
- `onTokenInvalid()` 保持为空即可，具体逻辑按业务实现。
