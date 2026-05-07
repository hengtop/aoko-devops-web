# Type Safety

> Type safety patterns in this project.

---

## Overview

- TypeScript `~5.9`，开启 **strict** 模式
- `noUnusedLocals`、`noUnusedParameters` 启用
- `verbatimModuleSyntax` 启用（必须用 `import type` 导入类型）
- Target：ES2023

---

## Type Organization

| 类型位置 | 说明 |
|---------|------|
| `src/service/api/types.ts` | 通用 API 响应类型（`BaseResponse<T>`、`PaginatedList<T>`、`ApiPromise<T>`） |
| API 文件顶部 | 每个 API 函数的 params/response 类型紧挨函数定义 |
| 组件文件顶部 | Props 类型、内部子类型定义在组件文件内 |
| `src/constants/status.ts` | 枚举值使用 `as const` 对象 + 派生类型 |
| `src/router/access.ts` | 路由权限相关类型 |

**原则**：类型就近定义，不集中到 `types/` 目录。仅通用跨模块类型放在 `service/api/types.ts`。

---

## Type Patterns

### API 类型

```typescript
// 通用响应
export interface BaseResponse<T = unknown> {
  success: boolean;
  msg: ResponseMessage;
  code: number;
  data?: T;
}

export type ApiPromise<T> = Promise<BaseResponse<T>>;

// API 函数签名
export function login(params: LoginParams, options?: ServiceRequestOptions): ApiPromise<LoginToken> { ... }
```

### 常量枚举（`as const` 模式）

```typescript
export const LOGIN_TYPES = { PASSWORD: "password", EMAIL: "email" } as const;
export type LoginType = (typeof LOGIN_TYPES)[keyof typeof LOGIN_TYPES];
```

### Props 类型

```typescript
type RouteGuardProps = PropsWithChildren<{
  access?: RouteAccess;
}>;
```

---

## Validation

- **无运行时验证库**（不使用 Zod/Yup）
- API 响应通过 TypeScript 类型断言信任后端
- 表单验证使用 Ant Design Form 的 rules

---

## Forbidden Patterns

- ❌ 使用 `any`（strict 模式下会报错）
- ❌ 使用 `interface` 定义 props（项目约定用 `type`）
- ❌ 忘记 `import type`（`verbatimModuleSyntax` 要求显式区分）
- ❌ 创建 `src/types/` 顶级目录集中管理类型
