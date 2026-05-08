# Journal - topzhang (Part 1)

> AI development session journal
> Started: 2026-04-29

---

## Session 1 — 2026-05-07: Bootstrap Frontend Guidelines

**Task**: `00-bootstrap-guidelines`  
**Summary**: 阅读项目代码，归纳并填写了 `.trellis/spec/frontend/` 下的全部 6 个规范文件。

### 完成内容

- `directory-structure.md` — 记录了项目目录结构、命名规范、路径别名、环境配置
- `component-guidelines.md` — 记录了组件结构模式、Props 约定、CSS Modules 样式、页面组件模式、懒加载
- `hook-guidelines.md` — 记录了数据请求模式（直接调用 API + useEffect）、无集中 hooks 目录的约定
- `state-management.md` — 记录了 Zustand store 模式、状态分类（全局/本地/URL/主题）、localStorage 持久化
- `type-safety.md` — 记录了 strict 模式、`as const` 枚举、`import type` 要求、类型就近定义原则
- `quality-guidelines.md` — 记录了 ESLint 配置、禁止模式、必须模式、构建命令

### 关键发现

- 技术栈：Vite 8 + React 19 + TypeScript 5.9 + Ant Design 6 + Zustand 5
- 启用了 React Compiler（babel plugin）
- 使用 umi-request 做网络请求，有审批流拦截机制
- 不使用 React Query/SWR，数据请求在组件内通过 useEffect 完成
- Props 类型统一用 `type`（非 `interface`）

---



## Session 1: UX改造 + 仓库分支接口接入 + finish-work收尾

**Date**: 2026-05-08
**Task**: UX改造 + 仓库分支接口接入 + finish-work收尾
**Branch**: `main`

### Summary

完成 05-07-ux-improvements 任务：修复提交按钮loading(try/finally)、移除名称/code联动、产品编辑按钮补充跳转+ProductCreate改造为编辑模式、createApplication/createRelease成功后跳转详情页、AppCreate双仓库模式、迭代分支Select+commitHash回填+repositoryId透传。接入后端新增 /repository/branches 和 /repository/resolve-branch 接口。修复ESLint no-use-before-define。更新spec component-guidelines.md记录表单UX规范。

### Main Changes

(Add details)

### Git Commits

| Hash | Message |
|------|---------|
| `64d7ae4` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete
