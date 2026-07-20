import { API_BASE_URL } from "../../config";

interface RequestOptions {
  method?: string;
  body?: any;
  token?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || `Request failed (${res.status})`);
  }
  return (json?.data ?? json) as T;
}

async function upload<T>(path: string, form: FormData, token?: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || `Upload failed (${res.status})`);
  }
  return (json?.data ?? json) as T;
}

export const http = {
  get: <T>(path: string, token?: string) => request<T>(path, { token }),
  post: <T>(path: string, body?: any, token?: string) =>
    request<T>(path, { method: "POST", body, token }),
  patch: <T>(path: string, body?: any, token?: string) =>
    request<T>(path, { method: "PATCH", body, token }),
  put: <T>(path: string, body?: any, token?: string) =>
    request<T>(path, { method: "PUT", body, token }),
  del: <T>(path: string, token?: string) => request<T>(path, { method: "DELETE", token }),
  upload,
};
