import { Navigate, useParams } from 'react-router-dom'
import { EventHistoryPage } from './EventHistoryPage'
import { ExistingErrorsPage } from './ExistingErrorsPage'

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

  return <Navigate to={`/stations/${stationId}/events/existing`} replace />
}
