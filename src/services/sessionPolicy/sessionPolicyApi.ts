import { apiClient } from '@/services/api/client'

export type SessionPolicyDto = {
  settingKey: string
  idleTimeoutMinutes: number
  isDefault: boolean
  updatedAt?: string | null
}

export async function fetchSessionPolicy() {
  return apiClient.get<SessionPolicyDto>('/session-policy')
}

export async function updateSessionPolicy(idleTimeoutMinutes: number) {
  return apiClient.put<SessionPolicyDto>('/session-policy', { idleTimeoutMinutes })
}
