import { request } from "@service/request";
import type { ServiceRequestOptions } from "@service/request";
import type { ApiPromise, BaseResponse } from "./types";
import { API_PATHS } from "@constants/api";
import { LOGIN_TYPES } from "@constants/status";

export type LoginType = (typeof LOGIN_TYPES)[keyof typeof LOGIN_TYPES];

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
  return request.post<BaseResponse<LoginToken>>(API_PATHS.USER_LOGIN, {
    skipAuthFailureRedirect: true,
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
  return request.post<BaseResponse<void>>(API_PATHS.EMAIL_SEND_CODE, {
    skipAuthFailureRedirect: true,
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
  return request.post<BaseResponse<void>>(API_PATHS.USER_REGISTER, {
    skipAuthFailureRedirect: true,
    ...options,
    data: params,
  });
}

export function logout(options?: ServiceRequestOptions): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.USER_LOGOUT, {
    ...options,
  });
}
