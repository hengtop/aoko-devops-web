#!/usr/bin/env bash
set -euo pipefail

# ── 颜色 & 样式 ───────────────────────────────────────────────────────────────
RESET="\033[0m"
BOLD="\033[1m"
DIM="\033[2m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
MAGENTA="\033[0;35m"
B_GREEN="\033[1;32m"
B_CYAN="\033[1;36m"
B_YELLOW="\033[1;33m"
B_WHITE="\033[1;37m"
B_RED="\033[1;31m"

# ── 打印辅助 ──────────────────────────────────────────────────────────────────
divider() { echo -e "${DIM}  ────────────────────────────────────────────────${RESET}"; }

banner() {
  echo ""
  echo -e "${B_CYAN}  ╔═══════════════════════════════════════════════╗${RESET}"
  echo -e "${B_CYAN}  ║   🚀  Project Init Setup                      ║${RESET}"
  echo -e "${B_CYAN}  ╚═══════════════════════════════════════════════╝${RESET}"
  echo ""
}

step() {
  echo ""
  echo -e "${B_CYAN}  ┌─ Step $1 ─ $2${RESET}"
  divider
}

log_info()    { echo -e "  ${CYAN}ℹ${RESET}  $1"; }
log_ok()      { echo -e "  ${B_GREEN}✔${RESET}  $1"; }
log_skip()    { echo -e "  ${DIM}–  $1 (skipped)${RESET}"; }
log_create()  { echo -e "  ${GREEN}+${RESET}  ${BOLD}$1${RESET}"; }
log_warn()    { echo -e "  ${YELLOW}⚠${RESET}  $1"; }
log_err()     { echo -e "  ${B_RED}✖${RESET}  $1"; }

section_header() {
  echo ""
  echo -e "  ${B_WHITE}$1${RESET}"
}

# ── Usage ─────────────────────────────────────────────────────────────────────
usage() {
  cat <<'EOF'
Usage: init-project.sh [options]

Options:
  --with-router       Create src/router and router template
  --router=<name>     Router template: react-router|wouter|tanstack
  --with-store        Create src/store and store template
  --store=<name>      Store template: zustand|redux|jotai
  --with-service      Create src/service and request template
  --service=<name>    Service template: umi-request|axios|ky
  --with-global-less  Create src/styles/global.less if missing
  --non-interactive   Skip prompts and only use flags
  -h, --help          Show help
EOF
}

# ── 初始状态 ──────────────────────────────────────────────────────────────────
WITH_ROUTER=false
WITH_STORE=false
WITH_SERVICE=false
WITH_GLOBAL_LESS=false
NON_INTERACTIVE=false

ROUTER_CHOICE="react-router"
STORE_CHOICE="zustand"
SERVICE_CHOICE="umi-request"

# ── 交互函数 ──────────────────────────────────────────────────────────────────
ask_yes_no() {
  local prompt="$1"
  local default="${2:-n}"
  local answer=""
  local hint
  if [[ "$default" == "y" ]]; then hint="${B_GREEN}Y${RESET}/${DIM}n${RESET}"; else hint="${DIM}y${RESET}/${B_GREEN}N${RESET}"; fi
  while true; do
    echo -ne "  ${YELLOW}?${RESET}  $prompt [${hint}${RESET}] " >&2
    read -r answer
    answer="${answer:-$default}"
    case "$answer" in
      y|Y) return 0 ;;
      n|N) return 1 ;;
      *) log_warn "请输入 y 或 n" ;;
    esac
  done
}

