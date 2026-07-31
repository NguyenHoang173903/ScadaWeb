import { useState } from 'react'
import { Navigate, Outlet, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { AppFooter } from '@/components/layout/AppFooter'
import { StationSideNav } from '@/components/layout/StationSideNav'
import { StationTopNav } from '@/components/layout/StationTopNav'
import { ROUTES } from '@/constants/routes'
import { getPumpStationById } from '@/data/pumpStations'
import styles from './StationLayout.module.css'

export function StationLayout() {
  const { stationId = '' } = useParams()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const station = getPumpStationById(stationId)

  if (!station) {
    return (
      <div className={styles.notFound}>
        <h1>Không tìm thấy trạm bơm</h1>
        <p>Mã trạm không tồn tại hoặc đã bị xóa.</p>
        <Button variant="primary" onClick={() => navigate(ROUTES.dashboard)}>
          Quay lại Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ''}`}>
      <div className={styles.body}>
        <StationSideNav
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((value) => !value)}
        />

        <div className={styles.mainColumn}>
          <StationTopNav
            title={`Trạm bơm ${station.name.replace(/^Trạm\s+/i, '')}`}
            address={station.address}
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
