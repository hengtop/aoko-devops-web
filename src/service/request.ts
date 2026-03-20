import { extend } from "umi-request";
import { message } from "antd";
import type { BaseResponse, ResponseMessage } from "./api/types";
import { useAuthStore } from "../store";

export interface ServiceRequestOptions {
  useGlobalErrorHandler?: boolean;
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

function onTokenInvalid() {
  // TODO: token 失效处理（后续按业务实现）
}

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

export function getAccessToken() {
  return useAuthStore.getState().token;
}

export function setAccessToken(token: string) {
  useAuthStore.getState().setToken(token);
}

export function clearAccessToken() {
  useAuthStore.getState().clearAuth();
}

export const request = extend({
  prefix: "/aoko-devops",
  timeout: 10000,
  errorHandler: (error: RequestError) => {
    if (!shouldUseGlobalErrorHandler(error.request?.options)) {
      throw error;
    }

    const fallbackMessage =
      error.response?.status === 401 ? "登录状态已失效，请重新登录" : "请求失败，请稍后重试";

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
  if (response.status === 401) {
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
    if (data && typeof data === "object" && data.success === false) {
      message.error(formatResponseMessage(data.msg, "请求失败，请稍后重试"));
    }
  } catch {
    // ignore non-standard response bodies
  }

  return response;
});
