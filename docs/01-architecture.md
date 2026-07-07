# Dating App — System Architecture Design

> Design only. No implementation. Web = React.js, Mobile = React Native.

## 1. High-level overview

```
        ┌─────────────────────┐        ┌──────────────────────┐
        │   Web (React.js)    │        │  Mobile (React Native)│
        │   - Vite + TS       │        │   - Expo / RN CLI     │
        └──────────┬──────────┘        └───────────┬──────────┘
                   │                                │
                   │   HTTPS (REST)  +  WSS (real-time)
                   └───────────────┬────────────────┘
                                   │
                        ┌──────────▼──────────┐
                        │   API Gateway       │
                        │  (Auth, rate-limit) │
                        └──────────┬──────────┘
                                   │
      ┌───────────────┬───────────┼────────────┬────────────────┐
      │               │           │            │                │
┌─────▼─────┐  ┌──────▼─────┐ ┌───▼────┐  ┌────▼─────┐   ┌──────▼──────┐
│ Auth      │  │ Match/Feed │ │ Chat   │  │ Reels    │   │ Signaling   │
│ Service   │  │ Service    │ │ Service│  │ Service  │   │ (WebRTC)    │
└─────┬─────┘  └──────┬─────┘ └───┬────┘  └────┬─────┘   └──────┬──────┘
      │               │           │            │                │
      └───────────────┴─────┬─────┴────────────┴────────────────┘
                            │
             ┌──────────────┼───────────────┐
             │              │               │
      ┌──────▼─────┐ ┌──────▼──────┐ ┌──────▼──────┐
      │ PostgreSQL │ │ Redis       │ │ Object Store│
      │ (+ PostGIS)│ │ (cache/     │ │ (S3): photos│
      │ core data  │ │  presence)  │ │  + reels    │
      └────────────┘ └─────────────┘ └─────────────┘
```

## 2. Technology choices (recommended)

| Layer | Choice | Why |
|-------|--------|-----|
| Web | React.js + Vite + TypeScript | Fast, typed, shared UI logic with RN |
| Mobile | React Native (Expo) + TypeScript | Single codebase iOS + Android |
| Shared | Monorepo (Turborepo) — shared `types`, `api-client`, `ui-tokens` | Web & mobile reuse models + design tokens |
| API | Node.js (NestJS) REST + WebSocket | Structured, scalable |
| Realtime chat | WebSocket (Socket.IO) | 1-to-1 messaging, typing, presence |
| Video call | **WebRTC** (peer-to-peer) + a signaling server + TURN/STUN | 1-to-1 video, low latency |
| DB | **PostgreSQL + PostGIS** | Relational (no JSON blobs), geo-distance queries |
| Cache/Presence | Redis | Online status, feed cache, rate limits |
| Media | S3-compatible object store + CDN | Profile photos + reels video |
| Push | FCM (Android) / APNs (iOS) | Match, message, call notifications |
| Auth | JWT access + refresh tokens | Stateless, works web + mobile |

## 3. Core services & responsibility

- **Auth Service** — register, login, OTP/email verify, tokens, sessions, devices.
- **Profile Service** — user profile, photos, interests, preferences, location updates.
- **Match/Feed Service** — location + gender-preference based suggestion feed, swipes, match creation.
- **Chat Service** — conversations, messages, read receipts, typing (only between matched users).
- **Reels Service** — upload reel, follow graph, follow-based reel feed, likes, comments.
- **Signaling Service** — WebRTC offer/answer/ICE exchange for 1-to-1 video call (only matched users).
- **Notification Service** — push + in-app notifications.

## 4. Key real-time flows

### Chat (1-to-1)
1. Users A & B match → a `conversation` row is created.
2. Client opens WebSocket, joins `conversation:{id}` room.
3. Message sent → stored in `messages` → pushed to receiver → read receipt updates row.
4. Offline receiver → push notification.

### Video Call (1-to-1, WebRTC)
1. Caller requests call → Signaling server checks A & B are matched.
2. STUN discovers public IP; if P2P fails, media relays through **TURN**.
3. Offer/Answer/ICE candidates exchanged over WebSocket signaling.
4. Media flows peer-to-peer (encrypted, DTLS-SRTP).
5. `video_calls` row records start/end/duration/status.

### Suggestion Feed (location + gender)
- User sets **preference**: interested_in gender + age range + max distance.
- Feed query uses **PostGIS** `ST_DWithin` on the user's last location.
- Excludes: already swiped, blocked, self, and users outside preference.
- Ordered by distance + activity recency.

## 5. Security & privacy notes
- Chat & video allowed **only between matched users**.
- Reels visible based on **follow** relationship (not match).
- Exact GPS never sent to other clients — only computed distance ("3 km away").
- Block & report on every profile / reel / chat.
- All media URLs served via signed/CDN links.
