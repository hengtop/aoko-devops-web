---
name: project-init-setup
description: 初始化前端项目目录结构和 Less Module 规范。适用于项目初始化/脚手架/目录结构创建、路由或状态管理初始化、Less 配置与 CI/CD 配置场景。
version: 0.0.5
last_updater: zhangheng
updateAt: 2026-03-16
---

# 项目初始化

## 快速开始
1. 扫描仓库结构（重点看 `src`、`public`、`tests`、`.github`、`package.json`）。
2. 按“初始化步骤模板”执行，路由/状态管理/服务封装/CI-CD 需先询问用户是否添加。
3. 已存在的目录或文件直接跳过，不覆盖不删除。

## 初始化步骤模板
1. **结构检查**：记录已有目录与关键文件。
2. **创建基础目录**（如不存在）：
   - `src/config`：环境变量与运行时配置
   - `src/constant`：常量与枚举定义
   - `src/service`：接口 API 定义（可选，需询问）
   - `src/router`：路由配置（可选，需询问）
   - `src/pages`：页面内容
   - `src/components`：全局公共组件
   - `src/utils`：全局公共函数
   - `src/store`：状态管理（可选，需询问）
   - `src/styles`：全局样式
   - `tests`：测试用例与执行文件
3. **路由（可选，需询问）**：
   - 询问用户是否添加路由。
   - 默认方案：使用 React 官方推荐的 `react-router` 初始化方式，路由懒加载基于 `React.lazy` + `Suspense`。
   - 需要提示用户选择：
     - 默认：`react-router`（lazy + Suspense）
     - 备选：`wouter`（更轻量）、`tanstack/router`（类型更强）
   - 若确认：创建 `src/router/index.tsx` 与 `src/pages/Home.tsx`，并按选定方案提供可运行模板。
4. **状态管理（可选，需询问）**：
   - 询问用户是否添加状态管理。
   - 默认方案：`zustand`。
   - 需要提示用户选择：
     - 默认：`zustand`
     - 备选：`@reduxjs/toolkit`（生态完善）、`jotai`（更轻量）
   - 若确认：创建 `src/store/index.ts`，按选定方案提供可运行模板。
5. **服务封装（可选，需询问）**：
   - 询问用户是否添加 API 请求封装。
   - 默认方案：`umi-request`。
   - 需要提示用户选择：
     - 默认：`umi-request`
     - 备选：`axios`（生态广）、`ky`（更轻量）
   - 若确认：创建 `src/service/request.ts`，按选定方案提供可运行模板。
6. **Less Module 规范**：
   - 组件/页面样式文件统一命名为 `styles.module.less`，与组件文件同级放置。
   - 全局样式放 `src/styles/global.less`，并在 `src/main.tsx` 引入。
   - 如果未配置 Less：安装 `less` 依赖，并在 `vite.config.ts` 增加 `css.preprocessorOptions.less`。
7. **CI/CD（可选）**：
   - 询问用户是否添加 GitHub Actions CI。
   - 若确认且 `.github/workflows` 不存在则创建基础工作流。
   - lint 规则使用项目默认配置，不额外定制。
8. **验证**：确保导入路径与目录结构无冲突，必要时更新入口文件引用。

## 目录结构检查要点
- 若已存在同名目录或文件，直接跳过。
- 若目录已存在但职责不一致，先提示用户再调整。

## 最小占位文件建议
- `src/router/index.tsx`：基于 `react-router` 的最小模板（lazy + Suspense）
- `src/pages/Home.tsx`：路由演示页面
- `src/store/index.ts`：基于 `zustand` 的最小模板
- `src/service/request.ts`：基于 `umi-request` 的最小模板
- `src/styles/global.less`：全局样式入口

## CI/CD 基础模板（GitHub Actions）
> 仅在用户确认后添加，并确保不覆盖已有配置。

```yaml
name: CI
on:
  push:
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - name: Install
        run: pnpm install --frozen-lockfile
      - name: Lint
        run: pnpm lint
      - name: Test
        run: pnpm test
```

> 如果仓库不是 `pnpm`，请按锁文件类型切换到 `npm` 或 `yarn`。

## 可选脚本
使用 `scripts/init-project.sh` 批量创建目录与模板（支持交互式提示）。脚本不会覆盖已有文件。

用法示例：
```bash
# 交互式（默认）
bash .cursor/skills/project-init-setup/scripts/init-project.sh

# 非交互（仅按参数执行）
bash .cursor/skills/project-init-setup/scripts/init-project.sh --non-interactive --with-router --with-store --with-service --with-global-less
```
