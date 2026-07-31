import { http } from './http'

export const apiClient = {
  get: <T>(path: string, init?: RequestInit) => http<T>(path, { ...init, method: 'GET' }),
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    http<T>(path, { ...init, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, init?: RequestInit) =>
    http<T>(path, { ...init, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    http<T>(path, { ...init, method: 'PATCH', body }),
  delete: <T>(path: string, init?: RequestInit) =>
    http<T>(path, { ...init, method: 'DELETE' }),
}
