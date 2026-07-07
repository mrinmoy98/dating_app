# Dating App — Backend (NestJS + MongoDB)

REST API for the Expo mobile app (`/dating-app`) and a super-admin dashboard.
Database is **MongoDB** (Mongoose). The old video-conference boilerplate code has
been removed.

## Structure

```
src/
  main.ts                  App bootstrap, CORS, Swagger, static /uploads
  app.module.ts            Root: Mongo + global JWT + Throttler + Admin/Api modules
  entity/
    user.entity.ts         Dating-app user (phone-based, all onboarding fields)
    admin.entity.ts        Dashboard admin (email + password)
    otp.entity.ts          One-time codes (hashed, TTL-expiring)
  admin/                   ← SUPER-ADMIN APIs (/admin/*)
    auth/                  login + me (email/password)
    users/                 list / get / ban / delete / stats
  api/                     ← MOBILE USER APIs (/api/*)
    auth/                  send-otp, verify-otp, register, me (phone/OTP)
    upload/                photo upload (multipart)
  common/                  guards (JWT, roles), decorators, interceptor, filter
```

## Run

```bash
cd backend
cp .env.example .env        # already filled with your Atlas URL
npm install
npm run start:dev           # http://localhost:4000  · Swagger: /api-docs
```

A **super-admin** is auto-seeded on first boot from `.env`
(`admin@datingapp.com` / `admin123`). Change these in production.

## Mobile user flow (`/api`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/auth/send-otp` | public | Send OTP to a phone. In dev the code is returned as `devCode` and logged. |
| POST | `/api/auth/verify-otp` | public | Verify OTP → `registrationToken` (new user) or `token`+`user` (returning user). |
| POST | `/api/auth/register` | registration token | Complete the profile → returns auth `token` + `user`. |
| GET  | `/api/auth/me` | user token | Current profile. |
| POST | `/api/upload/photos` | any valid token | Upload up to 6 images (multipart `files`) → public URLs. |

**Registration = 3 calls:** `send-otp` → `verify-otp` → (upload photos) → `register`.
The phone is proven by the short-lived registration token, so it is never trusted
from the request body.

## Super-admin flow (`/admin`)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/admin/auth/login` | Admin login (email + password) |
| GET  | `/admin/auth/me` | Current admin |
| GET  | `/admin/users/stats` | Dashboard counters |
| GET  | `/admin/users` | Paginated list (`?page&limit&search&status&gender`) |
| GET  | `/admin/users/:id` | One user |
| PATCH | `/admin/users/:id/status` | `{ "status": "active" | "banned" }` |
| DELETE | `/admin/users/:id` | Delete a user |

All `/admin/*` routes except `login` require an admin/superadmin JWT.

## Notes / going to production

- **SMS**: OTPs are logged/returned in dev. Wire a real gateway in
  `ApiAuthService.sendSms()` and set `OTP_DEV_MODE=false`.
- **Photos**: stored on local disk under `public/uploads` and served at `/uploads/*`.
  Swap for S3/CDN for production.
- Responses are wrapped as `{ success, data, pagination? }` by a global interceptor;
  errors as `{ success:false, statusCode, error, message }`.
