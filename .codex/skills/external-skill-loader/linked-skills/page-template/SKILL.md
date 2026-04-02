---
name: page-template
description: 根据当前项目路由定义生成或修改页面模板，自动区分 Vue3 与 React 技术栈并同步官方路由配置。
source: https://fiture.feishu.cn/wiki/F6LowFgfoiZhFQkMWsJcyv87nFh
synced_by: external-skill-loader
---

# page-template

根据当前项目路由定义生成或修改页面模板，自动区分 Vue3 与 React 技术栈并同步官方路由配置。Use when 用户提到新增页面、创建页面模版、注册路由、views/pages 页面骨架、或按页面名创建页面。

## 页面模板生成规范（Vue3 / React）

### 触发场景

在以下场景自动使用本 Skill：

- 用户提到“新增页面、创建页面模版、生成页面骨架、注册路由、按页面名创建页面”
- 用户希望在 `src/views` 或 `src/pages` 下创建新页面并同步路由
- 用户要求“根据当前项目路由定义”执行新增或修改

### 目标

根据当前项目已有路由规则，完成以下动作：

- 判断技术栈（Vue3 或 React）
- 分析路由定义风格（集中式数组、children 嵌套路由、懒加载写法、命名规则）
- 按用户页面名称创建或修改页面文件
- 在对应路由文件新增或更新路由，保持项目既有风格
- 保证新增代码为 TypeScript 风格，不使用 `any`

### 固定工作流

1. 识别技术栈
   - Vue3 标志：`vue-router`、`RouteRecordRaw`、`.vue` 页面
   - React 标志：`react-router-dom`、`RouteObject`、`.tsx` 页面
2. 定位路由入口并提取规则
   - 优先检查 `src/router/index.ts`、`src/router/index.tsx`、`src/routes/*`
   - 记录 `path` 形式、`name` 命名、`meta` 结构、是否 `children`、懒加载模式、import 别名（`~/` 或 `@/`）
3. 确认页面目标路径
   - Vue3 默认放在 `@/views/<module>/<PageName>.vue`
   - React 默认放在 `@/pages/<module>/<index.tsx|PageName.tsx>`
   - 若项目已有明确目录惯例，严格沿用现有惯例
4. 页面新增或修改
   - 新增：创建标准模板并预留业务占位
   - 修改：保持原有业务逻辑，仅做结构化补齐或路由关联修正
5. 路由新增或修改
   - 已存在同路径或同语义路由时执行更新，不重复新增
   - 不存在时按同文件风格新增路由项
   - 若使用嵌套路由，优先插入到语义最匹配的 `children` 中
6. 自检
   - 页面路径与路由 `component` 或 `element` 引用一致
   - 未破坏既有 import 顺序和代码风格
   - 无重复路由、无未使用变量、无 `any`

### Vue3 模板

页面模板（`@/views/<module>/<PageName>.vue`）：

```vue
<template>
  <div>页面</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

const initPage = async (): Promise<void> => {
  loading.value = true;
  try {
    // TODO: 初始化请求
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
});
</script>

<style lang="less" scoped>
</style>
```

路由新增模板（沿用现有风格）：

```ts
{
  path: '/example',
  name: 'examplePage',
  meta: {
    title: 'Example',
  },
  component: () => import('~/views/example/ExamplePage.vue'),
}
```

### React 模板

页面模板（`@/pages/<module>/index.tsx`）：

```tsx
import React from 'react';

export default function Example() {
  return <div>example</div>;
}
```

路由新增模板（沿用现有 `RouteObject[]` + `Suspense` 风格）：

```tsx
const Example = lazy(() => import('@/pages/example'));

{
  path: '/example',
  element: (
    <Suspense fallback={<PageLoading />}>
      <Example />
    </Suspense>
  ),
}
```

### 路由优先策略

- 先复用已有路由模块与分组，再决定新增位置
- 已有别名风格是 `~/` 就不用 `@/`，反之亦然
- 页面名转路由名时遵循项目现有大小写规则
- 子路由优先保持相对路径写法，不随意改成绝对路径

### 信息不足时必须补问

最少补问以下 4 项：

- 页面名称（英文标识）与中文标题
- 目标端（Vue3 项目还是 React 项目）
- 期望路由路径（如 `/report/detail`）
- 新增还是修改已有页面（若修改，请给现有路径）

### 当前仓库参考

用于推断，不是硬编码，需要根据实际项目来定义，不要将下列路径作为硬编码使用：

- Vue3 路由可见于 `atom-h5/src/router/index.ts`，页面目录为 `atom-h5/src/views`
- React 路由可见于 `atom-home/src/router/index.tsx`，页面目录为 `atom-home/src/pages`

执行时始终以“用户当前操作的项目”为准，不跨项目误改文件。
