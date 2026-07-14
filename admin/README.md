# Dating App — Super Admin Dashboard (React + Vite)

A separate web app for platform super admins. Currently: **Super Admin login** wired to
the NestJS backend, plus a dashboard shell to extend.

## Setup

```bash
cd admin
npm install
cp .env.example .env   # optional — defaults to http://localhost:4000
npm run dev
```

Open the printed URL (default http://localhost:5173).

## Login

Uses the backend's seeded super admin (`backend/.env`):

- Email: `admin@datingapp.com`
- Password: `admin123`

Only accounts with role `superadmin` can sign in here.

## How it talks to the backend

- `POST /admin/auth/login` → `{ token, admin }`
- `GET  /admin/auth/me` → validates the saved token on reload

The backend already enables CORS (`origin: true`), so no proxy is needed. Point the app at a
different backend with `VITE_API_URL` in `.env`.

## Structure

```
admin/
├── index.html
├── vite.config.js
└── src/
    ├── main.jsx           # entry
    ├── App.jsx            # auth gate (login ↔ dashboard)
    ├── index.css          # styles
    ├── lib/api.js         # fetch wrapper + endpoints
    └── pages/
        ├── Login.jsx      # super admin login
        └── Dashboard.jsx  # dashboard shell (extend here)
```
