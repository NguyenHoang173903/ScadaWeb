import { Navigate, useParams } from 'react-router-dom'
import { EventHistoryPage } from './EventHistoryPage'
import { ExistingErrorsPage } from './ExistingErrorsPage'
import { OperationLogPage } from './OperationLogPage'

export function StationEventsPage() {
  const { stationId = '', eventType } = useParams()

  if (!eventType) {
    return <Navigate to={`/stations/${stationId}/events/existing`} replace />
  }

  if (eventType === 'existing') {
    return <ExistingErrorsPage />
  }

  if (eventType === 'history') {
    return <EventHistoryPage />
  }

  if (eventType === 'operation-log') {
    return <OperationLogPage />
  }

  return <Navigate to={`/stations/${stationId}/events/existing`} replace />
}
