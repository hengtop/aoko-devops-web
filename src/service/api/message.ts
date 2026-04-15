import { request } from "@service/request";
import type { ServiceRequestOptions } from "@service/request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";
import { API_PATHS } from "@constants/api";
import { MESSAGE_READ_STATUSES, MESSAGE_STATUSES, MESSAGE_TARGET_TYPES } from "@constants/status";

export type MessageStatus = (typeof MESSAGE_STATUSES)[keyof typeof MESSAGE_STATUSES];
export type MessageTargetType = (typeof MESSAGE_TARGET_TYPES)[keyof typeof MESSAGE_TARGET_TYPES];
export type MessageReadStatus = (typeof MESSAGE_READ_STATUSES)[keyof typeof MESSAGE_READ_STATUSES];

export interface MessageSender {
  id?: string;
  name?: string;
  avatar?: string;
}

export interface MessageRecord {
  id?: string;
  _id?: string;
  title: string;
  content: string;
  summary?: string;
  target_type?: MessageTargetType;
  target_users?: string[];
  recipient_users?: string[];
  recipient_count?: number;
  sender?: MessageSender;
  sentAt?: number;
  status?: MessageStatus;
  read_status?: MessageReadStatus;
  readAt?: number;
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface MessageListParams {
  id?: string;
  title?: string;
  summary?: string;
  target_type?: MessageTargetType;
  status?: MessageStatus;
  read_status?: MessageReadStatus;
  pageNum?: number;
  pageSize?: number;
}

export interface MessageMutationPayload {
  title: string;
  content: string;
  summary?: string;
  target_type: MessageTargetType;
  target_users?: string[];
}

export interface UpdateMessagePayload extends Partial<MessageMutationPayload> {
  id: string;
}

export function listMessages(
  params: Omit<MessageListParams, "read_status">,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<MessageRecord>> {
  return request.post<BaseResponse<PaginatedList<MessageRecord>>>(API_PATHS.MESSAGE_LIST, {
    ...options,
    data: params,
  });
}

export function getMessageDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<MessageRecord> {
  return request.post<BaseResponse<MessageRecord>>(API_PATHS.MESSAGE_DETAIL, {
    ...options,
    data: { id },
  });
}

export function createMessage(
  params: MessageMutationPayload,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.MESSAGE_CREATE, {
    ...options,
    data: params,
  });
}

export function updateMessage(
  params: UpdateMessagePayload,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.MESSAGE_UPDATE, {
    ...options,
    data: params,
  });
}

export function deleteMessage(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.MESSAGE_DELETE, {
    ...options,
    data: { id },
  });
}

export function sendMessage(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.MESSAGE_SEND, {
    ...options,
    data: { id },
  });
}

export function listMyMessages(
  params: MessageListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<MessageRecord>> {
  return request.post<BaseResponse<PaginatedList<MessageRecord>>>(API_PATHS.MESSAGE_MY_LIST, {
    ...options,
    data: params,
  });
}

export function getMyMessageDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<MessageRecord> {
  return request.post<BaseResponse<MessageRecord>>(API_PATHS.MESSAGE_MY_DETAIL, {
    ...options,
    data: { id },
  });
}

export function markMyMessageAsRead(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.MESSAGE_MY_READ, {
    ...options,
    data: { id },
  });
}
