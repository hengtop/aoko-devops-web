import { request } from "../request";
import type { ServiceRequestOptions } from "../request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";

export type ConfigurationStatus = "enable" | "disable";

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
  return request.post<BaseResponse<PaginatedList<ConfigurationRecord>>>("/configuration/list", {
    ...options,
    data: params,
  });
}

export function getConfigurationDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<ConfigurationRecord> {
  return request.post<BaseResponse<ConfigurationRecord>>(`/configuration/detail/${id}`, {
    ...options,
  });
}

export function createConfiguration(
  params: ConfigurationMutationPayload,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>("/configuration/create", {
    ...options,
    data: params,
  });
}

export function updateConfiguration(
  params: UpdateConfigurationPayload,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>("/configuration/update", {
    ...options,
    data: params,
  });
}

export function deleteConfiguration(
  params: { id: string },
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>("/configuration/delete", {
    ...options,
    data: params,
  });
}
