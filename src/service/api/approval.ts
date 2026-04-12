import { request } from "../request";
import type { ServiceRequestOptions } from "../request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";

export type ApprovalTemplateBizType = "release" | "deployment" | "api_gate";
export type ApprovalTemplateStatus = "enable" | "disable";
export type ApprovalNodeMode = "OR" | "AND";
export type ApprovalApproverSourceType = "USER" | "ROLE";
export type ApprovalNotifyChannel = "site" | "email";

export type ApprovalPolicyStatus = "enable" | "disable";
export type ApprovalPolicyMatchMode = "first_match";
export type ApprovalPolicyTargetType = "release" | "deployment" | "api_gate";

export type ApprovalSourceType = "manual" | "system" | "api_gate";
export type ApprovalInstanceStatus =
  | "pending"
  | "in_progress"
  | "approved"
  | "rejected"
  | "canceled"
  | "expired";

export type ApprovalTaskStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "transferred"
  | "canceled"
  | "skipped";

export type ApprovalActionType =
  | "submit"
  | "approve"
  | "reject"
  | "cancel"
  | "transfer"
  | "add_approver"
  | "system_notify";

export interface ApprovalTemplateNode {
  nodeCode: string;
  nodeName: string;
  order: number;
  approvalMode: ApprovalNodeMode;
  approverSourceType: ApprovalApproverSourceType;
  approverIds: string[];
  allowTransfer?: boolean;
  allowAddApprover?: boolean;
  notifyChannels?: ApprovalNotifyChannel[];
}

