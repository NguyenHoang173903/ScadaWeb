import { apiClient } from '@/services/api/client'
import type { PasswordPolicy } from '@/settings/passwordPolicy'

export function fetchPasswordPolicy() {
  return apiClient.get<PasswordPolicy>('/password-policy')
}

export function updatePasswordPolicy(policy: PasswordPolicy) {
  return apiClient.put<PasswordPolicy>('/password-policy', policy)
}
