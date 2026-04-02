import { request } from "../request";
import type { ServiceRequestOptions } from "../request";
import type { ApiPromise, PaginatedList, BaseResponse } from "./types";

export interface TemplateRecord {
  id?: string;
  _id?: string;
  name: string;
  code: string;
  repo_url: string;
  description?: string;
  pipeline_cfg_id?: string;
  publish_cfg_id?: string;
}

export interface TemplateListParams {
  id?: string;
  name?: string;
  code?: string;
  repo_url?: string;
  description?: string;
  pipeline_cfg_id?: string;
  publish_cfg_id?: string;
  pageNum?: number;
  pageSize?: number;
}

export interface TemplateMutationPayload {
  name: string;
  code: string;
  repo_url: string;
  description?: string;
  pipeline_cfg_id?: string;
  publish_cfg_id?: string;
}

export interface UpdateTemplatePayload extends Partial<TemplateMutationPayload> {
  id: string;
}

export function listTemplates(
  params: TemplateListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<TemplateRecord>> {
  return request.post<BaseResponse<PaginatedList<TemplateRecord>>>("/template/list", {
    ...options,
    data: params,
  });
}

export function createTemplate(
  params: TemplateMutationPayload,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>("/template/create", {
    ...options,
    data: params,
  });
}

export function updateTemplate(
  params: UpdateTemplatePayload,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>("/template/update", {
    ...options,
    data: params,
  });
}

export function deleteTemplate(
  params: { id: string },
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>("/template/delete", {
    ...options,
    data: params,
  });
}
