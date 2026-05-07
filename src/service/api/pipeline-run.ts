import { request } from "@service/request";
import type { ServiceRequestOptions } from "@service/request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";
import { API_PATHS } from "@constants/api";
import type { PipelineRunStatus } from "@constants/cicd";

export type { PipelineRunStatus };

export interface PipelineRunRecord {
  id?: string;
  _id?: string;
  pipelineId: string;
  applicationId?: string;
  status: PipelineRunStatus;
  sourceRef?: string;
  sourceType?: "branch" | "tag";
  commitSha?: string;
  commitMessage?: string;
  runNumber: number;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  createdAt?: string;
}

export interface StageRunRecord {
  id?: string;
  _id?: string;
  pipelineRunId: string;
  stageKey: string;
  stageName: string;
  stageOrder: number;
  status: "pending" | "running" | "success" | "failed" | "skipped" | "canceled";
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
}

export interface JobRunRecord {
  id?: string;
  _id?: string;
  pipelineRunId: string;
  stageRunId: string;
  jobKey: string;
  jobName: string;
  executorType: string;
  status: "pending" | "queued" | "running" | "success" | "failed" | "skipped" | "canceled" | "timeout";
  retryCount?: number;
  logContent?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
}

export interface TriggerPipelineRunParams {
  pipelineId: string;
  sourceRef?: string;
  sourceType?: "branch" | "tag";
  commitSha?: string;
  commitMessage?: string;
  variables?: Record<string, string>;
}

export interface PipelineRunListParams {
  pipelineId: string;
  status?: PipelineRunStatus;
  sourceRef?: string;
  pageNum?: number;
  pageSize?: number;
}

export function triggerPipelineRun(
  params: TriggerPipelineRunParams,
  options?: ServiceRequestOptions,
): ApiPromise<PipelineRunRecord> {
  return request.post<BaseResponse<PipelineRunRecord>>(API_PATHS.PIPELINE_RUN_TRIGGER, {
    ...options,
    data: params,
  });
}

export function listPipelineRuns(
  params: PipelineRunListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<PipelineRunRecord>> {
  return request.post<BaseResponse<PaginatedList<PipelineRunRecord>>>(
    API_PATHS.PIPELINE_RUN_LIST,
    { ...options, data: params },
  );
}

export function getPipelineRunDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<PipelineRunRecord> {
  return request.post<BaseResponse<PipelineRunRecord>>(API_PATHS.PIPELINE_RUN_DETAIL, {
    ...options,
    data: { id },
  });
}

export function cancelPipelineRun(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.PIPELINE_RUN_CANCEL, {
    ...options,
    data: { id },
  });
}

export function retryPipelineRun(
  id: string,
  fromFailedOnly?: boolean,
  options?: ServiceRequestOptions,
): ApiPromise<PipelineRunRecord> {
  return request.post<BaseResponse<PipelineRunRecord>>(API_PATHS.PIPELINE_RUN_RETRY, {
    ...options,
    data: { id, fromFailedOnly },
  });
}

export function getPipelineRunStages(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<StageRunRecord[]> {
  return request.post<BaseResponse<StageRunRecord[]>>(API_PATHS.PIPELINE_RUN_STAGES, {
    ...options,
    data: { id },
  });
}

export function getPipelineRunJobs(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<JobRunRecord[]> {
  return request.post<BaseResponse<JobRunRecord[]>>(API_PATHS.PIPELINE_RUN_JOBS, {
    ...options,
    data: { id },
  });
}

export function getPipelineRunJobDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<JobRunRecord> {
  return request.post<BaseResponse<JobRunRecord>>(API_PATHS.PIPELINE_RUN_JOB_DETAIL, {
    ...options,
    data: { id },
  });
}
