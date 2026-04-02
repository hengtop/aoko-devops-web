import { extend } from "umi-request";
import { message } from "antd";
import type { BaseResponse, ResponseMessage } from "./api/types";
import { useAuthStore } from "../store";
import { buildLoginPath, LOGIN_PATH, resolveCurrentRoutePath } from "../utils";

export interface ServiceRequestOptions {
  useGlobalErrorHandler?: boolean;
  skipAuthFailureRedirect?: boolean;
  [key: string]: unknown;
}

type RequestError = Error & {
  handled?: boolean;
  data?: BaseResponse<unknown>;
  response?: Response;
  request?: {
    url: string;
    options: ServiceRequestOptions;
  };
};

const TOKEN_INVALID_MESSAGE_KEY = "auth-token-invalid";
const TOKEN_INVALID_RESPONSE_CODES = new Set([401]);

let isTokenInvalidRedirecting = false;

function formatResponseMessage(msg: ResponseMessage | undefined, fallback: string) {
  if (Array.isArray(msg)) {
    const text = msg.filter(Boolean).join("，");
    return text || fallback;
  }

  if (typeof msg === "string" && msg.trim()) {
    return msg;
  }

  return fallback;
}

function shouldUseGlobalErrorHandler(options?: ServiceRequestOptions) {
  return options?.useGlobalErrorHandler !== false;
}

function shouldHandleAuthFailureRedirect(options?: ServiceRequestOptions) {
  return options?.skipAuthFailureRedirect !== true;
}

function isTokenInvalidCode(code?: number) {
  return typeof code === "number" && TOKEN_INVALID_RESPONSE_CODES.has(code);
}

function resetTokenInvalidRedirectState() {
  isTokenInvalidRedirecting = false;
  message.destroy(TOKEN_INVALID_MESSAGE_KEY);
}

function showTokenInvalidMessage(content: string) {
  message.open({
    key: TOKEN_INVALID_MESSAGE_KEY,
    type: "error",
    content,
  });
}

function onTokenInvalid(content = "登录状态已失效，请重新登录") {
  clearAccessToken();

  if (typeof window === "undefined") {
    return;
  }

  showTokenInvalidMessage(content);

  if (isTokenInvalidRedirecting) {
    return;
  }

  isTokenInvalidRedirecting = true;

  if (window.location.pathname === LOGIN_PATH) {
    return;
  }

  window.location.replace(buildLoginPath(resolveCurrentRoutePath()));
}

export function getAccessToken() {
  return useAuthStore.getState().token;
}

export function setAccessToken(token: string) {
  resetTokenInvalidRedirectState();
  useAuthStore.getState().setToken(token);
}

export function clearAccessToken() {
  useAuthStore.getState().clearAuth();
}

export const request = extend({
  prefix: "/aoko-devops",
  timeout: 10000,
  errorHandler: (error: RequestError) => {
    if (
      error.response?.status === 401 &&
      shouldHandleAuthFailureRedirect(error.request?.options)
    ) {
      onTokenInvalid(formatResponseMessage(error.data?.msg, "登录状态已失效，请重新登录"));
      error.handled = true;
      throw error;
    }

    if (!shouldUseGlobalErrorHandler(error.request?.options)) {
      throw error;
    }

    const fallbackMessage = "请求失败，请稍后重试";

    message.error(formatResponseMessage(error.data?.msg, fallbackMessage));
    error.handled = true;
    throw error;
  },
});

request.interceptors.request.use((url, options) => {
  const token = getAccessToken();
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `bearer ${token}` } : {}),
  };

  return {
    url,
    options: {
      ...options,
      headers,
    },
  };
});

request.interceptors.response.use(async (response, options) => {
  if (response.status === 401 && shouldHandleAuthFailureRedirect(options)) {
    onTokenInvalid();
  }

  if (!shouldUseGlobalErrorHandler(options)) {
    return response;
  }

  if (!response.ok) {
    return response;
  }

  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return response;
  }

  try {
    const data = (await response.clone().json()) as BaseResponse<unknown>;
    if (data && typeof data === "object" && isTokenInvalidCode(data.code)) {
      if (shouldHandleAuthFailureRedirect(options)) {
        onTokenInvalid(formatResponseMessage(data.msg, "登录状态已失效，请重新登录"));
      }

      return response;
    }

    if (data && typeof data === "object" && data.success === false) {
      message.error(formatResponseMessage(data.msg, "请求失败，请稍后重试"));
    }
  } catch {
    // ignore non-standard response bodies
  }

  return response;
});
