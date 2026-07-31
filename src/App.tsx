import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { StationIndexRedirect, StationLayout } from '@/layouts/StationLayout'
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
import { UsersPage } from '@/pages/UsersPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.dashboard} element={<DashboardPage />} />
        <Route path={ROUTES.users} element={<UsersPage />} />
        <Route path={ROUTES.stationRoot} element={<StationLayout />}>
          <Route index element={<StationIndexRedirect />} />
          <Route path="schematic" element={<StationSchematicPage />} />
          <Route path="process" element={<StationProcessPage />} />
          <Route path="devices" element={<StationDevicesPage />} />
          <Route path="devices/:group" element={<StationDevicesPage />} />
          <Route path="charts" element={<StationChartsPage />} />
          <Route path="charts/:chartType" element={<StationChartsPage />} />
          <Route path="reports" element={<StationReportsPage />} />
          <Route path="events" element={<StationEventsPage />} />
          <Route path="events/:eventType" element={<StationEventsPage />} />
          <Route path="team" element={<StationTeamPage />} />
        </Route>
        <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
