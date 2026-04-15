import { request } from "@service/request";
import type { ServiceRequestOptions } from "@service/request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";
import { API_PATHS } from "@constants/api";
import {
  APPROVAL_ACTION_TYPES,
  APPROVAL_APPROVER_SOURCE_TYPES,
  APPROVAL_INSTANCE_STATUSES,
  APPROVAL_NODE_MODES,
  APPROVAL_NOTIFY_CHANNELS,
  APPROVAL_POLICY_MATCH_MODES,
  APPROVAL_SOURCE_TYPES,
  APPROVAL_TASK_STATUSES,
  APPROVAL_TEMPLATE_BIZ_TYPES,
  APPROVAL_TEMPLATE_STATUSES,
} from "@constants/status";

export type ApprovalTemplateBizType =
  (typeof APPROVAL_TEMPLATE_BIZ_TYPES)[keyof typeof APPROVAL_TEMPLATE_BIZ_TYPES];
export type ApprovalTemplateStatus =
  (typeof APPROVAL_TEMPLATE_STATUSES)[keyof typeof APPROVAL_TEMPLATE_STATUSES];
export type ApprovalNodeMode = (typeof APPROVAL_NODE_MODES)[keyof typeof APPROVAL_NODE_MODES];
export type ApprovalApproverSourceType =
  (typeof APPROVAL_APPROVER_SOURCE_TYPES)[keyof typeof APPROVAL_APPROVER_SOURCE_TYPES];
export type ApprovalNotifyChannel =
  (typeof APPROVAL_NOTIFY_CHANNELS)[keyof typeof APPROVAL_NOTIFY_CHANNELS];

export type ApprovalPolicyStatus =
  (typeof APPROVAL_TEMPLATE_STATUSES)[keyof typeof APPROVAL_TEMPLATE_STATUSES];
export type ApprovalPolicyMatchMode =
  (typeof APPROVAL_POLICY_MATCH_MODES)[keyof typeof APPROVAL_POLICY_MATCH_MODES];
export type ApprovalPolicyTargetType =
  (typeof APPROVAL_TEMPLATE_BIZ_TYPES)[keyof typeof APPROVAL_TEMPLATE_BIZ_TYPES];

export type ApprovalSourceType =
  (typeof APPROVAL_SOURCE_TYPES)[keyof typeof APPROVAL_SOURCE_TYPES];
export type ApprovalInstanceStatus =
  (typeof APPROVAL_INSTANCE_STATUSES)[keyof typeof APPROVAL_INSTANCE_STATUSES];

export type ApprovalTaskStatus =
  (typeof APPROVAL_TASK_STATUSES)[keyof typeof APPROVAL_TASK_STATUSES];

export type ApprovalActionType =
  (typeof APPROVAL_ACTION_TYPES)[keyof typeof APPROVAL_ACTION_TYPES];

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
    API_PATHS.APPROVAL_TEMPLATE_LIST,
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
  return request.post<BaseResponse<ApprovalTemplateRecord>>(API_PATHS.APPROVAL_TEMPLATE_DETAIL(id), {
    ...options,
  });
}

