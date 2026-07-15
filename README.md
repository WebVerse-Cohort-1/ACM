# ACM TSEC — Monorepo

```
A_c_m/
├── app/           ← Vite + React website  (npm run dev → :5173)
└── studio-acm/   ← Sanity CMS Studio     (npm run dev → :3333)
```

## Quick Start

```bash
# Run the website
cd app && npm run dev

# Run the CMS studio (login required first time)
cd studio-acm
npx sanity login   # browser login — one-time
npm run dev
```

## Sanity Project

| Key | Value |
|-----|-------|
| Project ID | `gx7rj7pk` |
| Dataset | `production` |
| Studio URL | http://localhost:3333 |

## Deploy Studio

```bash
cd studio-acm && npm run deploy
```
