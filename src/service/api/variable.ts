import { request } from "@service/request";
import type { ServiceRequestOptions } from "@service/request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";
import { API_PATHS } from "@constants/api";
import type { VariableScopeType } from "@constants/cicd";

export type { VariableScopeType };

export interface VariableRecord {
  id?: string;
  _id?: string;
  applicationId: string;
  environmentId?: string;
  pipelineId?: string;
  scopeType: VariableScopeType;
  key: string;
  value: string;
  isSecret?: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVariableParams {
  applicationId: string;
  environmentId?: string;
  pipelineId?: string;
  scopeType: VariableScopeType;
  key: string;
  value: string;
  isSecret?: boolean;
  description?: string;
}

export interface UpdateVariableParams extends Partial<CreateVariableParams> {
  id: string;
}

export interface VariableListParams {
  applicationId: string;
  scopeType?: VariableScopeType;
  environmentId?: string;
  pipelineId?: string;
  pageNum?: number;
  pageSize?: number;
}

export function createVariable(
  params: CreateVariableParams,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.VARIABLE_CREATE, {
    ...options,
    data: params,
  });
}

export function listVariables(
  params: VariableListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<VariableRecord>> {
  return request.post<BaseResponse<PaginatedList<VariableRecord>>>(API_PATHS.VARIABLE_LIST, {
    ...options,
    data: params,
  });
}

export function updateVariable(
  params: UpdateVariableParams,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.VARIABLE_UPDATE, {
    ...options,
    data: params,
  });
}

export function deleteVariable(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.VARIABLE_DELETE, {
    ...options,
    data: { id },
  });
}
