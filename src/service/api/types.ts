export type ResponseMessage = string | string[];

export interface BaseResponse<T = unknown> {
  success: boolean;
  msg: ResponseMessage;
  code: number;
  data?: T;
}

export type ApiPromise<T> = Promise<BaseResponse<T>>;

export interface PaginatedList<T> {
  total: number;
  list: T[];
}
