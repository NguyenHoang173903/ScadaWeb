import { apiClient } from '@/services/api/client'
import type { PaginationResult } from '@/types'

export type ScadaUserDto = {
  id: number
  username: string
  fullName: string
  displayName?: string
  department?: string | null
  position?: string | null
  role: string
  level?: number | null
  isActive: boolean
  isEnable?: boolean
  status: string
  mustChangePassword: boolean
  lockoutUntil?: string | null
  lastLoginAt?: string | null
  createdAt: string
  updatedAt: string
}

export type CreateScadaUserPayload = {
  username: string
  password: string
  confirmPassword?: string
  fullName: string
  department?: string
  position?: string
  unit?: string
  description?: string
  role: string
  level?: number | null
  isActive: boolean
  mustChangePassword: boolean
}

export async function listScadaUsers(params?: {
  keyword?: string
  role?: string
  isActive?: boolean
  pageNumber?: number
  pageSize?: number
}) {
  const search = new URLSearchParams()
  if (params?.keyword) search.set('keyword', params.keyword)
  if (params?.role) search.set('role', params.role)
  if (params?.isActive != null) search.set('isActive', String(params.isActive))
  if (params?.pageNumber != null) search.set('pageNumber', String(params.pageNumber))
  if (params?.pageSize != null) search.set('pageSize', String(params.pageSize))
  const qs = search.toString()
  return apiClient.get<PaginationResult<ScadaUserDto>>(
    qs ? `/scada-users?${qs}` : '/scada-users',
  )
}

export async function createScadaUser(payload: CreateScadaUserPayload) {
  return apiClient.post<ScadaUserDto>('/scada-users', payload)
}
