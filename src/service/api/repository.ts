import { request } from "@service/request";
import type { ServiceRequestOptions } from "@service/request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";
import { API_PATHS } from "@constants/api";
import type { RepositoryProvider, RepositoryAuthType } from "@constants/cicd";

export type { RepositoryProvider, RepositoryAuthType };

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
