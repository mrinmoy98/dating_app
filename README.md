# 💜 Amour — Dating App

Tinder-style dating app with a shared artistic design language across **web (React.js)** and **mobile (React Native)**.

Features: register/login for all genders · location + gender-based suggestions · profile deck · interests · 1-to-1 chat · 1-to-1 video call (WebRTC-ready UI) · reels feed (follow-based).

## Folder structure

```
Dating App/
├── docs/            # Design docs (architecture, DB schema, UI/UX)
│   ├── 00-README.md
│   ├── 01-architecture.md
│   ├── 02-database.md      ← normalized SQL schema, NO JSON blobs
│   └── 03-ui-ux-design.md
├── design/          # Static high-fidelity prototype (open in a browser)
│   └── index.html
├── web/             # React.js client (Vite)
└── app/             # React Native client (Expo)
```

## Run the WEB app (React.js)

```bash
cd web
npm install
npm run dev
```
Opens at http://localhost:5173

## Run the MOBILE app (React Native / Expo)

```bash
cd app
npm install
npx expo start
```
Then press `a` (Android emulator), `i` (iOS simulator), or scan the QR with **Expo Go**.

## View the static design prototype
Just open `design/index.html` in any browser — no install needed.

## Screens (both platforms)
| Screen | What it shows |
|--------|---------------|
| Discover | Swipeable profile deck, distance + interests, like/superlike/dislike |
| Match | "It's a Match!" celebration |
| Reels | Full-screen vertical video from people you follow |
| Matches | New matches rail + message list |
| Chat | 1-to-1 messaging with audio/video call buttons |
| Call | Video call layout (self PiP, mute/camera/end) |
| Profile | Photos, bio, interests, "interested in", preferences |

## Notes
- This is a **front-end design implementation** with mock data (`src/data/mock.js`).
  It has no backend yet — wire it to the API described in [docs/01-architecture.md](docs/01-architecture.md).
- Placeholder photos are gradient + emoji so the project runs with **zero image assets**.
- The mock data mirrors the normalized schema in [docs/02-database.md](docs/02-database.md) (no JSON blob storage).
- Real video calling uses **WebRTC** (`react-native-webrtc` on mobile, browser `RTCPeerConnection` on web) + a signaling server — the UI here is call-ready.
