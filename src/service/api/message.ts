import { request } from "../request";
import type { ServiceRequestOptions } from "../request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";

export type MessageStatus = "draft" | "sent";
export type MessageTargetType = "personal" | "group" | "all";
export type MessageReadStatus = "unread" | "read";

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
  return request.post<BaseResponse<PaginatedList<MessageRecord>>>("/message/list", {
    ...options,
    data: params,
  });
}

export function getMessageDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<MessageRecord> {
  return request.post<BaseResponse<MessageRecord>>("/message/detail", {
    ...options,
    data: { id },
  });
}

export function createMessage(
  params: MessageMutationPayload,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>("/message/create", {
    ...options,
    data: params,
  });
}

export function updateMessage(
  params: UpdateMessagePayload,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>("/message/update", {
    ...options,
    data: params,
  });
}

export function deleteMessage(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>("/message/delete", {
    ...options,
    data: { id },
  });
}

export function sendMessage(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>("/message/send", {
    ...options,
    data: { id },
  });
}

export function listMyMessages(
  params: MessageListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<MessageRecord>> {
  return request.post<BaseResponse<PaginatedList<MessageRecord>>>("/message/my/list", {
    ...options,
    data: params,
  });
}

export function getMyMessageDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<MessageRecord> {
  return request.post<BaseResponse<MessageRecord>>("/message/my/detail", {
    ...options,
    data: { id },
  });
}

export function markMyMessageAsRead(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>("/message/my/read", {
    ...options,
    data: { id },
  });
}
