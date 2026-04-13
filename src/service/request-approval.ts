import type { RequestOptionsInit, RequestOptionsWithResponse } from "umi-request";
import type { BaseResponse } from "./api/types";

export const APPROVAL_ID_HEADER = "x-approval-id";
export const REQUEST_PREFIX = "/aoko-devops";
export const APPROVAL_RESULT_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELED: "canceled",
  EXPIRED: "expired",
} as const;

export type ApprovalResultStatus =
  (typeof APPROVAL_RESULT_STATUS)[keyof typeof APPROVAL_RESULT_STATUS];

export type ApprovalRequestOptions = RequestOptionsInit & {
  approvalId?: string;
  __approvalRequestUrl?: string;
  __approvalRetryAttempted?: boolean;
};

export type ApprovalRequiredResponse = BaseResponse<unknown> & {
  approvalRequired: true;
  approvalId: string;
  gateCode?: string;
  status?: ApprovalResultStatus;
};

export function normalizeApprovalId(value?: string) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeApprovalRetryUrl(url: string) {
  const rawUrl = url.trim();

  if (!rawUrl) {
    return rawUrl;
  }

  let normalizedPath = rawUrl;

  if (/^https?:\/\//.test(normalizedPath)) {
    try {
      const parsedUrl = new URL(normalizedPath);
      normalizedPath = `${parsedUrl.pathname}${parsedUrl.search}`;
    } catch {
      normalizedPath = rawUrl;
    }
  }

  if (!normalizedPath.startsWith("/")) {
    normalizedPath = `/${normalizedPath}`;
  }

  const duplicatedPrefix = `${REQUEST_PREFIX}${REQUEST_PREFIX}`;
  while (normalizedPath.startsWith(duplicatedPrefix)) {
    normalizedPath = normalizedPath.slice(REQUEST_PREFIX.length);
  }

  if (normalizedPath.startsWith(REQUEST_PREFIX)) {
    normalizedPath = normalizedPath.slice(REQUEST_PREFIX.length) || "/";
  }

  return normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
}

export function buildApprovalHeaders(
  headers?: RequestOptionsInit["headers"],
  approvalId?: string,
) {
  const normalizedApprovalId = normalizeApprovalId(approvalId);
  const baseHeaders =
    headers && !Array.isArray(headers) && !(headers instanceof Headers) ? headers : {};

  return {
    ...baseHeaders,
    ...(normalizedApprovalId ? { [APPROVAL_ID_HEADER]: normalizedApprovalId } : {}),
  };
}

export function isApprovalRequiredResponse(data: unknown): data is ApprovalRequiredResponse {
  return Boolean(
    data &&
      typeof data === "object" &&
      "approvalRequired" in data &&
      data.approvalRequired === true &&
      "approvalId" in data &&
      typeof data.approvalId === "string" &&
      data.approvalId.trim(),
  );
}

export function shouldRetryApprovedApproval(
  data: ApprovalRequiredResponse,
  options?: ApprovalRequestOptions,
) {
  return (
    data.status === APPROVAL_RESULT_STATUS.APPROVED &&
    options?.__approvalRetryAttempted !== true
  );
}

export function buildApprovalRetryOptions(
  options: ApprovalRequestOptions,
  approvalId: string,
): ApprovalRequestOptions & RequestOptionsWithResponse {
  return {
    ...options,
    approvalId,
    getResponse: true,
    __approvalRetryAttempted: true,
  };
}
