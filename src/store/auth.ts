import { create } from "zustand";
import { STORAGE_KEYS } from "@constants";

export const TOKEN_STORAGE_KEY = STORAGE_KEYS.ACCESS_TOKEN;
export const PERMISSIONS_STORAGE_KEY = STORAGE_KEYS.PERMISSIONS;

function isBrowser() {
  return typeof window !== "undefined";
}

export function readStoredAccessToken() {
  if (!isBrowser()) {
    return null;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function readStoredPermissions() {
  if (!isBrowser()) {
    return [];
  }

  const rawValue = window.localStorage.getItem(PERMISSIONS_STORAGE_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
  } catch {
    return [];
  }
}

export function resolveCurrentPermissions() {
  // TODO: 后续在这里对接真实的用户权限来源（store / 用户信息接口 / 本地缓存）
  return readStoredPermissions();
}

type AuthState = {
  token: string | null;
  permissions: string[];
  setToken: (token: string) => void;
  setPermissions: (permissions: string[]) => void;
  clearAuth: () => void;
  refreshPermissions: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: readStoredAccessToken(),
  permissions: resolveCurrentPermissions(),
  setToken: (token) => {
    if (isBrowser()) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }

    set({ token });
  },
  setPermissions: (permissions) => {
    if (isBrowser()) {
      window.localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(permissions));
    }

    set({ permissions });
  },
  clearAuth: () => {
    if (isBrowser()) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(PERMISSIONS_STORAGE_KEY);
    }

    set({ token: null, permissions: [] });
  },
  refreshPermissions: () => {
    set({ permissions: resolveCurrentPermissions() });
  },
}));
