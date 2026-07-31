export const ROUTES = {
  login: '/',
  dashboard: '/dashboard',
  users: '/users',
  stationRoot: '/stations/:stationId',
  stationSchematic: '/stations/:stationId/schematic',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

export function stationDetailPath(stationId: string) {
  return `/stations/${stationId}/schematic`
}
