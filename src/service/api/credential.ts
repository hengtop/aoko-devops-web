import { request } from "@service/request";
import type { ServiceRequestOptions } from "@service/request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";
import { API_PATHS } from "@constants/api";
import type { CredentialType } from "@constants/cicd";

export type { CredentialType };

export interface CredentialRecord {
  id?: string;
  _id?: string;
  applicationId?: string;
  name: string;
  type: CredentialType;
  description?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCredentialParams {
  applicationId?: string;
  name: string;
  type: CredentialType;
  content: string;
  extraConfig?: Record<string, unknown>;
  description?: string;
}

export interface UpdateCredentialParams extends Partial<CreateCredentialParams> {
  id: string;
}

export interface CredentialListParams {
  applicationId?: string;
  type?: CredentialType;
  pageNum?: number;
  pageSize?: number;
}

export function createCredential(
  params: CreateCredentialParams,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.CREDENTIAL_CREATE, {
    ...options,
    data: params,
  });
}

export function listCredentials(
  params: CredentialListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<CredentialRecord>> {
  return request.post<BaseResponse<PaginatedList<CredentialRecord>>>(
    API_PATHS.CREDENTIAL_LIST,
    { ...options, data: params },
  );
}

export function getCredentialDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<CredentialRecord> {
  return request.post<BaseResponse<CredentialRecord>>(API_PATHS.CREDENTIAL_DETAIL, {
    ...options,
    data: { id },
  });
}

export function updateCredential(
  params: UpdateCredentialParams,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.CREDENTIAL_UPDATE, {
    ...options,
    data: params,
  });
}

export function deleteCredential(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.CREDENTIAL_DELETE, {
    ...options,
    data: { id },
  });
}
