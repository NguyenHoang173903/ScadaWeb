import {
  APP_COPYRIGHT,
  APP_SUPPORT_EMAIL,
  APP_SUBTITLE,
  APP_TITLE,
} from '@/constants/config'
import styles from './AppFooter.module.css'

type AppFooterProps = {
  leftText?: string
  copyright?: string
  supportEmail?: string
}

export function AppFooter({
  leftText = `${APP_TITLE.toLowerCase()} ${APP_SUBTITLE.toLowerCase()}`,
  copyright = APP_COPYRIGHT,
  supportEmail = APP_SUPPORT_EMAIL,
}: AppFooterProps) {
  return (
    <footer className={styles.footer}>
      <span className={styles.left}>{leftText}</span>
      <span className={styles.center}>{copyright}</span>
      <a className={styles.right} href={`mailto:${supportEmail}`}>
        {supportEmail}
      </a>
    </footer>
  )
}
