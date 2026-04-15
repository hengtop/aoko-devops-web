import type { RequestOptionsInit, RequestOptionsWithResponse } from "umi-request";
import type { BaseResponse } from "@service/api/types";
import {
  APPROVAL_ID_HEADER,
  APPROVAL_INSTANCE_STATUSES,
  REQUEST_PREFIX as REQUEST_PREFIX_VALUE,
} from "@constants";

export const REQUEST_PREFIX = REQUEST_PREFIX_VALUE;

export const APPROVAL_RESULT_STATUS = {
  PENDING: APPROVAL_INSTANCE_STATUSES.PENDING,
  IN_PROGRESS: APPROVAL_INSTANCE_STATUSES.IN_PROGRESS,
  APPROVED: APPROVAL_INSTANCE_STATUSES.APPROVED,
  REJECTED: APPROVAL_INSTANCE_STATUSES.REJECTED,
  CANCELED: APPROVAL_INSTANCE_STATUSES.CANCELED,
  EXPIRED: APPROVAL_INSTANCE_STATUSES.EXPIRED,
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
