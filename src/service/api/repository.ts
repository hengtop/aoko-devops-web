import { request } from "@service/request";
import type { ServiceRequestOptions } from "@service/request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";
import { API_PATHS } from "@constants/api";
import type { RepositoryProvider, RepositoryAuthType, RepositoryRole } from "@constants/cicd";

export type { RepositoryProvider, RepositoryAuthType, RepositoryRole };

export interface RepositoryRecord {
  id?: string;
  _id?: string;
  applicationId: string;
  providerType: RepositoryProvider;
  repoName: string;
  repoUrl: string;
  httpUrl?: string;
  sshUrl?: string;
  defaultBranch: string;
  authType: RepositoryAuthType;
  credentialId?: string;
  isDefault?: boolean;
  repositoryRole?: RepositoryRole;
  webhookSecret?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRepositoryParams {
  applicationId: string;
  providerType: RepositoryProvider;
  repoName: string;
  repoUrl: string;
  httpUrl?: string;
  sshUrl?: string;
  defaultBranch: string;
  authType: RepositoryAuthType;
  credentialId?: string;
  isDefault?: boolean;
  repositoryRole?: RepositoryRole;
  webhookSecret?: string;
  status?: string;
}

export interface UpdateRepositoryParams extends Partial<CreateRepositoryParams> {
  id: string;
}

export interface RepositoryListParams {
  applicationId?: string;
  pageNum?: number;
  pageSize?: number;
}

export interface WebhookEvent {
  id?: string;
  _id?: string;
  repositoryId: string;
  eventType: string;
  ref: string;
  commitSha: string;
  handledStatus: string;
  createdAt?: string;
}

export function createRepository(
  params: CreateRepositoryParams,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.REPOSITORY_CREATE, {
    ...options,
    data: params,
  });
}

export function listRepositories(
  params: RepositoryListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<RepositoryRecord>> {
  return request.post<BaseResponse<PaginatedList<RepositoryRecord>>>(
    API_PATHS.REPOSITORY_LIST,
    { ...options, data: params },
  );
}

export function getRepositoryDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<RepositoryRecord> {
  return request.post<BaseResponse<RepositoryRecord>>(API_PATHS.REPOSITORY_DETAIL, {
    ...options,
    data: { id },
  });
}

export function updateRepository(
  params: UpdateRepositoryParams,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.REPOSITORY_UPDATE, {
    ...options,
    data: params,
  });
}

export function deleteRepository(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.REPOSITORY_DELETE, {
    ...options,
    data: { id },
  });
}

export function listWebhookEvents(
  params: { repositoryId?: string; pageNum?: number; pageSize?: number },
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<WebhookEvent>> {
  return request.post<BaseResponse<PaginatedList<WebhookEvent>>>(
    API_PATHS.REPOSITORY_WEBHOOK_EVENTS,
    { ...options, data: params },
  );
}

// ===== 分支相关 =====

export interface BranchInfo {
  /** 分支名称 */
  name: string;
  /** 最新 commit hash */
  commitHash: string;
}

export interface ResolveBranchResult extends BranchInfo {
  /** true = 新创建的分支，false = 已存在的分支 */
  created: boolean;
}

export interface ResolveBranchParams {
  repositoryId: string;
  branchName: string;
  /** 新建分支时的源分支，默认为仓库 defaultBranch */
  sourceBranch?: string;
}

/**
 * 获取仓库所有分支列表（调用远程 Git 平台）
 */
export function listRepositoryBranches(
  repositoryId: string,
  options?: ServiceRequestOptions,
): ApiPromise<BranchInfo[]> {
  return request.post<BaseResponse<BranchInfo[]>>(
    API_PATHS.REPOSITORY_BRANCHES,
    { ...options, data: { repositoryId } },
  );
}

/**
 * 获取或创建分支（已存在直接回填，不存在则基于 sourceBranch 创建）
 */
export function resolveBranch(
  params: ResolveBranchParams,
  options?: ServiceRequestOptions,
): ApiPromise<ResolveBranchResult> {
  return request.post<BaseResponse<ResolveBranchResult>>(
    API_PATHS.REPOSITORY_RESOLVE_BRANCH,
    { ...options, data: params },
  );
}
