import { request } from "@service/request";
import type { ServiceRequestOptions } from "@service/request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";
import { API_PATHS } from "@constants/api";

export interface ArtifactRecord {
  id?: string;
  _id?: string;
  applicationId: string;
  pipelineId?: string;
  pipelineRunId?: string;
  repositoryId?: string;
  name: string;
  type: string;
  version: string;
  uri: string;
  imageRepo?: string;
  imageTag?: string;
  checksum?: string;
  sizeBytes?: number;
  commitSha?: string;
  status: "available" | "deprecated" | "deleted";
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface ArtifactListParams {
  applicationId: string;
  pipelineId?: string;
  version?: string;
  status?: "available" | "deprecated" | "deleted";
  pageNum?: number;
  pageSize?: number;
}

export function listArtifacts(
  params: ArtifactListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<ArtifactRecord>> {
  return request.post<BaseResponse<PaginatedList<ArtifactRecord>>>(API_PATHS.ARTIFACT_LIST, {
    ...options,
    data: params,
  });
}

export function getArtifactDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<ArtifactRecord> {
  return request.post<BaseResponse<ArtifactRecord>>(API_PATHS.ARTIFACT_DETAIL, {
    ...options,
    data: { id },
  });
}

export function listReleasableArtifacts(
  params: { applicationId: string; pipelineId?: string },
  options?: ServiceRequestOptions,
): ApiPromise<ArtifactRecord[]> {
  return request.post<BaseResponse<ArtifactRecord[]>>(API_PATHS.ARTIFACT_RELEASABLE, {
    ...options,
    data: params,
  });
}
