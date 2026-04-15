import { request } from "@service/request";
import type { ServiceRequestOptions } from "@service/request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";
import { API_PATHS } from "@constants/api";
import { SERVER_AUTH_TYPES, SERVER_STATUSES } from "@constants/status";

export type ServerStatus = (typeof SERVER_STATUSES)[keyof typeof SERVER_STATUSES];
export type ServerAuthType = (typeof SERVER_AUTH_TYPES)[keyof typeof SERVER_AUTH_TYPES];

export interface ServerRecord {
  id?: string;
  _id?: string;
  name: string;
  ip?: string;
  merchant?: string;
  auth_type?: ServerAuthType;
  public_key?: string;
  private_key?: string;
  username?: string;
  password?: string;
  description?: string;
  status?: ServerStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServerListParams {
  id?: string;
  name?: string;
  merchant?: string;
  description?: string;
  status?: ServerStatus;
  pageNum?: number;
  pageSize?: number;
}

export interface ServerMutationPayload {
  name: string;
  ip?: string;
  merchant?: string;
  auth_type?: ServerAuthType;
  public_key?: string;
  private_key?: string;
  username?: string;
  password?: string;
  description?: string;
  status?: ServerStatus;
}

export interface UpdateServerPayload extends Partial<ServerMutationPayload> {
  id: string;
}

export interface ServerSystemInfo {
  hostname?: string;
  osPrettyName?: string;
  kernel?: string;
  arch?: string;
  uptime?: string;
  loadAvg?: {
    m1?: number;
    m5?: number;
    m15?: number;
  };
  cpu?: {
    model?: string;
    cores?: number;
  };
  memory?: {
    totalBytes?: number;
    availableBytes?: number;
    freeBytes?: number;
    usedBytes?: number;
    totalGb?: number;
    availableGb?: number;
    freeGb?: number;
    usedGb?: number;
    usedPercent?: number;
  };
  swap?: {
    totalBytes?: number;
    freeBytes?: number;
    usedBytes?: number;
    totalGb?: number;
    freeGb?: number;
    usedGb?: number;
    usedPercent?: number;
  };
  disk?: {
    root?: {
      totalBytes?: number;
      usedBytes?: number;
      availableBytes?: number;
      usedPercent?: number;
    };
  };
}

export interface ServerConnectionTestResult {
  serverId: string;
  name: string;
  ip: string;
  merchant: string;
  resourceStatus: ServerStatus;
  authType: ServerAuthType;
  reachable: boolean;
  latencyMs: number;
  checkedAt: string;
  systemInfo?: ServerSystemInfo;
  message?: string;
}

export function listServers(
  params: ServerListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<ServerRecord>> {
  return request.post<BaseResponse<PaginatedList<ServerRecord>>>(API_PATHS.SERVER_LIST, {
    ...options,
    data: params,
  });
}

export function getServerDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<ServerRecord> {
  return request.post<BaseResponse<ServerRecord>>(API_PATHS.SERVER_DETAIL(id), {
    ...options,
  });
}

export function createServer(
  params: ServerMutationPayload,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.SERVER_CREATE, {
    ...options,
    data: params,
  });
}

export function updateServer(
  params: UpdateServerPayload,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.SERVER_UPDATE, {
    ...options,
    data: params,
  });
}

export function deleteServer(
  params: { id: string },
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.SERVER_DELETE, {
    ...options,
    data: params,
  });
}

export function testServerConnection(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<ServerConnectionTestResult> {
  return request.post<BaseResponse<ServerConnectionTestResult>>(API_PATHS.SERVER_TEST_CONNECTION(id), {
    ...options,
  });
}
