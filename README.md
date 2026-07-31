# ScadaWeb

Base frontend project with **Vite + React + TypeScript**.

## Prerequisites

- [Node.js LTS](https://nodejs.org/) (v20+)
- npm (comes with Node.js)

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Build for production     |
| `npm run preview` | Preview production build |
| `npm run lint`    | Run ESLint               |

## Project structure

```
src/
├── assets/          # images, icons, static media
├── components/      # shared UI (reusable across pages)
│   └── common/
├── constants/       # app config, routes
├── features/        # domain modules (dashboard, alarms, ...)
├── hooks/           # shared React hooks
├── layouts/         # page shells (header, sidebar, ...)
├── pages/           # route-level screens
├── services/        # API clients / external services
│   └── api/
├── styles/          # global CSS
├── types/           # shared TypeScript types
├── utils/           # pure helpers
├── App.tsx
└── main.tsx
```

Import with alias `@/`:

```ts
import { apiClient } from '@/services/api/client'
import { APP_NAME } from '@/constants/config'
```

## API (.NET)

Set `VITE_API_BASE_URL` in `.env`. Dev server proxies `/api` to `http://localhost:5000`.