choose_option() {
  local prompt="$1"
  local default="$2"
  shift 2
  local options=("$@")
  local answer=""

  # 所有展示输出走 stderr，避免被 $() 命令替换吞掉
  echo -e "  ${YELLOW}?${RESET}  ${BOLD}$prompt${RESET}" >&2
  echo "" >&2
  local i=1
  for opt in "${options[@]}"; do
    local label="${opt#*|}"
    local name="${label%%（*}"
    local desc=""
    if [[ "$label" == *"（"* ]]; then
      desc="${label#*（}"
      desc="${desc%）}"
    fi
    if [[ "$i" == "$default" ]]; then
      echo -e "    ${B_CYAN}▶  $i)${RESET}  ${BOLD}$name${RESET}  ${DIM}← 默认${RESET}" >&2
    else
      echo -e "    ${DIM}   $i)${RESET}  $name" >&2
    fi
    if [[ -n "$desc" ]]; then
      echo -e "          ${DIM}$desc${RESET}" >&2
    fi
    i=$((i + 1))
  done
  echo "" >&2
  while true; do
    echo -ne "  ${YELLOW}›${RESET}  请选择 [1-${#options[@]}]，直接回车使用默认 ($default): " >&2
    read -r answer
    answer="${answer:-$default}"
    if [[ "$answer" =~ ^[0-9]+$ ]] && (( answer >= 1 && answer <= ${#options[@]} )); then
      local value="${options[$((answer - 1))]%%|*}"
      local selected_label="${options[$((answer - 1))]#*|}"
      local selected_name="${selected_label%%（*}"
      echo -e "  ${B_GREEN}✔${RESET}  已选：${BOLD}$selected_name${RESET}" >&2
      echo "" >&2
      echo "$value"  # 唯一走 stdout 的输出，供 $() 捕获
      return 0
    fi
    echo -e "  ${YELLOW}⚠${RESET}  无效选项，请输入 1 到 ${#options[@]} 之间的数字" >&2
  done
}

# ── 文件写入 ──────────────────────────────────────────────────────────────────
write_file_if_missing() {
  local path="$1"
  local content="$2"
  if [[ ! -f "$path" ]]; then
    mkdir -p "$(dirname "$path")"
    printf "%s" "$content" > "$path"
    log_create "$path"
  else
    log_skip "$path"
  fi
}

normalize_choice() {
  local input="$1"
  case "$input" in
    react-router|wouter|tanstack|zustand|redux|jotai|umi-request|axios|ky)
      echo "$input" ;;
    *) echo "" ;;
  esac
}

# ── 检测包管理器 ──────────────────────────────────────────────────────────────
detect_pm() {
  if [[ -f "pnpm-lock.yaml" ]]; then echo "pnpm"
  elif [[ -f "yarn.lock" ]]; then echo "yarn"
  else echo "npm"
  fi
}

# ── 解析命令行参数 ─────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --with-router) WITH_ROUTER=true ;;
    --router=*)
      ROUTER_CHOICE="$(normalize_choice "${1#*=}")"
      if [[ -z "$ROUTER_CHOICE" ]]; then log_err "Invalid --router. Use: react-router|wouter|tanstack"; exit 1; fi
      WITH_ROUTER=true
      ;;
    --with-store) WITH_STORE=true ;;
    --store=*)
      STORE_CHOICE="$(normalize_choice "${1#*=}")"
      if [[ -z "$STORE_CHOICE" ]]; then log_err "Invalid --store. Use: zustand|redux|jotai"; exit 1; fi
      WITH_STORE=true
      ;;
    --with-service) WITH_SERVICE=true ;;
    --service=*)
      SERVICE_CHOICE="$(normalize_choice "${1#*=}")"
      if [[ -z "$SERVICE_CHOICE" ]]; then log_err "Invalid --service. Use: umi-request|axios|ky"; exit 1; fi
      WITH_SERVICE=true
      ;;
    --with-global-less) WITH_GLOBAL_LESS=true ;;
    --non-interactive) NON_INTERACTIVE=true ;;
    -h|--help) usage; exit 0 ;;
    *) log_err "Unknown option: $1"; usage; exit 1 ;;
  esac
  shift
done

# ══════════════════════════════════════════════════════════════════════════════
banner

ROOT="$(pwd)"
SRC="$ROOT/src"

if [[ ! -d "$SRC" ]]; then
  log_err "未找到 src 目录: $SRC"
  exit 1
fi

# ── Step 1：交互选择 ───────────────────────────────────────────────────────────
if ! $NON_INTERACTIVE; then
  step 1 "功能选择"

  # Router
  if ! $WITH_ROUTER && ask_yes_no "是否添加路由 (Router)？"; then
    WITH_ROUTER=true
    ROUTER_CHOICE="$(choose_option "选择路由方案" 1 \
      "react-router|react-router（官方推荐，支持 Data APIs，lazy + Suspense）" \
      "wouter|wouter（极致轻量，hooks-based）" \
      "tanstack|tanstack/router（类型安全，功能强大）")"
  else
    ! $WITH_ROUTER && log_skip "Router"
  fi
  echo ""

  # Store
  if ! $WITH_STORE && ask_yes_no "是否添加状态管理 (Store)？"; then
    WITH_STORE=true
    STORE_CHOICE="$(choose_option "选择状态管理方案" 1 \
      "zustand|zustand（默认推荐，极简 API）" \
      "redux|@reduxjs/toolkit（生态完善，约定驱动）" \
      "jotai|jotai（原子化，更轻量）")"
  else
    ! $WITH_STORE && log_skip "Store"
  fi
  echo ""

  # Service
  if ! $WITH_SERVICE && ask_yes_no "是否添加请求封装 (Service)？"; then
    WITH_SERVICE=true
    SERVICE_CHOICE="$(choose_option "选择请求方案" 1 \
      "umi-request|umi-request（默认，中间件风格拦截器）" \
      "axios|axios（生态广泛，拦截器完善）" \
      "ky|ky（轻量，基于 fetch 封装）")"
  else
    ! $WITH_SERVICE && log_skip "Service"
  fi
  echo ""

  # Less
  if ! $WITH_GLOBAL_LESS; then
    if ask_yes_no "是否添加 src/styles/global.less？" "y"; then
      WITH_GLOBAL_LESS=true
    else
      log_skip "global.less"
    fi
  fi
