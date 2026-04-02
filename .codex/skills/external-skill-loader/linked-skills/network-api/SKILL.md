---
name: network-api
description: 根据接口文档或用户输入，为前端项目新增 API 路径枚举、请求函数与 TypeScript 类型定义。
source: https://fiture.feishu.cn/wiki/Urhbw6bQmigrDEkU191cmu0bnBd
synced_by: external-skill-loader
---

# network-api

根据接口文档或用户输入，为前端项目新增 API 路径枚举、请求函数与 TypeScript 类型定义；当用户有新增接口、定义请求函数、补全请求响应类型的意图时使用。

## 接口 API 生成规范

### 自动触发

当出现以下意图时启用本规范：

- 新增接口
- 定义 API 请求函数
- 根据接口文档生成前端请求
- 补齐 Req/Res 类型
- 新增列表 / 详情 / 批量操作接口

### 目标

统一前端接口定义方式，确保：

- 路径常量集中管理
- 请求函数命名一致
- 请求参数与响应参数有明确类型
- 不凭空捏造字段，信息不足时先向用户确认

### 前置输入要求（必须）

生成前必须获取以下信息：

- 接口路径（如 `/api/report/detail`）
- HTTP 方法（`GET` / `POST` / `PUT` / `DELETE` / `PATCH`）
- 参数位置（`path` / `query` / `body` / `header`）
- 响应数据结构（至少主要字段）
- 是否分页、是否批量、是否上传下载

若信息不全，必须先提问补齐，禁止猜测。

### 路径声明规范

规则：

- 在项目 API 常量目录维护路径枚举（如 `src/constants/api.ts`）
- 枚举键名使用大写下划线，语义清晰
- 值为后端原始路径字符串，不做拼接魔法

示例：

```ts
export enum Api {
  REPORT_DETAIL = '/api/report/detail',
  REPORT_LIST = '/api/report/list',
  REPORT_BATCH_UPDATE = '/api/report/batch-update',
  USER_DETAIL = '/api/user/:id',
  FILE_UPLOAD = '/api/file/upload',
}
```

### 请求函数命名规范

以资源 `XXX` 为例：

- `getXXXDetail`：获取单个详情
- `getXXXList`：获取列表
- `addXXX`：新增单个
- `batchAddXXX`：新增多个
- `updateXXX`：更新单个
- `batchUpdateXXX`：更新多个
- `deleteXXX`：删除单个
- `batchDeleteXXX`：删除多个

若项目已有命名习惯（如 `createXXX`），优先与项目保持一致，不混用多套命名。

### 类型定义规范

基本规则：

- 类型名格式：函数名 + `Req` / `Res`，首字母大写
- 请求函数默认导出 `Promise<ResType>`
- 类型必须来源于接口文档或用户输入；拿不到字段时先提问

推荐通用类型：

```ts
export interface PageReq {
  pageNum: number;
  pageSize: number;
}

export interface PageRes<T> {
  total: number;
  list: T[];
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
```

### 请求函数实现规范

- 明确 `method`
- `GET` 参数放 `params`，`POST` / `PUT` / `PATCH` 参数放 `data`
- `path` 参数在调用前替换
- 返回值声明为 `Promise<XxxRes>`
- 保持单一职责，一个函数只做一个接口调用

### 示例 1：详情 + 批量更新

路径枚举：

```ts
export enum Api {
  XXX_DETAIL = '/api/path',
  XXX_BATCH_UPDATE = '/boo/par',
}
```

类型定义：

```ts
export interface GetXXXDetailReq {
  id: string;
}

export interface GetXXXDetailRes {
  id: string;
  name: string;
  status: 'enabled' | 'disabled';
}

export interface BatchUpdateXXXReq {
  ids: string[];
  status: 'enabled' | 'disabled';
}

export interface BatchUpdateXXXRes {
  successCount: number;
  failCount: number;
}
```

请求函数：

```ts
import request from '@/request';
import { Api } from '@/constants/api';

export const getXXXDetail = (
  params: GetXXXDetailReq,
): Promise<GetXXXDetailRes> => {
  return request.get(Api.XXX_DETAIL, { params });
};

export const batchUpdateXXX = (
  params: BatchUpdateXXXReq,
): Promise<BatchUpdateXXXRes> => {
  return request.post(Api.XXX_BATCH_UPDATE, params);
};
```

### 示例 2：列表分页接口

```ts
export enum Api {
  REPORT_LIST = '/api/report/list',
}

export interface ReportItem {
  id: string;
  title: string;
  createdAt: string;
}

export interface GetReportListReq extends PageReq {
  keyword?: string;
  status?: number;
}

export type GetReportListRes = PageRes<ReportItem>;
```

```ts
import request from '@/request';
import { Api } from '@/constants/api';

export const getReportList = (
  params: GetReportListReq,
): Promise<GetReportListRes> => {
  return request.get(Api.REPORT_LIST, { params });
};
```

### 示例 3：带路径参数的详情接口

```ts
export enum Api {
  USER_DETAIL = '/api/user/:id',
}

export interface GetUserDetailReq {
  id: string;
}

export interface GetUserDetailRes {
  id: string;
  nickname: string;
  avatar: string;
}
```

```ts
import request from '@/request';
import { Api } from '@/constants/api';

export const getUserDetail = (
  params: GetUserDetailReq,
): Promise<GetUserDetailRes> => {
  const url = Api.USER_DETAIL.replace(':id', params.id);
  return request.get(url);
};
```

### 示例 4：文件上传接口

```ts
export enum Api {
  FILE_UPLOAD = '/api/file/upload',
}

export interface UploadFileReq {
  file: File;
  bizType: 'avatar' | 'report';
}

export interface UploadFileRes {
  fileId: string;
  url: string;
}
```

```ts
import request from '@/request';
import { Api } from '@/constants/api';

export const uploadFile = (
  params: UploadFileReq,
): Promise<UploadFileRes> => {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('bizType', params.bizType);

  return request.post(Api.FILE_UPLOAD, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
```

### 信息缺失时的提问模板（强制）

当文档不完整时，按以下顺序提问：

1. 该接口的完整路径和 HTTP 方法是什么？
2. 请求参数分别在 `path`、`query`、`body` 的哪些字段？
3. 响应 `data` 的字段结构是什么？是否有分页结构（`list` / `total`）？
4. 是否需要批量操作、上传下载、鉴权特殊 header？
5. 是否有现成的后端文档链接或示例响应？

### 禁止事项

- 禁止凭空捏造请求字段、响应字段
- 禁止在未确认 `method` 的情况下默认使用 `GET` 或 `POST`
- 禁止跳过类型定义直接 `any`
- 禁止同一资源使用多套命名风格

### 生成结果检查清单

- [ ] 已新增或复用 API 路径枚举
- [ ] 请求函数命名符合规范
- [ ] 每个函数有对应 `Req` / `Res` 类型
- [ ] `GET` 使用 `params`，`POST` / `PUT` / `PATCH` 使用 `data`
- [ ] 分页、批量、路径参数、上传场景处理正确
- [ ] 字段来源可追溯到文档或用户输入
- [ ] 无 `any` 滥用、无凭空字段
