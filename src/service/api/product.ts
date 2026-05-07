import { request } from "@service/request";
import type { ServiceRequestOptions } from "@service/request";
import type { ApiPromise, BaseResponse, PaginatedList } from "./types";
import { API_PATHS } from "@constants/api";

export interface ProductRecord {
  id?: string;
  _id?: string;
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductParams {
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  avatar?: string;
}

export interface UpdateProductParams extends Partial<CreateProductParams> {
  id: string;
}

export interface ProductListParams {
  id?: string;
  name?: string;
  code?: string;
  tenantId?: string;
  pageNum?: number;
  pageSize?: number;
}

export function createProduct(
  params: CreateProductParams,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.PRODUCT_CREATE, {
    ...options,
    data: params,
  });
}

export function listProducts(
  params: ProductListParams,
  options?: ServiceRequestOptions,
): ApiPromise<PaginatedList<ProductRecord>> {
  return request.post<BaseResponse<PaginatedList<ProductRecord>>>(API_PATHS.PRODUCT_LIST, {
    ...options,
    data: params,
  });
}

export function getProductDetail(
  params: { id?: string; code?: string },
  options?: ServiceRequestOptions,
): ApiPromise<ProductRecord> {
  return request.post<BaseResponse<ProductRecord>>(API_PATHS.PRODUCT_DETAIL, {
    ...options,
    data: params,
  });
}

export function updateProduct(
  params: UpdateProductParams,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.PRODUCT_UPDATE, {
    ...options,
    data: params,
  });
}

export function deleteProduct(
  id: string,
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.PRODUCT_DELETE, {
    ...options,
    data: { id },
  });
}

export function addProductUser(
  productId: string,
  users: string[],
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.PRODUCT_ADD_USER, {
    ...options,
    data: { productId, users },
  });
}

export function removeProductUser(
  productId: string,
  users: string[],
  options?: ServiceRequestOptions,
): ApiPromise<void> {
  return request.post<BaseResponse<void>>(API_PATHS.PRODUCT_REMOVE_USER, {
    ...options,
    data: { productId, users },
  });
}

export function listProductUsers(
  productId: string,
  options?: ServiceRequestOptions,
): ApiPromise<{ total: number; list: unknown[] }> {
  return request.post<BaseResponse<{ total: number; list: unknown[] }>>(
    API_PATHS.PRODUCT_USER_LIST,
    { ...options, data: { productId } },
  );
}
