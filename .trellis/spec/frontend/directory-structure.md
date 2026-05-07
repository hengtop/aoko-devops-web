# Directory Structure

> How frontend code is organized in this project.

---

## Overview

本项目是一个 DevOps 管理平台前端，使用 Vite + React 19 + TypeScript + Ant Design 6 构建。采用扁平化的页面/组件分离结构。

---

## Top-level Layout

```
src/
├── App.tsx                   # 根组件（ThemeProvider + ConfigProvider + Router）
├── main.tsx                  # 入口文件
├── assets/                   # 静态资源（字体、图片）
├── components/               # 共享组件（跨页面复用）
│   └── ComponentName/
│       ├── index.tsx
│       └── styles.module.less
├── constants/                # 全局常量（路由路径、API 路径、状态枚举、标签映射等）
│   └── index.ts              # barrel 导出
├── pages/                    # 页面组件（每个路由对应一个）
│   └── PageName/
│       ├── index.tsx
│       ├── styles.module.less
│       └── shared.ts         # 页面内共享逻辑（可选）
├── router/                   # 路由配置与守卫
│   ├── index.tsx             # createBrowserRouter + RouterProvider
│   ├── ConsoleLayout.tsx     # 带顶栏的布局壳
│   ├── RouteGuard.tsx        # 认证/权限守卫
│   └── access.ts            # 权限判断逻辑
├── service/                  # 网络请求层
│   ├── request.ts            # umi-request 封装（拦截器、token 处理）
│   ├── request-approval.ts   # 审批流请求扩展
│   └── api/                  # 按资源拆分的 API 函数
│       ├── types.ts          # BaseResponse / PaginatedList 等通用类型
│       ├── auth.ts
│       ├── configuration.ts
│       ├── message.ts
│       └── ...
├── store/                    # Zustand 全局状态
│   ├── index.ts              # barrel 导出
│   ├── auth.ts               # token + permissions
│   └── messageInbox.ts       # 消息信箱
├── styles/                   # 全局样式
│   └── global.less
├── theme/                    # 主题系统（dark/light + 切换动画）
│   └── index.tsx
└── utils/                    # 工具函数
    ├── index.ts              # barrel 导出
    ├── authNavigation.ts     # 登录跳转工具
    ├── time.ts               # 时间格式化
    └── message.ts            # 消息相关工具
```

---

## Naming Conventions

| 类型 | 命名 | 示例 |
|------|------|------|
| 页面目录 | PascalCase | `pages/Configuration/` |
| 共享组件目录 | PascalCase | `components/AppTopBar/` |
| 组件入口 | `index.tsx` | `components/AppTopBar/index.tsx` |
| 样式文件 | `styles.module.less` | CSS Modules |
| 常量文件 | camelCase | `constants/routes.ts` |
| store 文件 | camelCase | `store/auth.ts` |
| API 文件 | camelCase，按资源命名 | `service/api/configuration.ts` |
| 工具文件 | camelCase | `utils/time.ts` |

---

## Path Aliases

在 `vite.config.ts` 和 `tsconfig.app.json` 中配置了路径别名：

| 别名 | 路径 |
|------|------|
| `@assets` | `src/assets` |
| `@components` | `src/components` |
| `@constants` | `src/constants` |
| `@pages` | `src/pages` |
| `@router` | `src/router` |
| `@service` | `src/service` |
| `@store` | `src/store` |
| `@styles` | `src/styles` |
| `@theme` | `src/theme` |
| `@utils` | `src/utils` |

**规则**: 跨目录引用始终使用 `@` 别名，同目录内使用相对路径。

---

## Environment Config

环境变量文件存放在 `config/` 目录下（`vite.config.ts` 中 `envDir` 指向 `config/`），支持 `local`、`development`、`production` 三种 mode。

---

## Directory Layout

```
<!-- Replace with your actual structure -->
src/
├── ...
└── ...
```

---

## Module Organization

<!-- How should new features be organized? -->

(To be filled by the team)

---

## Naming Conventions

<!-- File and folder naming rules -->

(To be filled by the team)

---

## Examples

<!-- Link to well-organized modules as examples -->

(To be filled by the team)
