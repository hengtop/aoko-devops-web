---
name: no-magic-strings
description: 在本项目中执行“禁止魔法字符串”规则：在完成任何代码改动前，将稳定的硬编码字符串抽取到 src/constants。适用于创建或修改 TypeScript、TSX、JavaScript、路由、请求层、store、主题或页面代码，尤其是会引入状态值、路由、API 路径、存储 key、请求头、消息 key、查询 key、模式、标签页、文案标识或其他业务常量内联字符串的场景。
---

# 禁止魔法字符串

## 目标
- 保持项目代码中不出现硬编码的业务字符串。
- 在新增字面量之前，优先复用 `src/constants` 中已有的导出。
- 当所需值尚不存在时，将新常量补充到 `src/constants`。

## 执行流程
1. 检查你即将创建或修改的文件，找出新引入的字符串字面量。
2. 只要是稳定的业务值，优先把它视为常量候选，而不是内联字符串。
3. 先确认 `src/constants` 中是否已经存在合适的常量。
4. 如果已存在，直接导入并复用。
5. 如果不存在，就把它添加到 `src/constants` 下最合适的文件中。
6. 如果当前没有合适的领域文件，就新建 `src/constants/<domain>.ts`，并在 `src/constants/index.ts` 中导出。
7. 将实现中的内联字符串替换为新的或已有的常量导出。
8. 完成前，再检查一遍改动文件，确认没有遗漏的魔法字符串。

## 常量应放在正确的文件中
- `src/constants/api.ts`: API 路径与 API 路径构造函数
- `src/constants/routes.ts`: 路由路径、查询参数 key、路由构造函数
- `src/constants/request.ts`: 请求前缀、请求头名称、内容类型、消息 key
- `src/constants/status.ts`: 状态、类型、模式、标签页、类枚举值
- `src/constants/storage.ts`: localStorage 或 sessionStorage 的 key
- `src/constants/theme.ts`: 主题模式、主题属性、固定主题标识
- `src/constants/labels.ts`: 基于常量的标签解析函数
- `src/constants/options.ts`: 基于常量生成的 UI 选项数组
- `src/constants/index.ts`: 共享常量的 barrel 导出文件

## 推荐模式

### 类枚举字符串分组
使用全大写对象，并配合 `as const`。

```ts
export const MESSAGE_READ_STATUSES = {
  UNREAD: "unread",
  READ: "read",
} as const;
```

### 从常量推导类型
如果可以从常量中推导字符串联合类型，就不要手写重复的类型定义。

```ts
export type MessageReadStatus =
  (typeof MESSAGE_READ_STATUSES)[keyof typeof MESSAGE_READ_STATUSES];
```

### 动态路由或 API 路径
在业务代码中，优先使用 builder 函数，而不是直接拼接字符串。

```ts
export function buildApprovalPolicyEditPath(policyId: string) {
  return `/approval/policy/${policyId}/edit`;
}
```

### 标签与选项
不要在页面或组件中重复写展示映射逻辑。应基于 `labels.ts` 或 `options.ts` 中的常量生成标签和选项。

## 以下值必须抽取
- 路由路径，例如 `"/login"`、`"/approval/template"`
- API 路径，例如 `"/template/create"`
- 存储 key，例如 `"aoko-theme-mode"`
- 请求相关常量，例如 `"Authorization"`、`"application/json"`
- 状态值，例如 `"approved"`、`"disable"`、`"draft"`
- 类型或模式值，例如 `"email"`、`"password"`、`"detail"`
- 标签页 key，例如 `"pending"`、`"done"`
- 查询参数 key，例如 `"redirect"`
- 消息 key，例如 `"auth-token-invalid"`
- 主题标识，例如 `"dark"`、`"light"`
- 任何使用固定字符串进行比较的重复分支条件
- 任何在多个文件中复用的固定值

## 例外情况
只有在某个字符串并非业务常量，且迁移到 `src/constants` 反而会增加噪音、降低可读性时，才允许保留为内联字面量。

常见允许保留内联的情况：
- import specifier
- 本地文件路径
- Less 或 CSS 语法
- 明显只在单页本地使用、且不会复用为状态、模式、标签映射、路由或 key 的一次性展示文案

如果某个字面量会影响行为、跳转、数据匹配、存储、请求处理、筛选或分支判断，就不要保留为内联字符串。

## 导入规则
- 如果该值已通过 `src/constants/index.ts` 导出，优先从 `@constants` 导入。
- 如果直接从 `@constants/<file>` 导入更清晰，或能避免不必要的 barrel 依赖，也可以直接按文件导入。
- 当你新增一个供复用的 constants 文件时，记得同步添加到 `src/constants/index.ts`。

## 项目示例

### 不推荐
```ts
navigate("/login");
```

### 推荐
```ts
navigate(APP_ROUTE_PATHS.LOGIN);
```

### 不推荐
```ts
localStorage.getItem("aoko-theme-mode");
```

### 推荐
```ts
localStorage.getItem(STORAGE_KEYS.THEME_MODE);
```

### 不推荐
```ts
if (record.status === "approved") {
  // ...
}
```

### 推荐
```ts
if (record.status === APPROVAL_INSTANCE_STATUSES.APPROVED) {
  // ...
}
```

### 不推荐
```ts
request.post("/template/create", {
  data: params,
});
```

### 推荐
```ts
request.post(API_PATHS.TEMPLATE_CREATE, {
  data: params,
});
```

## 完成检查清单
- 能复用已有常量时，优先复用
- 新增常量时，只放到合适的 `src/constants` 领域文件中
- 如果新常量需要广泛复用，记得更新 `src/constants/index.ts`
- 已将改动文件中的业务内联字符串替换为常量
- 标签与选项数组基于常量生成，而不是重复写字面量
