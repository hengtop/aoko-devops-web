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
): ApiPromise<PipelineRecord> {
  return request.post<BaseResponse<PipelineRecord>>(API_PATHS.PIPELINE_CREATE, {
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

// ===== Pipeline Trigger =====

export type PipelineTriggerType = "webhook" | "manual" | "schedule";

export interface PipelineTriggerRecord {
  id?: string;
  _id?: string;
  pipelineId: string;
  triggerType: PipelineTriggerType;
  eventType?: string;
  branchPattern?: string;
  tagPattern?: string;
  cronExpr?: string;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePipelineTriggerParams {
  pipelineId: string;
  triggerType: PipelineTriggerType;
  eventType?: string;
  branchPattern?: string;
  tagPattern?: string;
  cronExpr?: string;
  enabled?: boolean;
}

export interface UpdatePipelineTriggerParams extends Partial<CreatePipelineTriggerParams> {
  id: string;
}

export function listPipelineTriggers(
  pipelineId: string,
  options?: ServiceRequestOptions,
): ApiPromise<PipelineTriggerRecord[]> {
  return request.post<BaseResponse<PipelineTriggerRecord[]>>(
    API_PATHS.PIPELINE_TRIGGER_LIST,
    { ...options, data: { pipelineId } },
  );
}

export function createPipelineTrigger(
  params: CreatePipelineTriggerParams,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.PIPELINE_TRIGGER_CREATE, {
    ...options,
    data: params,
  });
}

export function updatePipelineTrigger(
  params: UpdatePipelineTriggerParams,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.PIPELINE_TRIGGER_UPDATE, {
    ...options,
    data: params,
  });
}

export function deletePipelineTrigger(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.PIPELINE_TRIGGER_DELETE, {
    ...options,
    data: { id },
  });
}
