export type ApiError = {
  message: string
  status?: number
  details?: unknown
  errors?: string[]
  errorCode?: string
}

/** Envelope chuẩn từ Backend.Api (`ApiResponse<T>`). */
export type BackendApiResponse<T> = {
  success: boolean
  message?: string
  data?: T
  errors?: string[] | null
  traceId?: string | null
  timestampUtc?: string
}

export type PaginationResult<T> = {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages?: number
  hasPreviousPage?: boolean
  hasNextPage?: boolean
}

/** @deprecated dùng BackendApiResponse — giữ alias cho code cũ */
export type ApiResponse<T> = {
  data: T
  message?: string
}