fi

# ── Step 2：汇总依赖 & 最终确认 ───────────────────────────────────────────────
PKGS=()

if $WITH_ROUTER; then
  case "$ROUTER_CHOICE" in
    react-router) PKGS+=("react-router-dom") ;;
    wouter)       PKGS+=("wouter") ;;
    tanstack)     PKGS+=("@tanstack/router") ;;
  esac
fi

if $WITH_STORE; then
  case "$STORE_CHOICE" in
    zustand) PKGS+=("zustand") ;;
    redux)   PKGS+=("@reduxjs/toolkit" "react-redux") ;;
    jotai)   PKGS+=("jotai") ;;
  esac
fi

if $WITH_SERVICE; then
  case "$SERVICE_CHOICE" in
    umi-request) PKGS+=("umi-request") ;;
    axios)       PKGS+=("axios") ;;
    ky)          PKGS+=("ky") ;;
  esac
fi

if $WITH_GLOBAL_LESS; then
  if ! grep -q '"less"' "$ROOT/package.json" 2>/dev/null; then
    PKGS+=("less")
  fi
fi

step 2 "安装确认"

PM="$(detect_pm)"
log_info "检测到包管理器：${BOLD}$PM${RESET}"
echo ""

# 汇总配置
section_header "📋  配置摘要"
echo ""
if $WITH_ROUTER;      then echo -e "    ${GREEN}✔${RESET}  Router   →  ${BOLD}$ROUTER_CHOICE${RESET}"; fi
if $WITH_STORE;       then echo -e "    ${GREEN}✔${RESET}  Store    →  ${BOLD}$STORE_CHOICE${RESET}"; fi
if $WITH_SERVICE;     then echo -e "    ${GREEN}✔${RESET}  Service  →  ${BOLD}$SERVICE_CHOICE${RESET}"; fi
if $WITH_GLOBAL_LESS; then echo -e "    ${GREEN}✔${RESET}  Styles   →  ${BOLD}global.less${RESET}"; fi
echo ""

if [[ ${#PKGS[@]} -gt 0 ]]; then
  local_pm_cmd="$PM add"
  [[ "$PM" == "npm" ]] && local_pm_cmd="npm install"
  INSTALL_CMD="$local_pm_cmd ${PKGS[*]}"

  section_header "📦  需要安装的依赖"
  echo ""
  for pkg in "${PKGS[@]}"; do
    echo -e "    ${CYAN}•${RESET}  $pkg"
  done
  echo ""
  divider
  echo -e "  ${B_YELLOW}合并安装命令：${RESET}"
  echo ""
  echo -e "  ${BOLD}  $ ${INSTALL_CMD}${RESET}"
  echo ""
  divider
  echo ""

  if ! $NON_INTERACTIVE; then
    if ask_yes_no "确认执行以上安装命令？" "y"; then
      echo ""
      log_info "正在安装依赖..."
      echo ""
      eval "$INSTALL_CMD"
      echo ""
      log_ok "依赖安装完成！"
    else
      echo ""
      log_warn "已跳过依赖安装，你可以稍后手动执行："
      echo ""
      echo -e "  ${DIM}  $ ${INSTALL_CMD}${RESET}"
      echo ""
    fi
  fi
else
  log_info "无需安装额外依赖"
fi

# ── Step 3：创建目录与文件 ────────────────────────────────────────────────────
step 3 "创建目录结构"

log_info "创建基础目录..."
mkdir -p "$SRC/config" "$SRC/constant" "$SRC/pages" "$SRC/components" "$SRC/utils" "$SRC/styles" "$ROOT/tests"
log_ok "基础目录就绪"
echo ""

# Router 模板
if $WITH_ROUTER; then
  section_header "🗂  Router → $ROUTER_CHOICE"
  mkdir -p "$SRC/router"
  write_file_if_missing "$SRC/pages/Home.tsx" "$(cat <<'EOF'
import React from "react";

export default function Home() {
  return <div>Home</div>;
}
EOF
)"
  case "$ROUTER_CHOICE" in
    react-router)
      write_file_if_missing "$SRC/router/index.tsx" "$(cat <<'EOF'
import React, { Suspense, lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const Home = lazy(() => import("../pages/Home"));

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <Home />
      </Suspense>
    ),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
EOF
)"
      ;;
    wouter)
      write_file_if_missing "$SRC/router/index.tsx" "$(cat <<'EOF'
