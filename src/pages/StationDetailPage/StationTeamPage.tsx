import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { isApiError } from '@/services/api/http'
import { mapStationOperator } from '@/services/stations/mappers'
import { stationTeamQuery } from '@/services/stations/stationQueries'
import { TeamMemberCard } from './TeamMemberCard'
import type { TeamMember } from './teamMock'
import styles from './TeamPage.module.css'

export function StationTeamPage() {
  const { stationId = '' } = useParams()
  const numericStation = /^\d+$/.test(stationId)
  const stationNumber = numericStation ? Number(stationId) : null
  const team = useQuery({
    ...stationTeamQuery(stationNumber ?? 0),
    enabled: stationNumber != null,
  })
  const members = useMemo<TeamMember[]>(
    () => (team.data?.operators ?? []).map(mapStationOperator),
    [team.data],
  )
  const error = team.error
    ? isApiError(team.error)
      ? team.error.message
      : 'Không tải được dữ liệu tổ vận hành.'
    : ''

  return (
    <div className={styles.page}>
      {error ? <p className={styles.error}>{error}</p> : null}

      {team.isPending && members.length === 0 ? (
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
