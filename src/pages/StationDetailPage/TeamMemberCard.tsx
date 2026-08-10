import { BadgeInfo, Clock3, GraduationCap, IdCard, Phone, UserRound } from 'lucide-react'
import type { TeamMember } from './teamMock'
import styles from './TeamMemberCard.module.css'

type TeamMemberCardProps = {
  member: TeamMember
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <div className={styles.avatar} aria-hidden>
          <UserRound size={28} strokeWidth={2.25} />
        </div>
        <div className={styles.identity}>
          <h3 className={styles.name}>{member.fullName}</h3>
          <p className={styles.role}>{member.role}</p>
        </div>
      </div>

      <div className={styles.details}>
        <div className={styles.row}>
          <IdCard size={18} className={styles.icon} aria-hidden />
          <span>{member.employeeId}</span>
        </div>
        <div className={styles.row}>
          <BadgeInfo size={18} className={styles.icon} aria-hidden />
          <span>{member.birthDate}</span>
        </div>
        <div className={styles.row}>
          <GraduationCap size={18} className={styles.icon} aria-hidden />
          <span>{member.qualification}</span>
        </div>
        <div className={styles.row}>
          <Phone size={18} className={styles.icon} aria-hidden />
          <span>{member.phone}</span>
        </div>
        <div className={styles.row}>
          <Clock3 size={18} className={styles.icon} aria-hidden />
          <div className={styles.shiftBlock}>
            <span>Thời gian vào ca</span>
            <span>{member.shiftStartAt}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
