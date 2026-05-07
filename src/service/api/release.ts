import { request } from "@service/request";
import type { ServiceRequestOptions } from "@service/request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";
import { API_PATHS } from "@constants/api";
import type { ReleaseStatus, ReleaseStage } from "@constants/cicd";

export type { ReleaseStatus, ReleaseStage };

export interface GitInfo {
  branch: string;
  commitHash: string;
  commitMessage?: string;
  commitAuthor?: string;
  tag?: string;
  repositoryUrl?: string;
}

export interface ReleaseRecord {
  id?: string;
  _id?: string;
  tenantId: string;
  productId: string;
  applicationId: string;
  version: string;
  title: string;
  description?: string;
  currentStage: ReleaseStage;
  status: ReleaseStatus;
  git: GitInfo;
  createdBy?: string;
  pipelineId?: string;
  artifactId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateReleaseParams {
  tenantId: string;
  productId: string;
  applicationId: string;
  version: string;
  title: string;
  description?: string;
  currentStage: ReleaseStage;
  git: GitInfo;
  metadata?: Record<string, unknown>;
}

export interface UpdateReleaseParams {
  version?: string;
  title?: string;
  description?: string;
  currentStage?: ReleaseStage;
  git?: Partial<GitInfo>;
  metadata?: Record<string, unknown>;
}

export interface ReleaseListParams {
  applicationId?: string;
  version?: string;
  title?: string;
  status?: ReleaseStatus;
  id?: string;
  pageNum?: number;
  pageSize?: number;
}

export interface ReleaseStatistics {
  total: number;
  byStatus: Record<string, number>;
  recentReleases: ReleaseRecord[];
}

export function createRelease(
  params: CreateReleaseParams,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.RELEASE_CREATE, {
    ...options,
    data: params,
  });
}

export function listReleases(
  params: ReleaseListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<ReleaseRecord>> {
  return request.post<BaseResponse<PaginatedList<ReleaseRecord>>>(API_PATHS.RELEASE_LIST, {
    ...options,
    data: params,
  });
}

export function getReleaseDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<ReleaseRecord> {
  return request.post<BaseResponse<ReleaseRecord>>(API_PATHS.RELEASE_DETAIL(id), {
    ...options,
    data: {},
  });
}

export function updateRelease(
  id: string,
  params: UpdateReleaseParams,
  options?: ServiceRequestOptions,
): ApiPromise<ReleaseRecord> {
  return request.post<BaseResponse<ReleaseRecord>>(API_PATHS.RELEASE_UPDATE(id), {
    ...options,
    data: params,
  });
}

export function startReleaseBuild(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<ReleaseRecord> {
  return request.post<BaseResponse<ReleaseRecord>>(API_PATHS.RELEASE_BUILD(id), {
    ...options,
    data: {},
  });
}

export function markReleaseReady(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<ReleaseRecord> {
  return request.post<BaseResponse<ReleaseRecord>>(API_PATHS.RELEASE_READY(id), {
    ...options,
    data: {},
  });
}

export function cancelRelease(
  id: string,
  reason?: string,
  options?: ServiceRequestOptions,
): ApiPromise<ReleaseRecord> {
  return request.post<BaseResponse<ReleaseRecord>>(API_PATHS.RELEASE_CANCEL(id), {
    ...options,
    data: { reason },
  });
}

export function deleteRelease(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.RELEASE_DELETE(id), {
    ...options,
    data: {},
  });
}

export function getReleaseStatistics(
  applicationId: string,
  options?: ServiceRequestOptions,
): ApiPromise<ReleaseStatistics> {
  return request.post<BaseResponse<ReleaseStatistics>>(
    API_PATHS.RELEASE_STATISTICS(applicationId),
    { ...options, data: {} },
  );
}
