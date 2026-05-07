import { request } from "@service/request";
import type { ServiceRequestOptions } from "@service/request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";
import { API_PATHS } from "@constants/api";
import type { DeploymentStatus, DeployStrategy, EnvironmentType } from "@constants/cicd";

export type { DeploymentStatus, DeployStrategy, EnvironmentType as DeploymentEnvironment };

export interface TargetServer {
  serverId: string;
  serverName: string;
  ip: string;
  group?: string;
  status?: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface AccessUrl {
  type: "web" | "api" | "admin" | "other";
  url: string;
  description?: string;
  isPublic: boolean;
}

export interface HealthCheckConfig {
  enabled?: boolean;
  url: string;
  interval?: number;
  timeout?: number;
  successThreshold?: number;
  failureThreshold?: number;
}

export interface DeployConfig {
  batchSize?: number;
  batchInterval?: number;
  maxSurge?: number;
  maxUnavailable?: number;
  healthCheck?: HealthCheckConfig;
  autoRollback?: boolean;
  rollbackConditions?: string[];
  envVars?: Record<string, string>;
}

export interface DeploymentRecord {
  id?: string;
  _id?: string;
  releaseId: string;
  deploymentNumber?: number;
  environment: EnvironmentType;
  deployStrategy: DeployStrategy;
  status: DeploymentStatus;
  progress: number;
  accessUrls?: AccessUrl[];
  targetServers: TargetServer[];
  deployConfig?: DeployConfig;
  triggeredBy?: string;
  triggerType?: string;
  duration?: number;
  errorMessage?: string;
  canRollback?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDeploymentParams {
  releaseId: string;
  environment: EnvironmentType;
  deployStrategy: DeployStrategy;
  targetServers: TargetServer[];
  deployConfig: DeployConfig;
  accessUrls?: AccessUrl[];
  metadata?: Record<string, unknown>;
}

export interface DeploymentListParams {
  releaseId?: string;
  environment?: EnvironmentType;
  status?: DeploymentStatus;
  id?: string;
  pageNum?: number;
  pageSize?: number;
}

export interface DeploymentLog {
  id?: string;
  _id?: string;
  deploymentId: string;
  level: "info" | "warn" | "error" | "debug";
  source: string;
  message: string;
  serverId?: string;
  batchNumber?: number;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export function createDeployment(
  params: CreateDeploymentParams,
  options?: ServiceRequestOptions,
): ApiPromise<DeploymentRecord> {
  return request.post<BaseResponse<DeploymentRecord>>(API_PATHS.DEPLOYMENT_CREATE, {
    ...options,
    data: params,
  });
}

export function listDeployments(
  params: DeploymentListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<DeploymentRecord>> {
  return request.post<BaseResponse<PaginatedList<DeploymentRecord>>>(
    API_PATHS.DEPLOYMENT_LIST,
    { ...options, data: params },
  );
}

export function getDeploymentDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<DeploymentRecord> {
  return request.post<BaseResponse<DeploymentRecord>>(API_PATHS.DEPLOYMENT_DETAIL(id), {
    ...options,
    data: {},
  });
}

export function startDeployment(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<DeploymentRecord> {
  return request.post<BaseResponse<DeploymentRecord>>(API_PATHS.DEPLOYMENT_START(id), {
    ...options,
    data: {},
  });
}

export function cancelDeployment(
  id: string,
  reason: string,
  options?: ServiceRequestOptions,
): ApiPromise<DeploymentRecord> {
  return request.post<BaseResponse<DeploymentRecord>>(API_PATHS.DEPLOYMENT_CANCEL(id), {
    ...options,
    data: { reason },
  });
}

export function rollbackDeployment(
  id: string,
  params?: { reason?: string; targetDeploymentId?: string },
  options?: ServiceRequestOptions,
): ApiPromise<DeploymentRecord> {
  return request.post<BaseResponse<DeploymentRecord>>(API_PATHS.DEPLOYMENT_ROLLBACK(id), {
    ...options,
    data: params ?? {},
  });
}

export function getDeploymentLogs(
  params: { deploymentId: string; pageNum?: number; pageSize?: number },
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<DeploymentLog>> {
  return request.post<BaseResponse<PaginatedList<DeploymentLog>>>(
    API_PATHS.DEPLOYMENT_LOGS(params.deploymentId),
    { ...options, data: params },
  );
}

export function getDeploymentHistory(
  id: string,
  environment?: EnvironmentType,
  options?: ServiceRequestOptions,
): ApiPromise<DeploymentRecord[]> {
  return request.post<BaseResponse<DeploymentRecord[]>>(API_PATHS.DEPLOYMENT_HISTORY(id), {
    ...options,
    data: { environment },
  });
}
