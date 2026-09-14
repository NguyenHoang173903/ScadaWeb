import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'
import { getAccessToken } from '@/settings/authToken'
import { getApiOrigin } from '@/settings/runtimeConfig'

export type ScadaRealtimeScreen =
  | 'nguyen-ly'
  | 'cong-nghe'
  | 'chi-tiet-bom'
  | 'loi'
  | 'trend'
  | 'bao-cao'

export type RealtimeTagDto = {
  tagId: number
  deviceId: number
  stationId: number
  tagCode: string
  tagName: string
  displayName: string
  dataType: string
  unit?: string | null
  description?: string | null
  mappingLabel?: string | null
  value?: unknown
  quality: string
  timestamp: string
  enableAlarm: boolean
}

export type RealtimeSnapshotDto = {
  stationId: number
  deviceId?: number | null
  screenType: string | number
  screen: string
  isRealtime: boolean
  tags: RealtimeTagDto[]
}

export type RealtimeChangedMessage = {
  tagId: number
  deviceId: number
  stationId: number
  plcCode?: string | null
  deviceCode?: string | null
  tagCode: string
  tagName?: string | null
  value?: unknown
  dataType: string
  quality: string
  timestamp: string
}

/** Hub lives at host root `/hubs/scada`, not under `/api/v1`. */
export function getScadaHubUrl() {
  return `${getApiOrigin()}/hubs/scada`
}

let sharedConnection: HubConnection | null = null
let startPromise: Promise<HubConnection> | null = null

export async function getScadaHubConnection(): Promise<HubConnection> {
  if (sharedConnection?.state === HubConnectionState.Connected) {
    return sharedConnection
  }

  if (startPromise) return startPromise

  startPromise = (async () => {
    if (!sharedConnection) {
      sharedConnection = new HubConnectionBuilder()
        .withUrl(getScadaHubUrl(), {
          accessTokenFactory: () => getAccessToken() ?? '',
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(LogLevel.Warning)
        .build()
    }

    if (sharedConnection.state === HubConnectionState.Disconnected) {
      await sharedConnection.start()
    }

    return sharedConnection
  })()

  try {
    return await startPromise
  } finally {
    startPromise = null
  }
}

export type ScadaHubSubscription = {
  stop: () => Promise<void>
}

export async function subscribeScadaScreen(options: {
  stationId: number
  screen: ScadaRealtimeScreen
  deviceId?: number
  onSnapshot?: (snapshot: RealtimeSnapshotDto) => void
  onTagChanged?: (message: RealtimeChangedMessage) => void
}): Promise<ScadaHubSubscription> {
  const connection = await getScadaHubConnection()
  const { stationId, screen, deviceId, onSnapshot, onTagChanged } = options

  const handleSnapshot = (payload: RealtimeSnapshotDto) => {
    onSnapshot?.(payload)
  }
  const handleTagChanged = (payload: RealtimeChangedMessage) => {
    if (payload.stationId !== stationId) return
    if (deviceId != null && payload.deviceId !== deviceId) return
    onTagChanged?.(payload)
  }

  connection.on('Snapshot', handleSnapshot)
  connection.on('TagChanged', handleTagChanged)

  await connection.invoke('Subscribe', stationId, screen, deviceId ?? null)

  let stopped = false
  return {
    stop: async () => {
      if (stopped) return
      stopped = true
      connection.off('Snapshot', handleSnapshot)
      connection.off('TagChanged', handleTagChanged)
      try {
        if (connection.state === HubConnectionState.Connected) {
          await connection.invoke('Unsubscribe', stationId, screen, deviceId ?? null)
        }
      } catch {
        // Ignore unsubscribe errors on disconnect.
      }
    },
  }
}
