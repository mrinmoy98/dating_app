# Dating App — Design Package (Design Only)

Tinder-style dating app. **Web = React.js**, **Mobile = React Native**.
This is a **design-only** package — no implementation code.

## Contents
1. [01-architecture.md](01-architecture.md) — system architecture, services, real-time flows (chat, WebRTC video, feed).
2. [02-database.md](02-database.md) — **normalized PostgreSQL schema (no JSON blobs)**, every table + column + FK.
3. [03-ui-ux-design.md](03-ui-ux-design.md) — clean UI kit, design tokens, all screen wireframes.

## Feature checklist (all covered in the design)
- [x] Register + login — Man / Woman / Everyone (gender via `genders` lookup)
- [x] Profile list / swipe deck (Discover)
- [x] Interests (`interests` + `user_interests`)
- [x] 1-to-1 chatting (`conversations` + `messages`, matched users only)
- [x] 1-to-1 video calling (WebRTC + `video_calls`)
- [x] Reels section — follow-based feed (`follows` + `reels`)
- [x] Location + gender-preference suggestions (PostGIS + `user_preferences`)
- [x] Clean, minimal design (tokens + wireframes)
- [x] Relational DB, direct typed columns — **no JSON text storage**
