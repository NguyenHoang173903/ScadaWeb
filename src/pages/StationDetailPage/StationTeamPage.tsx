import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { isApiError } from '@/services/api/http'
import { mapStationOperator } from '@/services/stations/mappers'
import { getStationTeam } from '@/services/stations/stationsApi'
import { TeamMemberCard } from './TeamMemberCard'
import type { TeamMember } from './teamMock'
import styles from './TeamPage.module.css'

export function StationTeamPage() {
  const { stationId = '' } = useParams()
  const numericStation = /^\d+$/.test(stationId)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (showLoading = false) => {
    if (!numericStation) return
    if (showLoading) setLoading(true)
    try {
      const team = await getStationTeam(Number(stationId))
      setMembers((team.operators ?? []).map(mapStationOperator))
      setError('')
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Không tải được dữ liệu tổ vận hành.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [numericStation, stationId])

  useEffect(() => {
    void load(true)
    const timer = window.setInterval(() => void load(), 15_000)
    return () => window.clearInterval(timer)
  }, [load])

  return (
    <div className={styles.page}>
      {error ? <p className={styles.error}>{error}</p> : null}

      {loading && members.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Đang tải tổ vận hành...</p>
        </div>
      ) : members.length > 0 ? (
        <div className={styles.grid}>
          {members.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Chưa có nhân sự đang nhận ca</p>
          <p className={styles.emptyHint}>
            Redis chưa có dữ liệu tổ vận hành cho trạm này.
          </p>
        </div>
      )}
    </div>
  )
}
