# Quality Guidelines

> Code quality standards for frontend development.

---

## Overview

- Linter：**ESLint 9**（flat config）
- TypeScript：strict 模式
- 构建编译器：React Compiler（babel plugin）
- 测试：目前项目中有 `src/tests/` 和 `tests/` 目录，但测试覆盖度较低

---

## ESLint Rules

- `@eslint/js` recommended
- `typescript-eslint` recommended
- `eslint-plugin-react-hooks`（recommended）
- `eslint-plugin-react-refresh`（vite preset）
- 忽略 `dist/` 目录

运行命令：`pnpm lint`

---

## Forbidden Patterns

| 模式 | 原因 |
|------|------|
| `any` 类型 | TypeScript strict 禁止 |
| 未使用的变量/参数 | `noUnusedLocals` + `noUnusedParameters` |
| 直接修改 state | Zustand 要求用 `set()` |
| `console.log` 残留 | 生产代码不应有调试日志 |
| CSS 内联样式 | 使用 CSS Modules |
| 集中 barrel 导出非公共 API | 各模块自己 barrel，不创建 `src/index.ts` |

---

## Required Patterns

| 模式 | 说明 |
|------|------|
| `import type` | `verbatimModuleSyntax` 强制 |
| 路径别名 `@xxx` | 跨目录引用必须用别名 |
| CSS Modules | 组件样式必须用 `styles.module.less` |
| default export | 页面组件使用 default export（配合 `React.lazy`） |
| named export | 共享组件和工具函数使用 named export |

---

## Build & Scripts

| 命令 | 用途 |
|------|------|
| `pnpm dev` | 本地开发（development 模式） |
| `pnpm dev:local` | 本地开发（local 模式） |
| `pnpm build` | 生产构建（tsc + vite build） |
| `pnpm lint` | ESLint 检查 |

---

## Code Review Checklist

- [ ] 类型是否正确使用（无 `any`，使用 `import type`）
- [ ] 路径别名是否正确使用
- [ ] 样式是否使用 CSS Modules
- [ ] 新页面是否 lazy load
- [ ] API 函数是否返回 `ApiPromise<T>` 类型
- [ ] 常量是否放在 `@constants` 而非硬编码
