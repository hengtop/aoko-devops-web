import { request } from "@service/request";
import type { ServiceRequestOptions } from "@service/request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";
import { API_PATHS } from "@constants/api";

export interface UserProfile {
  id?: string;
  _id?: string;
  name?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  state?: string;
}

export interface UserListParams {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  state?: string;
  pageNum?: number;
  pageSize?: number;
}

export function listUsers(
  params: UserListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<UserProfile>> {
  return request.post<BaseResponse<PaginatedList<UserProfile>>>(API_PATHS.USER_LIST, {
    ...options,
    data: params,
  });
}

export function getUserDetailById(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<UserProfile> {
  return request.post<BaseResponse<UserProfile>>(API_PATHS.USER_DETAIL(id), {
    ...options,
  });
}
