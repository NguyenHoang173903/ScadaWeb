import { apiClient } from '@/services/api/client'

export type FrontendConfig = {
  arcgisApiKey: string
  loginLayerVisible: boolean
  dashboardMapZoom: number
  dashboardMapOffsetX: number
  dashboardMapOffsetY: number
}

export function fetchFrontendConfig() {
  return apiClient.get<FrontendConfig>('/frontend-config', { anonymous: true })
}

export function updateFrontendConfig(
  patch: Partial<
    Pick<
      FrontendConfig,
      | 'arcgisApiKey'
      | 'loginLayerVisible'
      | 'dashboardMapZoom'
      | 'dashboardMapOffsetX'
      | 'dashboardMapOffsetY'
    >
  >,
) {
  return apiClient.put<FrontendConfig>('/frontend-config', patch)
}
