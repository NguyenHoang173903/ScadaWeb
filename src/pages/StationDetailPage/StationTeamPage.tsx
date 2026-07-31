import { TeamMemberCard } from './TeamMemberCard'
import { TEAM_MEMBERS } from './teamMock'
import styles from './TeamPage.module.css'

export function StationTeamPage() {
  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        {TEAM_MEMBERS.map((member) => (
          <TeamMemberCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  )
}
