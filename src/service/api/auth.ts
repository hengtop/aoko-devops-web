import { request } from "../request";
import type { ServiceRequestOptions } from "../request";
import type { ApiPromise, BaseResponse } from "./types";

export type LoginType = "password" | "phone" | "email";

export interface LoginParams {
  username?: string;
  phone?: string;
  email?: string;
  password?: string;
  authCode?: string;
  type: LoginType;
}

export interface LoginToken {
  token: string;
}

export function login(params: LoginParams, options?: ServiceRequestOptions): ApiPromise<LoginToken> {
  return request.post<BaseResponse<LoginToken>>("/user/login", {
    ...options,
    data: params,
  });
}

export interface SendEmailCodeParams {
  email: string;
}

export function sendEmailCode(
  params: SendEmailCodeParams,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>("/email/sendCode", {
    ...options,
    data: params,
  });
}

export interface RegisterParams {
  phone: string;
  username: string;
  email?: string;
  password: string;
  authCode: string;
  inviationCode: string;
}

export function register(
  params: RegisterParams,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>("/user/register", {
    ...options,
    data: params,
  });
}
