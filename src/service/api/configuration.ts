import { request } from "@service/request";
import type { ServiceRequestOptions } from "@service/request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";
import { API_PATHS } from "@constants/api";
import { APPROVAL_TEMPLATE_STATUSES } from "@constants/status";

export type ConfigurationStatus =
  (typeof APPROVAL_TEMPLATE_STATUSES)[keyof typeof APPROVAL_TEMPLATE_STATUSES];

export interface ConfigurationRecord {
  id?: string;
  _id?: string;
  name: string;
  fileName: string;
  content: string;
  ext: string;
  status: ConfigurationStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConfigurationListParams {
  id?: string;
  name?: string;
  fileName?: string;
  status?: ConfigurationStatus;
  pageNum?: number;
  pageSize?: number;
}

export interface ConfigurationMutationPayload {
  name: string;
  fileName: string;
  content: string;
  ext: string;
  status?: ConfigurationStatus;
}

export interface UpdateConfigurationPayload extends Partial<ConfigurationMutationPayload> {
  id: string;
}

export function listConfigurations(
  params: ConfigurationListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<ConfigurationRecord>> {
  return request.post<BaseResponse<PaginatedList<ConfigurationRecord>>>(API_PATHS.CONFIGURATION_LIST, {
    ...options,
    data: params,
  });
}

export function getConfigurationDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<ConfigurationRecord> {
  return request.post<BaseResponse<ConfigurationRecord>>(API_PATHS.CONFIGURATION_DETAIL(id), {
    ...options,
  });
}

export function createConfiguration(
  params: ConfigurationMutationPayload,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.CONFIGURATION_CREATE, {
    ...options,
    data: params,
  });
}

export function updateConfiguration(
  params: UpdateConfigurationPayload,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.CONFIGURATION_UPDATE, {
    ...options,
    data: params,
  });
}

export function deleteConfiguration(
  params: { id: string },
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.CONFIGURATION_DELETE, {
    ...options,
    data: params,
  });
}