import React, { Suspense, lazy } from "react";
import { Route, Switch } from "wouter";

const Home = lazy(() => import("../pages/Home"));

export function AppRouter() {
  return (
    <Switch>
      <Route path="/">
        <Suspense fallback={<div>Loading...</div>}>
          <Home />
        </Suspense>
      </Route>
    </Switch>
  );
}
EOF
)"
      ;;
    tanstack)
      write_file_if_missing "$SRC/router/index.tsx" "$(cat <<'EOF'
import React, { Suspense, lazy } from "react";
import {
  createRouter,
  RouterProvider,
  Route,
  RootRoute,
} from "@tanstack/router";

const Home = lazy(() => import("../pages/Home"));

const rootRoute = new RootRoute({
  component: () => (
    <Suspense fallback={<div>Loading...</div>}>
      <Home />
    </Suspense>
  ),
});

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/",
});

const routeTree = rootRoute.addChildren([indexRoute]);
const router = createRouter({ routeTree });

export function AppRouter() {
  return <RouterProvider router={router} />;
}
EOF
)"
      ;;
  esac
fi

# Store 模板
if $WITH_STORE; then
  echo ""
  section_header "🗂  Store → $STORE_CHOICE"
  mkdir -p "$SRC/store"
  case "$STORE_CHOICE" in
    zustand)
      write_file_if_missing "$SRC/store/index.ts" "$(cat <<'EOF'
import { create } from "zustand";

type CounterState = {
  count: number;
  inc: () => void;
  dec: () => void;
};

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
  dec: () => set((s) => ({ count: s.count - 1 })),
}));
EOF
)"
      ;;
    redux)
      write_file_if_missing "$SRC/store/index.ts" "$(cat <<'EOF'
import { configureStore, createSlice } from "@reduxjs/toolkit";

const counterSlice = createSlice({
  name: "counter",
  initialState: { count: 0 },
  reducers: {
    inc: (state) => { state.count += 1; },
    dec: (state) => { state.count -= 1; },
  },
});

export const { inc, dec } = counterSlice.actions;

export const store = configureStore({
  reducer: { counter: counterSlice.reducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
EOF
)"
      ;;
    jotai)
      write_file_if_missing "$SRC/store/index.ts" "$(cat <<'EOF'
import { atom } from "jotai";

export const countAtom = atom(0);
export const incAtom = atom(null, (get, set) => set(countAtom, get(countAtom) + 1));
export const decAtom = atom(null, (get, set) => set(countAtom, get(countAtom) - 1));
EOF
)"
      ;;
  esac
fi

# Service 模板
if $WITH_SERVICE; then
  echo ""
  section_header "🗂  Service → $SERVICE_CHOICE"
  mkdir -p "$SRC/service"
  case "$SERVICE_CHOICE" in
    umi-request)
      write_file_if_missing "$SRC/service/request.ts" "$(cat <<'EOF'
import { extend } from "umi-request";

export const request = extend({
  timeout: 10000,
  errorHandler: (error) => {
    throw error;
  },
});
EOF
)"
      ;;
    axios)
      write_file_if_missing "$SRC/service/request.ts" "$(cat <<'EOF'
import axios from "axios";

export const request = axios.create({
  timeout: 10000,
});
EOF
)"
      ;;
    ky)
      write_file_if_missing "$SRC/service/request.ts" "$(cat <<'EOF'
import ky from "ky";

export const request = ky.create({
  timeout: 10000,
});
EOF
)"
      ;;
  esac
fi

# global.less
if $WITH_GLOBAL_LESS; then
  echo ""
  section_header "🗂  Styles"
  if [[ ! -f "$SRC/styles/global.less" ]]; then
    touch "$SRC/styles/global.less"
    log_create "$SRC/styles/global.less"
  else
    log_skip "$SRC/styles/global.less"
  fi
fi

# ── 完成 ─────────────────────────────────────────────────────────────────────
echo ""
divider
echo ""
echo -e "  ${B_GREEN}🎉  项目初始化完成！${RESET}  ${DIM}已有文件均已保留，未覆盖。${RESET}"
echo ""
