import { request } from "../request";
import type { ServiceRequestOptions } from "../request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";

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
  return request.post<BaseResponse<PaginatedList<UserProfile>>>("/user/list", {
    ...options,
    data: params,
  });
}

export function getUserDetailById(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<UserProfile> {
  return request.post<BaseResponse<UserProfile>>(`/user/detail/${id}`, {
    ...options,
  });
}
