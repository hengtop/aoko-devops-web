---
name: create-utils-function
description: Create or update TypeScript utility functions in src/utils, including adding new files or appending to existing ones, and wiring them through src/utils/index.ts.
source: https://fiture.feishu.cn/wiki/SciEwYSMfibFSbkfDbNcatD5nMb
synced_by: external-skill-loader
---

# create-utils-function

Create or update TypeScript utility functions in `src/utils`, including adding new files or appending to existing ones, and wiring them through `src/utils/index.ts`. Use when the user wants to create or modify a reusable tool/helper function.

## 创建工具函数（TypeScript Utils）

### 适用场景

当用户有“创建工具函数 / 工具方法 / helper / util”意图时，使用本 Skill。目标是根据用户指令，在 `src/utils/` 下创建或更新 TypeScript 工具函数，并统一在 `src/utils/index.ts` 中导入导出。

### 基本约定

- 语言：一律使用 TypeScript（`.ts`）
- 位置：所有工具函数文件位于 `src/utils/` 目录下
- 导出方式：
  - 默认所有工具函数都需要 `export`，以命名导出为主
  - 如用户明确要求默认导出，再使用 `export default`，并在 `index.ts` 做对应处理
- 汇总文件：`src/utils/index.ts` 统一做导入与导出，不在其他地方做 utils 聚合

### 交互与决策流程

当用户想创建或修改工具函数时，按以下步骤决策并补充信息：

1. 确认操作类型
   - 新建单独文件中的工具函数
   - 在已有文件中新增工具函数
2. 确认文件信息
   - 新建文件：
     - 文件名使用小写 kebab-case，例如 `date-format.ts`、`array-helpers.ts`
     - 路径为 `src/utils/<file-name>.ts`
   - 已有文件追加：
     - 让用户指定已有文件（如 `src/utils/tools.ts`），或通过上下文自动识别
3. 确认函数信息
   - 函数名使用 camelCase
   - 明确函数用途
   - 明确输入参数、可选参数、默认值
   - 明确返回值类型
   - 确认同名函数是否已存在
4. 导出策略
   - 默认使用命名导出：`export function foo(...) { ... }`
   - 如用户要求默认导出：`export default function foo(...) { ... }`
   - 在 `src/utils/index.ts` 中保持与文件内一致的导出方式

### 实现步骤

#### 1. 选择或创建目标文件

- 若用户指定“单独文件”：
  - 目标文件为 `src/utils/<user-defined-name>.ts`
  - 如果文件不存在则创建
  - 如果文件已存在则提示会在该文件中追加函数
- 若用户指定“已有文件”：
  - 目标文件为用户给出的路径，需保证在 `src/utils/` 下
  - 如果文件不存在，与用户确认是新建还是更正路径

#### 2. 在目标文件中插入或追加函数

编写函数时遵循：

- 使用 TypeScript 类型标注，尽量精确
- 保持与文件现有导出风格一致
- 追加函数时注意缩进、空行与现有代码风格

示例：

```ts
export function exampleUtil(
  param: string,
  options?: { flag?: boolean },
): number {
  // 实现逻辑
  return 0;
}
```

#### 3. 更新 `src/utils/index.ts`

始终保证新建或追加的工具函数在 `index.ts` 中被正确导出：

1. 导入新函数
   - 命名导出：`import { exampleUtil } from './example-util';`
   - 默认导出：`import exampleUtil from './example-util';`
2. 统一导出
   - 通常使用命名导出的聚合形式：`export { exampleUtil, anotherUtil };`
   - 如已有默认导出约定，保持与现有写法一致
3. 保持整洁
   - 避免重复导入或导出
   - 按字母顺序或项目约定顺序整理导出列表

#### 4. 类型与错误处理

- 尽量使用具体类型，避免 `any`
- 对外暴露的工具函数需要明确边界条件和异常场景
- 如内部会抛错，需在说明中标明，或使用合理的返回值约定

### 使用示例

#### 场景 1：创建新的日期格式化工具

用户意图：

> 帮我创建一个日期格式化的工具函数，用于把时间戳转成 `YYYY-MM-DD` 字符串，单独一个文件。

Agent 处理流程：

1. 选择“单独文件”方案，命名为 `date-format.ts`，路径 `src/utils/date-format.ts`
2. 在文件中创建命名导出的函数
3. 更新 `src/utils/index.ts`

```ts
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
```

#### 场景 2：在已有工具文件追加函数

用户意图：

> 在现有的 `src/utils/tools.ts` 里加一个 `isEmptyObject` 工具函数，导出出去。

Agent 处理流程：

1. 打开 `src/utils/tools.ts`，确认文件存在并遵循当前导出风格
2. 追加函数
3. 确认 `src/utils/index.ts` 已按项目约定导出

```ts
export function isEmptyObject(
  value: unknown,
): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  return Object.keys(value as Record<string, unknown>).length === 0;
}
```

### 质量检查清单

- [ ] 文件路径位于 `src/utils/` 下，扩展名为 `.ts`
- [ ] 函数名语义清晰，使用 `camelCase`
- [ ] 所有导出的函数都带有明确的 TypeScript 类型标注
- [ ] 没有使用不必要的 `any`
- [ ] `src/utils/index.ts` 中已更新导入与导出
- [ ] 没有重复导入或导出同一函数
- [ ] 新增代码风格与项目规则一致
- [ ] TypeScript 类型定义完善且正确