export function createApprovalTemplate(
  params: ApprovalTemplateMutationPayload,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalTemplateRecord> {
  return request.post<BaseResponse<ApprovalTemplateRecord>>(API_PATHS.APPROVAL_TEMPLATE_CREATE, {
    ...options,
    data: params,
  });
}

export function updateApprovalTemplate(
  params: UpdateApprovalTemplatePayload,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalTemplateRecord> {
  const { id, ...payload } = params;
  return request.post<BaseResponse<ApprovalTemplateRecord>>(API_PATHS.APPROVAL_TEMPLATE_UPDATE(id), {
    ...options,
    data: payload,
  });
}

export function deleteApprovalTemplate(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.APPROVAL_TEMPLATE_DELETE(id), {
    ...options,
  });
}

export function listApprovalPolicies(
  params: ApprovalPolicyListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<ApprovalPolicyRecord>> {
  return request.post<BaseResponse<PaginatedList<ApprovalPolicyRecord>>>(API_PATHS.APPROVAL_POLICY_LIST, {
    ...options,
    data: params,
  });
}

export function getApprovalPolicyDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalPolicyRecord> {
  return request.post<BaseResponse<ApprovalPolicyRecord>>(API_PATHS.APPROVAL_POLICY_DETAIL(id), {
    ...options,
  });
}

export function createApprovalPolicy(
  params: ApprovalPolicyMutationPayload,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalPolicyRecord> {
  return request.post<BaseResponse<ApprovalPolicyRecord>>(API_PATHS.APPROVAL_POLICY_CREATE, {
    ...options,
    data: params,
  });
}

export function updateApprovalPolicy(
  params: UpdateApprovalPolicyPayload,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalPolicyRecord> {
  const { id, ...payload } = params;
  return request.post<BaseResponse<ApprovalPolicyRecord>>(API_PATHS.APPROVAL_POLICY_UPDATE(id), {
    ...options,
    data: payload,
  });
}

export function deleteApprovalPolicy(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.APPROVAL_POLICY_DELETE(id), {
    ...options,
  });
}

export function listApprovals(
  params: ApprovalListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<ApprovalInstanceRecord>> {
  return request.post<BaseResponse<PaginatedList<ApprovalInstanceRecord>>>(API_PATHS.APPROVAL_LIST, {
    ...options,
    data: params,
  });
}

export function getApprovalDetail(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalInstanceRecord> {
  return request.post<BaseResponse<ApprovalInstanceRecord>>(API_PATHS.APPROVAL_DETAIL(id), {
    ...options,
  });
}

export function createApproval(
  params: CreateApprovalPayload,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalInstanceRecord> {
  return request.post<BaseResponse<ApprovalInstanceRecord>>(API_PATHS.APPROVAL_CREATE, {
    ...options,
    data: params,
  });
}

export function cancelApproval(
  id: string,
  params: ApprovalCommentPayload,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalInstanceRecord> {
  return request.post<BaseResponse<ApprovalInstanceRecord>>(API_PATHS.APPROVAL_CANCEL(id), {
    ...options,
    data: params,
  });
}

export function approveApproval(
  id: string,
  params: ApprovalCommentPayload,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalInstanceRecord> {
  return request.post<BaseResponse<ApprovalInstanceRecord>>(API_PATHS.APPROVAL_APPROVE(id), {
    ...options,
    data: params,
  });
}

export function rejectApproval(
  id: string,
  params: ApprovalCommentPayload,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalInstanceRecord> {
  return request.post<BaseResponse<ApprovalInstanceRecord>>(API_PATHS.APPROVAL_REJECT(id), {
    ...options,
    data: params,
  });
}

export function transferApproval(
  id: string,
  params: TransferApprovalPayload,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalInstanceRecord> {
  return request.post<BaseResponse<ApprovalInstanceRecord>>(API_PATHS.APPROVAL_TRANSFER(id), {
    ...options,
    data: params,
  });
}

export function addApprovalApprover(
  id: string,
  params: AddApproverPayload,
  options?: ServiceRequestOptions,
): ApiPromise<ApprovalInstanceRecord> {
  return request.post<BaseResponse<ApprovalInstanceRecord>>(API_PATHS.APPROVAL_ADD_APPROVER(id), {
    ...options,
    data: params,
  });
}

export function listMyPendingApprovalTasks(
  params: ApprovalTaskListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<ApprovalTaskRecord>> {
  return request.post<BaseResponse<PaginatedList<ApprovalTaskRecord>>>(API_PATHS.APPROVAL_TASK_MY_PENDING, {
    ...options,
    data: params,
  });
}

export function listMyDoneApprovalTasks(
  params: ApprovalTaskListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<ApprovalTaskRecord>> {
  return request.post<BaseResponse<PaginatedList<ApprovalTaskRecord>>>(API_PATHS.APPROVAL_TASK_MY_DONE, {
    ...options,
    data: params,
  });
}
