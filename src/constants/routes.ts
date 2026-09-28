export const ROUTES = {
  login: '/',
  dashboard: '/dashboard',
  users: '/users',
  changePassword: '/change-password',
  stationRoot: '/stations/:stationId',
  stationSchematic: '/stations/:stationId/schematic',
  stationDataUpdate: '/stations/:stationId/update-data',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

export function stationDetailPath(stationId: string) {
  return `/stations/${stationId}/schematic`
}

export function stationDataUpdatePath(stationId: string) {
  return `/stations/${stationId}/update-data`
}
