import {
  APP_COPYRIGHT,
  APP_SUPPORT_EMAIL,
  APP_SUBTITLE,
  APP_TITLE,
  APP_VERSION_LABEL,
} from '@/constants/config'
import styles from './AppFooter.module.css'

type AppFooterProps = {
  leftText?: string
  copyright?: string
  supportEmail?: string
  versionLabel?: string
}

export function AppFooter({
  leftText = `${APP_TITLE.toLowerCase()} ${APP_SUBTITLE.toLowerCase()}`,
  copyright = APP_COPYRIGHT,
  supportEmail = APP_SUPPORT_EMAIL,
  versionLabel = APP_VERSION_LABEL,
}: AppFooterProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.leftGroup}>
        <span className={styles.left}>{leftText}</span>
        <span className={styles.version}>{versionLabel}</span>
      </div>
      <div className={styles.rightGroup}>
        <span className={styles.copyright}>{copyright}</span>
        <a className={styles.right} href={`mailto:${supportEmail}`}>
          {supportEmail}
        </a>
      </div>
    </footer>
  )
}
