import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Activity, Users } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { PumpListIcon } from '@/components/icons/PumpListIcon'
import { ReportIcon } from '@/components/icons/ReportIcon'
import { SchemaIcon } from '@/components/icons/SchemaIcon'
import { TechnoDiagramIcon } from '@/components/icons/TechnoDiagramIcon'
import { TrendIcon } from '@/components/icons/TrendIcon'
import { AppFooter } from '@/components/layout/AppFooter'
import { StationSideNav } from '@/components/layout/StationSideNav'
import { StationTopNav } from '@/components/layout/StationTopNav'
import { ROUTES } from '@/constants/routes'
import { getPumpStationById, registerPumpStation, type PumpStation } from '@/data/pumpStations'
import { isApiError } from '@/services/api/http'
import { stationDetailToPumpStation } from '@/services/stations/mappers'
import { getStation } from '@/services/stations/stationsApi'
import styles from './StationLayout.module.css'

export function StationLayout() {
  const { stationId = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [station, setStation] = useState<PumpStation | undefined>(() =>
    getPumpStationById(stationId),
  )
  const [loading, setLoading] = useState(!getPumpStationById(stationId))
  const [error, setError] = useState('')

  useEffect(() => {
    const local = getPumpStationById(stationId)
    if (local) {
      setStation(local)
      setLoading(false)
      setError('')
      return
    }

    if (!/^\d+$/.test(stationId)) {
      setStation(undefined)
      setLoading(false)
      setError('Mã trạm không tồn tại hoặc đã bị xóa.')
      return
    }

    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const detail = await getStation(Number(stationId))
        if (cancelled) return
        const mapped = stationDetailToPumpStation(detail)
        registerPumpStation(mapped)
        setStation(mapped)
        setError('')
      } catch (err) {
        if (cancelled) return
        setStation(undefined)
        setError(isApiError(err) ? err.message : 'Không tải được thông tin trạm.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [stationId])

  if (loading) {
    return (
      <div className={styles.notFound}>
        <h1>Đang tải trạm bơm…</h1>
      </div>
    )
  }

  if (!station) {
    return (
      <div className={styles.notFound}>
        <h1>Không tìm thấy trạm bơm</h1>
        <p>{error || 'Mã trạm không tồn tại hoặc đã bị xóa.'}</p>
        <Button variant="primary" onClick={() => navigate(ROUTES.dashboard)}>
          Quay lại Dashboard
        </Button>
      </div>
    )
  }

  const stationShortName = station.name
    .replace(/^Trạm\s+bơm\s+/i, '')
    .replace(/^Trạm\s+/i, '')
  const title = /^Trạm\s+bơm\b/i.test(station.name)
    ? station.name
    : `Trạm bơm ${stationShortName}`
  const isSchematicPage = /\/schematic\/?$/.test(location.pathname)
  const isProcessPage = /\/process\/?$/.test(location.pathname)
  const isDevicesPage = /\/devices(\/|$)/.test(location.pathname)
  const isChartsPage = /\/charts(\/|$)/.test(location.pathname)
  const isReportsPage = /\/reports(\/|$)/.test(location.pathname)
  const isEventsPage = /\/events(\/|$)/.test(location.pathname)
  const isTeamPage = /\/team(\/|$)/.test(location.pathname)

  const pageSubtitle = isSchematicPage
    ? {
        text: `Sơ đồ một sợi hệ thống điện điều khiển trạm bơm ${stationShortName}`,
        icon: SchemaIcon,
      }
    : isProcessPage
      ? {
          text: 'Sơ đồ bố trí các tổ máy bơm',
          icon: TechnoDiagramIcon,
        }
      : isDevicesPage
        ? {
            text: 'Thông số kỹ thuật đang vận hành các tổ máy bơm',
            icon: PumpListIcon,
          }
        : isChartsPage
          ? {
              text: 'Đồ thị theo dõi thông số máy bơm',
              icon: TrendIcon,
            }
          : isReportsPage
            ? {
                text: 'Bảng thống kê dữ liệu thông số kỹ thuật của hệ thống',
                icon: ReportIcon,
              }
            : isEventsPage
              ? {
                  text: 'Bảng thống kê sự kiện của hệ thống',
                  icon: Activity,
                }
              : isTeamPage
                ? {
                    text: 'Tổ vận hành hệ thống',
                    icon: Users,
                  }
                : undefined

  return (
    <div className={styles.shell}>
      <div className={styles.body}>
        <StationSideNav />

        <div className={styles.mainColumn}>
          <StationTopNav
            title={title}
            address={station.address}
            subtitle={pageSubtitle?.text}
            subtitleIcon={pageSubtitle?.icon}
          />
          <div className={styles.content}>
            <Outlet context={{ station }} />
          </div>
        </div>
      </div>

      <AppFooter leftText="Hệ thống giám sát thủy lợi Hà Nội" />
    </div>
  )
}

export function StationIndexRedirect() {
  return <Navigate to="schematic" replace />
}
