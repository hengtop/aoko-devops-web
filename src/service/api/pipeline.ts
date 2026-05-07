import { request } from "@service/request";
import type { ServiceRequestOptions } from "@service/request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";
import { API_PATHS } from "@constants/api";
import type { PipelineType, TriggerMode } from "@constants/cicd";

export type { PipelineType, TriggerMode };

export interface PipelineDefinitionVariable {
  key: string;
  value: string;
  isSecret?: boolean;
}

export interface PipelineJob {
  key: string;
  name: string;
  executorType: "shell" | "docker" | "deploy" | "artifact" | "system" | "manual_approval";
  timeoutSec?: number;
  retry?: number;
  config: Record<string, unknown>;
}

export interface PipelineStage {
  key: string;
  name: string;
  order: number;
  condition?: string;
  jobs: PipelineJob[];
}

export interface PipelineDefinition {
  variables?: PipelineDefinitionVariable[];
  approvalRequired?: boolean;
  stages: PipelineStage[];
}

export interface PipelineRecord {
  id?: string;
  _id?: string;
  applicationId: string;
  repositoryId?: string;
  name: string;
  code: string;
  type: PipelineType;
  triggerMode: TriggerMode;
  definition: PipelineDefinition;
  description?: string;
  enabled: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePipelineParams {
  applicationId: string;
  repositoryId?: string;
  name: string;
  code: string;
  type: PipelineType;
  triggerMode: TriggerMode;
  definition: PipelineDefinition;
  description?: string;
}

export interface UpdatePipelineParams extends Partial<CreatePipelineParams> {
  id: string;
}

export interface PipelineListParams {
  applicationId: string;
  type?: PipelineType;
  enabled?: boolean;
  pageNum?: number;
  pageSize?: number;
}

export function createPipeline(
  params: CreatePipelineParams,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.PIPELINE_CREATE, {
    ...options,
    data: params,
  });
}

export function listPipelines(
  params: PipelineListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<PipelineRecord>> {
  return request.post<BaseResponse<PaginatedList<PipelineRecord>>>(API_PATHS.PIPELINE_LIST, {
    ...options,
    data: params,
  });
}

export function getPipelineDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<PipelineRecord> {
  return request.post<BaseResponse<PipelineRecord>>(API_PATHS.PIPELINE_DETAIL, {
    ...options,
    data: { id },
  });
}

export function updatePipeline(
  params: UpdatePipelineParams,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.PIPELINE_UPDATE, {
    ...options,
    data: params,
  });
}

export function deletePipeline(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.PIPELINE_DELETE, {
    ...options,
    data: { id },
  });
}

export function togglePipeline(
  id: string,
  enabled: boolean,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.PIPELINE_TOGGLE, {
    ...options,
    data: { id, enabled },
  });
}

export function validatePipelineDefinition(
  definition: PipelineDefinition,
  options?: ServiceRequestOptions,
): ApiPromise<{ valid: boolean }> {
  return request.post<BaseResponse<{ valid: boolean }>>(API_PATHS.PIPELINE_VALIDATE, {
    ...options,
    data: { definition },
  });
}
