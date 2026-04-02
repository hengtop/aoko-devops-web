import { request } from "../request";
import type { ServiceRequestOptions } from "../request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";

export type ServerStatus = "enable" | "disable";
export type ServerAuthType = "password" | "key";

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
  return request.post<BaseResponse<PaginatedList<ServerRecord>>>("/server/list", {
    ...options,
    data: params,
  });
}

export function getServerDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<ServerRecord> {
  return request.post<BaseResponse<ServerRecord>>(`/server/detail/${id}`, {
    ...options,
  });
}

export function createServer(
  params: ServerMutationPayload,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>("/server/create", {
    ...options,
    data: params,
  });
}

export function updateServer(
  params: UpdateServerPayload,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>("/server/update", {
    ...options,
    data: params,
  });
}

export function deleteServer(
  params: { id: string },
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>("/server/delete", {
    ...options,
    data: params,
  });
}

export function testServerConnection(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<ServerConnectionTestResult> {
  return request.post<BaseResponse<ServerConnectionTestResult>>(`/server/test-connection/${id}`, {
    ...options,
  });
}
