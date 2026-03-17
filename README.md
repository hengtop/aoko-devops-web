## 项目上下文摘要（持续更新）

## 首先该项目是一个devops项目，用于团队管理项目 产品自动化创建部署构建

### 目录结构与职责
- `public/`：静态资源与图标（如 `favicon.svg`、`icons.svg`）
- `src/`：业务源码
- `src/main.tsx`：应用入口，挂载根节点并加载全局样式
- `src/App.tsx`：应用根组件
- `src/pages/`：页面级组件（当前 `Home` 示例）
- `src/router/`：路由配置（`index.tsx` 为实际路由，`index.ts` 为占位约定）
- `src/store/`：状态管理（当前为占位文件）
- `src/service/`：请求封装（当前为占位文件）
- `src/styles/`：全局样式入口（`global.less`，当前为空）

### 技术方向与规范
- 构建：Vite（`@vitejs/plugin-react`）+ React Compiler（Babel preset）
- 语言：TypeScript（`strict` 开启，TS 构建采用 `tsc -b`）
- 规范：ESLint（`@eslint/js` + `typescript-eslint` + `react-hooks` + `react-refresh`）
- 样式：支持 Less 预处理；入口样式在 `src/index.css` 与 `src/styles/global.less`

### 运行与构建
- 开发：`pnpm dev`
- 构建：`pnpm build`（先 `tsc -b` 再 `vite build`）
- 预览：`pnpm preview`

### 关键流程说明
- 路由：使用 `react-router-dom`，懒加载 + `Suspense`（见 `src/router/index.tsx`）
- 状态：默认建议 `zustand`（`src/store/index.ts` 现为占位，后续按业务落地）
- 请求：默认建议 `umi-request`（`src/service/request.ts` 现为占位，后续按业务落地）

### 约定与扩展
- 新增页面优先放在 `src/pages/`，路由集中在 `src/router/index.tsx`
- 全局样式优先放 `src/styles/global.less`，组件样式按需引入
- 后续新增能力时请同步更新本节，保持上下文一致
