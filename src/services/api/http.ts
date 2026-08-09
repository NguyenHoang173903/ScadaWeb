import { API_BASE_URL } from '@/constants/config'
import type { ApiError } from '@/types'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const payload = (await response.json()) as { message?: string }
    return {
      message: payload.message ?? response.statusText,
      status: response.status,
      details: payload,
    }
  } catch {
    return {
      message: response.statusText || 'Request failed',
      status: response.status,
    }
  }
}

export async function http<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

/** Multipart upload — do not set Content-Type (browser sets boundary). */
export async function httpFormData<T>(
  path: string,
  options: Omit<RequestInit, 'body'> & { body: FormData },
): Promise<T> {
  const { body, headers, ...rest } = options

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...headers,
    },
    body,
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
