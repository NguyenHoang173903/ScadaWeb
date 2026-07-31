import { useState } from 'react'
import styles from './HomePage.module.css'

export function HomePage() {
  const [count, setCount] = useState(0)

  return (
    <section className={styles.page}>
      <h1>ScadaWeb</h1>
      <p>Vite + React + TypeScript — sẵn sàng gọi API .NET</p>
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        Count: {count}
      </button>
    </section>
  )
}
