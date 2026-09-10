import { getPasswordRules } from '@/settings/passwordPolicy'
import styles from './PasswordRuleList.module.css'

type Props = {
  password: string
}

export function PasswordRuleList({ password }: Props) {
  const rules = getPasswordRules(password)

  return (
    <ul className={styles.list} aria-label="Quy tắc mật khẩu">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className={`${styles.item} ${rule.passed ? styles.passed : styles.pending}`}
        >
          <span className={styles.mark} aria-hidden>
            {rule.passed ? '✓' : '•'}
          </span>
          {rule.label}
        </li>
      ))}
    </ul>
  )
}
