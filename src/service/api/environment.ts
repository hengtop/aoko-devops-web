import { request } from "@service/request";
import type { ServiceRequestOptions } from "@service/request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";
import { API_PATHS } from "@constants/api";
import type { EnvironmentType, EnvironmentDeployType } from "@constants/cicd";

export type { EnvironmentType, EnvironmentDeployType };

export interface EnvironmentRecord {
  id?: string;
  _id?: string;
  applicationId: string;
  name: string;
  code: string;
  type: EnvironmentType;
  deployType: EnvironmentDeployType;
  serverIds: string[];
  description?: string;
  includeInDeploymentPipeline?: boolean;
  promotionOrder?: number;
  status?: string;
  locked?: boolean;
  lockedBy?: string;
  lockedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEnvironmentParams {
  applicationId: string;
  name: string;
  code: string;
  type: EnvironmentType;
  deployType: EnvironmentDeployType;
  serverIds: string[];
  description?: string;
  includeInDeploymentPipeline?: boolean;
  promotionOrder?: number;
  status?: string;
}

export interface UpdateEnvironmentParams extends Partial<CreateEnvironmentParams> {
  id: string;
}

export interface EnvironmentListParams {
  applicationId: string;
  type?: EnvironmentType;
  includeInDeploymentPipeline?: boolean;
  pageNum?: number;
  pageSize?: number;
}

export function createEnvironment(
  params: CreateEnvironmentParams,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.ENVIRONMENT_CREATE, {
    ...options,
    data: params,
  });
}

export function listEnvironments(
  params: EnvironmentListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<EnvironmentRecord>> {
  return request.post<BaseResponse<PaginatedList<EnvironmentRecord>>>(
    API_PATHS.ENVIRONMENT_LIST,
    { ...options, data: params },
  );
}

export function getEnvironmentDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<EnvironmentRecord> {
  return request.post<BaseResponse<EnvironmentRecord>>(API_PATHS.ENVIRONMENT_DETAIL, {
    ...options,
    data: { id },
  });
}

export function updateEnvironment(
  params: UpdateEnvironmentParams,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.ENVIRONMENT_UPDATE, {
    ...options,
    data: params,
  });
}

export function deleteEnvironment(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.ENVIRONMENT_DELETE, {
    ...options,
    data: { id },
  });
}

export function getEnvironmentCurrentDeployment(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<unknown> {
  return request.post<BaseResponse<unknown>>(API_PATHS.ENVIRONMENT_CURRENT_DEPLOYMENT, {
    ...options,
    data: { id },
  });
}

export function lockEnvironment(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.ENVIRONMENT_LOCK, {
    ...options,
    data: { id },
  });
}

export function unlockEnvironment(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.ENVIRONMENT_UNLOCK, {
    ...options,
    data: { id },
  });
}
