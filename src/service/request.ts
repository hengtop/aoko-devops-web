import { extend } from "umi-request";
import { message } from "antd";
import type { BaseResponse, ResponseMessage } from "./api/types";
import {
  buildApprovalHeaders,
  buildApprovalRetryOptions,
  isApprovalRequiredResponse,
  normalizeApprovalRetryUrl,
  REQUEST_PREFIX,
  shouldRetryApprovedApproval,
  type ApprovalRequestOptions,
} from "./request-approval";
import { useAuthStore, useMessageInboxStore } from "../store";
import { buildLoginPath, LOGIN_PATH, resolveCurrentRoutePath } from "../utils";

export interface ServiceRequestOptions {
  useGlobalErrorHandler?: boolean;
  skipAuthFailureRedirect?: boolean;
  approvalId?: string;
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
const TOKEN_INVALID_FALLBACK_MESSAGE = "登录状态已失效，请重新登录";

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

async function resolveTokenInvalidMessage(
  response: Response,
  fallback = TOKEN_INVALID_FALLBACK_MESSAGE,
) {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return fallback;
  }

  try {
    const data = (await response.clone().json()) as BaseResponse<unknown>;
    return formatResponseMessage(data.msg, fallback);
  } catch {
    return fallback;
  }
}

function onTokenInvalid(content = TOKEN_INVALID_FALLBACK_MESSAGE) {
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
  useMessageInboxStore.getState().resetInbox();
}

export const request = extend({
  prefix: REQUEST_PREFIX,
  timeout: 10000,
  errorHandler: (error: RequestError) => {
    if (
      error.response?.status === 401 &&
      shouldHandleAuthFailureRedirect(error.request?.options)
    ) {
      onTokenInvalid(formatResponseMessage(error.data?.msg, TOKEN_INVALID_FALLBACK_MESSAGE));
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
  const requestOptions = options as ApprovalRequestOptions & ServiceRequestOptions;
  const token = getAccessToken();
  const headers = {
    ...buildApprovalHeaders(requestOptions.headers, requestOptions.approvalId),
    ...(token ? { Authorization: `bearer ${token}` } : {}),
  };
  const { approvalId: _approvalId, ...restOptions } = requestOptions;

  return {
    url,
    options: {
      ...restOptions,
      headers,
      __approvalRequestUrl: normalizeApprovalRetryUrl(requestOptions.__approvalRequestUrl ?? url),
    },
  };
});

request.interceptors.response.use(async (response, options) => {
  if (response.status === 401 && shouldHandleAuthFailureRedirect(options)) {
    onTokenInvalid(await resolveTokenInvalidMessage(response));
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
        onTokenInvalid(formatResponseMessage(data.msg, TOKEN_INVALID_FALLBACK_MESSAGE));
      }

      return response;
    }

    if (isApprovalRequiredResponse(data)) {
      const requestOptions = options as ApprovalRequestOptions & ServiceRequestOptions;

      if (shouldRetryApprovedApproval(data, requestOptions)) {
        const retryUrl = normalizeApprovalRetryUrl(
          requestOptions.__approvalRequestUrl ?? response.url,
        );
        const retryResult = await request<BaseResponse<unknown>>(
          retryUrl,
          buildApprovalRetryOptions(requestOptions, data.approvalId),
        );

        return retryResult.response;
      }

      if (shouldUseGlobalErrorHandler(options)) {
        message.warning(formatResponseMessage(data.msg, "当前接口需要审批后才能继续调用"));
      }

      return response;
    }

    if (!shouldUseGlobalErrorHandler(options)) {
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
