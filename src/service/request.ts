import { extend } from "umi-request";

const TOKEN_STORAGE_KEY = "aoko_devops_token";

function onTokenInvalid() {
  // TODO: token 失效处理（后续按业务实现）
}

export const request = extend({
  prefix: "/aoko-devops",
  timeout: 10000,
});

request.interceptors.request.use((url, options) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const headers = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return {
    url,
    options: {
      ...options,
      headers,
    },
  };
});

request.interceptors.response.use(async (response) => {
  if (response.status === 401) {
    onTokenInvalid();
  }
  return response;
});
