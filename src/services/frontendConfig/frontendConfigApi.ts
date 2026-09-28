import { apiClient } from '@/services/api/client'

export type FrontendConfig = {
  arcgisApiKey: string
  loginLayerVisible: boolean
}

export function fetchFrontendConfig() {
  return apiClient.get<FrontendConfig>('/frontend-config', { anonymous: true })
}

export function updateFrontendConfig(
  patch: Partial<Pick<FrontendConfig, 'arcgisApiKey' | 'loginLayerVisible'>>,
) {
  return apiClient.put<FrontendConfig>('/frontend-config', patch)
}