export interface ApprovalTemplateRecord {
  id?: string;
  _id?: string;
  name: string;
  code: string;
  bizType: ApprovalTemplateBizType;
  status?: ApprovalTemplateStatus;
  description?: string;
  version?: number;
  nodes: ApprovalTemplateNode[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ApprovalTemplateListParams {
  id?: string;
  name?: string;
  code?: string;
  bizType?: ApprovalTemplateBizType;
  status?: ApprovalTemplateStatus;
  description?: string;
  pageNum?: number;
  pageSize?: number;
}

export interface ApprovalTemplateMutationPayload {
  name: string;
  code: string;
  bizType: ApprovalTemplateBizType;
  status?: ApprovalTemplateStatus;
  description?: string;
  version?: number;
  nodes: ApprovalTemplateNode[];
}

export interface UpdateApprovalTemplatePayload extends Partial<ApprovalTemplateMutationPayload> {
  id: string;
}

export interface ApprovalPolicyCondition {
  tenantIds?: string[];
  productIds?: string[];
  applicationIds?: string[];
  environments?: string[];
  operatorIds?: string[];
  httpMethod?: string;
  gateCode?: string;
}

export interface ApprovalPolicyRule {
  priority?: number;
  enabled?: boolean;
  conditions?: ApprovalPolicyCondition;
  templateId: string;
}

export interface ApprovalPolicyRecord {
  id?: string;
  _id?: string;
  name: string;
  code: string;
  status?: ApprovalPolicyStatus;
  targetType: ApprovalPolicyTargetType;
  targetCode?: string;
  matchMode?: ApprovalPolicyMatchMode;
  rules: ApprovalPolicyRule[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ApprovalPolicyListParams {
  id?: string;
  name?: string;
  code?: string;
  status?: ApprovalPolicyStatus;
  targetType?: ApprovalPolicyTargetType;
  targetCode?: string;
  pageNum?: number;
  pageSize?: number;
}

export interface ApprovalPolicyMutationPayload {
  name: string;
  code: string;
  status?: ApprovalPolicyStatus;
  targetType: ApprovalPolicyTargetType;
  targetCode?: string;
  matchMode?: ApprovalPolicyMatchMode;
  rules: ApprovalPolicyRule[];
}

export interface UpdateApprovalPolicyPayload extends Partial<ApprovalPolicyMutationPayload> {
  id: string;
}

export interface ApprovalActionRecord {
  id?: string;
  _id?: string;
  instanceId: string;
  nodeCode?: string;
  operatorId?: string;
  action: ApprovalActionType;
  comment?: string;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApprovalTaskRecord {
  id?: string;
  _id?: string;
  instanceId: string;
  nodeCode: string;
  nodeName: string;
  approverId: string;
  originApproverId?: string;
  status?: ApprovalTaskStatus;
  comment?: string;
  actedAt?: string;
  notifiedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  instance?: ApprovalInstanceRecord;
}

export interface ApprovalInstanceRecord {
  id?: string;
  _id?: string;
  title: string;
  bizType: ApprovalTemplateBizType;
  bizId?: string;
  bizNo?: string;
  sourceType?: ApprovalSourceType;
  templateId?: string;
  templateSnapshot?: Record<string, unknown>;
  policyId?: string;
  policySnapshot?: Record<string, unknown>;
  status?: ApprovalInstanceStatus;
  currentNodeCode?: string;
  currentNodeIndex?: number;
  applicantId?: string;
  reason?: string;
  requestSnapshot?: Record<string, unknown>;
  requestFingerprint?: string;
  approvedAt?: string;
  rejectedAt?: string;
  canceledAt?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  tasks?: ApprovalTaskRecord[];
  actionRecords?: ApprovalActionRecord[];
}

export interface ApprovalListParams {
  id?: string;
  title?: string;
  bizType?: ApprovalTemplateBizType;
  bizId?: string;
  bizNo?: string;
  sourceType?: ApprovalSourceType;
  status?: ApprovalInstanceStatus;
  applicantId?: string;
  currentNodeCode?: string;
  pageNum?: number;
  pageSize?: number;
}

export interface CreateApprovalPayload {
  title: string;
  bizType: ApprovalTemplateBizType;
  bizId?: string;
  bizNo?: string;
  sourceType?: ApprovalSourceType;
  templateId?: string;
  policyId?: string;
  policyTargetType?: ApprovalPolicyTargetType;
  policyTargetCode?: string;
  tenantId?: string;
  productId?: string;
  applicationId?: string;
  environment?: string;
  httpMethod?: string;
  gateCode?: string;
  reason?: string;
  requestSnapshot?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ApprovalCommentPayload {
  comment?: string;
}

export interface TransferApprovalPayload extends ApprovalCommentPayload {
  targetApproverId: string;
}

export interface AddApproverPayload extends ApprovalCommentPayload {
  approverId: string;
}

export interface ApprovalTaskListParams {
  id?: string;
  bizType?: ApprovalTemplateBizType;
  instanceStatus?: ApprovalInstanceStatus;
  pageNum?: number;
  pageSize?: number;
}

export function listApprovalTemplates(
  params: ApprovalTemplateListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<ApprovalTemplateRecord>> {
  return request.post<BaseResponse<PaginatedList<ApprovalTemplateRecord>>>(
    "/approval-template/list",
    {
      ...options,
      data: params,
    },
  );
}

export function getApprovalTemplateDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalTemplateRecord> {
  return request.post<BaseResponse<ApprovalTemplateRecord>>(`/approval-template/detail/${id}`, {
    ...options,
  });
}

export function createApprovalTemplate(
  params: ApprovalTemplateMutationPayload,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalTemplateRecord> {
  return request.post<BaseResponse<ApprovalTemplateRecord>>("/approval-template/create", {
    ...options,
    data: params,
  });
}

export function updateApprovalTemplate(
  params: UpdateApprovalTemplatePayload,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalTemplateRecord> {
  const { id, ...payload } = params;
  return request.post<BaseResponse<ApprovalTemplateRecord>>(`/approval-template/update/${id}`, {
    ...options,
    data: payload,
  });
}

export function deleteApprovalTemplate(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(`/approval-template/delete/${id}`, {
    ...options,
  });
}

export function listApprovalPolicies(
  params: ApprovalPolicyListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<ApprovalPolicyRecord>> {
  return request.post<BaseResponse<PaginatedList<ApprovalPolicyRecord>>>("/approval-policy/list", {
    ...options,
    data: params,
  });
}

export function getApprovalPolicyDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalPolicyRecord> {
  return request.post<BaseResponse<ApprovalPolicyRecord>>(`/approval-policy/detail/${id}`, {
    ...options,
  });
}

export function createApprovalPolicy(
  params: ApprovalPolicyMutationPayload,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalPolicyRecord> {
  return request.post<BaseResponse<ApprovalPolicyRecord>>("/approval-policy/create", {
    ...options,
    data: params,
  });
}

export function updateApprovalPolicy(
  params: UpdateApprovalPolicyPayload,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalPolicyRecord> {
  const { id, ...payload } = params;
  return request.post<BaseResponse<ApprovalPolicyRecord>>(`/approval-policy/update/${id}`, {
    ...options,
    data: payload,
  });
}

export function deleteApprovalPolicy(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(`/approval-policy/delete/${id}`, {
    ...options,
  });
}

export function listApprovals(
  params: ApprovalListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<ApprovalInstanceRecord>> {
  return request.post<BaseResponse<PaginatedList<ApprovalInstanceRecord>>>("/approval/list", {
    ...options,
    data: params,
  });
}

export function getApprovalDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalInstanceRecord> {
  return request.post<BaseResponse<ApprovalInstanceRecord>>(`/approval/detail/${id}`, {
    ...options,
  });
}

export function createApproval(
  params: CreateApprovalPayload,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalInstanceRecord> {
  return request.post<BaseResponse<ApprovalInstanceRecord>>("/approval/create", {
    ...options,
    data: params,
  });
}

export function cancelApproval(
  id: string,
  params: ApprovalCommentPayload,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalInstanceRecord> {
  return request.post<BaseResponse<ApprovalInstanceRecord>>(`/approval/cancel/${id}`, {
    ...options,
    data: params,
  });
}

export function approveApproval(
  id: string,
  params: ApprovalCommentPayload,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalInstanceRecord> {
  return request.post<BaseResponse<ApprovalInstanceRecord>>(`/approval/${id}/approve`, {
    ...options,
    data: params,
  });
}

export function rejectApproval(
  id: string,
  params: ApprovalCommentPayload,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalInstanceRecord> {
  return request.post<BaseResponse<ApprovalInstanceRecord>>(`/approval/${id}/reject`, {
    ...options,
    data: params,
  });
}

export function transferApproval(
  id: string,
  params: TransferApprovalPayload,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalInstanceRecord> {
  return request.post<BaseResponse<ApprovalInstanceRecord>>(`/approval/${id}/transfer`, {
    ...options,
    data: params,
  });
}

export function addApprovalApprover(
  id: string,
  params: AddApproverPayload,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalInstanceRecord> {
  return request.post<BaseResponse<ApprovalInstanceRecord>>(`/approval/${id}/add-approver`, {
    ...options,
    data: params,
  });
}

export function listMyPendingApprovalTasks(
  params: ApprovalTaskListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<ApprovalTaskRecord>> {
  return request.post<BaseResponse<PaginatedList<ApprovalTaskRecord>>>("/approval-task/my/pending", {
    ...options,
    data: params,
  });
}

export function listMyDoneApprovalTasks(
  params: ApprovalTaskListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<ApprovalTaskRecord>> {
  return request.post<BaseResponse<PaginatedList<ApprovalTaskRecord>>>("/approval-task/my/done", {
    ...options,
    data: params,
  });
}
