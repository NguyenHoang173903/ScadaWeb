export type ApiError = {
  message: string
  status?: number
  details?: unknown
}

export type ApiResponse<T> = {
  data: T
  message?: string
}
