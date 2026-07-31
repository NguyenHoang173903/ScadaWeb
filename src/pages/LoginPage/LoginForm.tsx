import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, Lock, ShieldCheck, UserRound } from 'lucide-react'
import logoTlhn from '@/assets/images/Logo_TLHN.svg'
import {
  APP_SUBTITLE,
  APP_TITLE,
} from '@/constants/config'
import styles from './LoginPage.module.css'

type LoginFormProps = {
  onSubmit?: (payload: {
    username: string
    password: string
    remember: boolean
  }) => void
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit?.({ username, password, remember })
  }

  return (
    <section className={styles.loginCard}>
      <div className={styles.brand}>
        <img src={logoTlhn} alt="UBND Thành phố Hà Nội" className={styles.logo} />
        <h1 className={styles.title}>{APP_TITLE}</h1>
        <p className={styles.subtitle}>{APP_SUBTITLE}</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <UserRound size={18} className={styles.fieldIcon} />
          <input
            type="text"
            name="username"
            autoComplete="username"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
        </label>

        <label className={styles.field}>
          <Lock size={18} className={styles.fieldIcon} />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            type="button"
            className={styles.eyeButton}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </label>

        <div className={styles.formMeta}>
          <label className={styles.remember}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>
          <button type="button" className={styles.forgot}>
            Quên mật khẩu?
          </button>
        </div>

        <button type="submit" className={styles.primaryButton}>
          <UserRound size={18} />
          ĐĂNG NHẬP
        </button>

        <div className={styles.divider}>
          <span>hoặc</span>
        </div>

        <button type="button" className={styles.ssoButton}>
          <ShieldCheck size={18} />
          ĐĂNG NHẬP SSO
        </button>
      </form>
    </section>
  )
}
