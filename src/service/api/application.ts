import { request } from "@service/request";
import type { ServiceRequestOptions } from "@service/request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";
import { API_PATHS } from "@constants/api";

export interface ApplicationRecord {
  id?: string;
  _id?: string;
  tenantId: string;
  productId: string;
  name: string;
  code: string;
  repo_url: string;
  description?: string;
  avatar?: string;
  structure?: string;
  level?: string;
  template_id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateApplicationParams {
  tenantId: string;
  productId: string;
  name: string;
  code: string;
  repo_url: string;
  description?: string;
  avatar?: string;
  structure?: string;
  level?: string;
  template_id?: string;
}

export interface UpdateApplicationParams extends Partial<CreateApplicationParams> {
  id: string;
}

export interface ApplicationListParams {
  id?: string;
  name?: string;
  code?: string;
  productId?: string;
  tenantId?: string;
  pageNum?: number;
  pageSize?: number;
}

export function createApplication(
  params: CreateApplicationParams,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.APPLICATION_CREATE, {
    ...options,
    data: params,
  });
}

export function listApplications(
  params: ApplicationListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<ApplicationRecord>> {
  return request.post<BaseResponse<PaginatedList<ApplicationRecord>>>(
    API_PATHS.APPLICATION_LIST,
    { ...options, data: params },
  );
}

export function getApplicationDetail(
  params: { id?: string; code?: string },
  options?: ServiceRequestOptions,
): ApiPromise<ApplicationRecord> {
  return request.post<BaseResponse<ApplicationRecord>>(API_PATHS.APPLICATION_DETAIL, {
    ...options,
    data: params,
  });
}

export function updateApplication(
  params: UpdateApplicationParams,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.APPLICATION_UPDATE, {
    ...options,
    data: params,
  });
}

export function deleteApplication(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.APPLICATION_DELETE, {
    ...options,
    data: { id },
  });
}
