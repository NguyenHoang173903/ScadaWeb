import { useNavigate } from 'react-router-dom'
import loginBackground from '@/assets/images/background.png'
import { ROUTES } from '@/constants/routes'
import { LoginForm } from './LoginForm'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <div className={styles.stage}>
        <img
          src={loginBackground}
          alt=""
          className={styles.backgroundImage}
        />
        <LoginForm
          onSubmit={() => {
            navigate(ROUTES.dashboard)
          }}
        />
      </div>
    </div>
  )
}
