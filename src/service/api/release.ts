import { request } from "@service/request";
import type { ServiceRequestOptions } from "@service/request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";
import { API_PATHS } from "@constants/api";
import type { ReleaseStatus, ReleaseStage } from "@constants/cicd";

export type { ReleaseStatus, ReleaseStage };

export interface GitInfo {
  branch?: string;
  commitHash?: string;
  /** 新建分支时的来源分支 */
  sourceBranch?: string;
  commitMessage?: string;
  commitAuthor?: string;
  tag?: string;
  repositoryUrl?: string;
}

export interface BuildConfig {
  buildCommands: string[];
  artifactPath?: string;
  /** zip | docker-image | binary | static */
  artifactType?: string;
  dockerfilePath?: string;
  imageRepo?: string;
  preCommands?: string[];
  postCommands?: string[];
  envVars?: Record<string, string>;
  /** 构建超时秒数，默认 600 */
  timeoutSec?: number;
  workDir?: string;
}

export interface BuildArtifact {
  type: string;
  dockerImage?: string;
  dockerImageDigest?: string;
  packageUrl?: string;
  packageSize?: number;
  packageChecksum?: string;
  buildJobId?: string;
  buildNumber?: number;
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
  /** 构建环境 ID（build 类型 Environment） */
  environmentId?: string;
  /** 构建配置 */
  buildConfig?: BuildConfig;
  /** 构建产物信息 */
  buildArtifact?: BuildArtifact;
  /** 构建开始时间 */
  buildStartedAt?: string;
  /** 构建完成时间 */
  buildCompletedAt?: string;
  /** 构建日志摘要 */
  buildLog?: string;
  /** 构建轮次（每次触发 startBuild +1，从 1 开始） */
  buildRound?: number;
  /** 错误信息 */
  errorMessage?: string;
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
  /** 关联代码仓库ID，用于服务端自动创建/解析分支 */
  repositoryId?: string;
  /** 构建环境 ID */
  environmentId?: string;
  /** 构建配置 */
  buildConfig?: BuildConfig;
  metadata?: Record<string, unknown>;
}

export interface UpdateReleaseParams {
  version?: string;
  title?: string;
  description?: string;
  currentStage?: ReleaseStage;
  git?: Partial<GitInfo>;
  /** 关联代码仓库ID，用于服务端自动创建/解析分支 */
  repositoryId?: string;
  /** 构建环境 ID */
  environmentId?: string;
  /** 构建配置 */
  buildConfig?: BuildConfig;
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
): ApiPromise<ReleaseRecord> {
  return request.post<BaseResponse<ReleaseRecord>>(API_PATHS.RELEASE_CREATE, {
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
