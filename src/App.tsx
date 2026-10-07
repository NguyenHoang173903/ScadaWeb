import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { SessionGuard } from '@/components/auth/SessionGuard'
import { ROUTES } from '@/constants/routes'
import { StationIndexRedirect, StationLayout } from '@/layouts/StationLayout'
import { ChangePasswordPage } from '@/pages/ChangePasswordPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import {
  StationChartsPage,
  StationDevicesPage,
  StationEventsPage,
  StationProcessPage,
  StationReportsPage,
  StationSchematicPage,
  StationTeamPage,
} from '@/pages/StationDetailPage'
import { StationDataUpdatePage } from '@/pages/StationDataUpdatePage'
import { UsersPage } from '@/pages/UsersPage'
import { getRefreshToken } from '@/settings/authToken'
import { hasActiveSession, isSessionAdmin, isSessionViewer } from '@/settings/session'

function AdminRoute({ children }: { children: ReactNode }) {
  return isSessionAdmin() ? children : <Navigate to={ROUTES.dashboard} replace />
}

function NonViewerStationRoute({ children }: { children: ReactNode }) {
  const { stationId = '' } = useParams()
  return isSessionViewer()
    ? <Navigate to={`/stations/${stationId}/schematic`} replace />
    : children
}

/** Unknown URL: dashboard when signed in, login otherwise. */
function UnknownRoute() {
  const signedIn = hasActiveSession() && Boolean(getRefreshToken())
  return <Navigate to={signedIn ? ROUTES.dashboard : ROUTES.login} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route element={<SessionGuard />}>
          <Route path={ROUTES.dashboard} element={<DashboardPage />} />
          <Route path={ROUTES.changePassword} element={<ChangePasswordPage />} />
          <Route
            path={ROUTES.users}
            element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            }
          />
          <Route path={ROUTES.stationDataUpdate} element={<StationDataUpdatePage />} />
          <Route path={ROUTES.stationRoot} element={<StationLayout />}>
            <Route index element={<StationIndexRedirect />} />
            <Route path="schematic" element={<StationSchematicPage />} />
            <Route path="process" element={<StationProcessPage />} />
            <Route path="devices" element={<StationDevicesPage />} />
            <Route path="devices/:group" element={<StationDevicesPage />} />
            <Route
              path="charts"
              element={
                <NonViewerStationRoute>
                  <StationChartsPage />
                </NonViewerStationRoute>
              }
            />
            <Route
              path="charts/:chartType"
              element={
                <NonViewerStationRoute>
                  <StationChartsPage />
                </NonViewerStationRoute>
              }
            />
            <Route
              path="reports"
              element={
                <NonViewerStationRoute>
                  <StationReportsPage />
                </NonViewerStationRoute>
              }
            />
            <Route
              path="events"
              element={
                <NonViewerStationRoute>
                  <StationEventsPage />
                </NonViewerStationRoute>
              }
            />
            <Route
              path="events/:eventType"
              element={
                <NonViewerStationRoute>
                  <StationEventsPage />
                </NonViewerStationRoute>
              }
            />
            <Route path="team" element={<StationTeamPage />} />
          </Route>
        </Route>
        <Route path="*" element={<UnknownRoute />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
