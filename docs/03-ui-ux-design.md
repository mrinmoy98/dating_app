# UI / UX Design — Clean & Minimal

> Shared design tokens for Web (React.js) and Mobile (React Native).
> Clean, airy, rounded, one bright accent. Works in light + dark.

## 1. Design tokens

```
Colors (light)
  --bg            #FFFFFF
  --surface       #F7F7F9
  --text          #12121A
  --text-muted    #6B6B76
  --border        #ECECF1
  --accent        #FD5068   (warm pink/red — primary CTA, like)
  --accent-2      #6C5CE7   (violet — superlike / secondary)
  --success       #22C55E
  --danger        #EF4444

Colors (dark)
  --bg            #0E0E12
  --surface       #17171D
  --text          #F5F5F7
  --text-muted    #9A9AA5
  --border        #26262E

Typography      Inter / SF Pro. Sizes: 12,14,16(base),20,28,34. Weight 400/600/700.
Radius          card 20px · button 14px · avatar full · sheet 24px
Spacing scale   4 · 8 · 12 · 16 · 24 · 32
Shadow          card: 0 8px 24px rgba(0,0,0,.08)
```

## 2. Navigation (5 tabs — bottom bar on mobile, sidebar on web)

```
[ 🔥 Discover ]  [ 🎬 Reels ]  [ ❤️ Matches ]  [ 💬 Chats ]  [ 👤 Profile ]
```

## 3. Key screens (wireframes)

### A. Onboarding / Auth
```
┌──────────────────────────┐
│         ❤️  Amour         │
│   Find people near you   │
│                          │
│  [  Continue with phone ]│
│  [  Continue with email ]│
│  ─────── or ───────      │
│  [  Google ] [ Apple ]   │
└──────────────────────────┘
Steps: phone/email → OTP → name → birthdate → gender →
       "I'm interested in" (Man / Woman / Everyone) →
       add photos → pick interests → allow location → done
```

### B. Discover (swipe deck) — location + gender based
```
┌──────────────────────────┐
│  Amour            ⚙︎      │   ← top bar
│ ┌──────────────────────┐ │
│ │                      │ │
│ │    [ profile photo ] │ │
│ │                      │ │
│ │  Aisha, 24           │ │   ← name, age
│ │  📍 3 km away        │ │   ← distance (from PostGIS)
│ │  Travel · Music · ☕ │ │   ← interests chips
│ └──────────────────────┘ │
│    ✕      ⭐      ❤️      │   ← dislike / superlike / like
└──────────────────────────┘
Filter sheet: interested in (Man/Woman/All), age range slider, distance slider.
```

### C. Match popup
```
┌──────────────────────────┐
│      It's a Match! 🎉     │
│   (o)          (o)        │   ← two avatars
│  You and Aisha liked      │
│  each other               │
│  [ Say hi 💬 ]  [ Keep   │
│                 swiping ] │
└──────────────────────────┘
```

### D. Reels (follow-based, vertical full-screen)
```
┌──────────────────────────┐
│   [ full-screen video ]  │
│                       ❤️ │  1.2k
│                       💬 │  84
│                       ↗︎ │
│  @maya  · Follow         │
│  "Sunset vibes 🌅"        │
│ ── swipe up for next ──   │
└──────────────────────────┘
Feed = only reels from people I follow, newest first.
```

### E. Matches list
```
┌──────────────────────────┐
│  New Matches             │
│  (o)(o)(o)(o)(o)  →       │  ← horizontal avatars
│                          │
│  Messages                │
│  (o) Aisha    3 km · 2m  │
│  (o) Maya     online     │
│  (o) Sara     seen ✓✓    │
└──────────────────────────┘
```

### F. Chat (1-to-1) + call entry
```
┌──────────────────────────┐
│ ‹  (o) Aisha       📞 📹 │  ← audio + VIDEO call buttons
│                          │
│         Hi! 👋      ▐    │
│  ▐  How are you?         │
│         Wanna call? ▐    │
│  ── typing… ──           │
│ [ +  Message…      ➤ ]   │
└──────────────────────────┘
```

### G. Video call (1-to-1, WebRTC)
```
┌──────────────────────────┐
│  [ remote full screen ]  │
│                   ┌────┐ │
│                   │self│ │  ← picture-in-picture
│                   └────┘ │
│    🎤     📹     ☎️(end) │
└──────────────────────────┘
```

### H. Profile / Edit
```
┌──────────────────────────┐
│      (o)  Rahim, 27      │
│  ✎ Edit profile          │
│  Photos [+][+][+]        │
│  Bio ……                  │
│  Interests: Gym · Food   │
│  Preferences ›  (gender, │
│                age, dist)│
│  Settings · Logout       │
└──────────────────────────┘
```

## 4. Reusable components (shared UI kit)
`Button` · `Card` · `Avatar` · `Chip` (interest) · `Slider` (age/distance)
`BottomSheet` · `SwipeCard` · `MessageBubble` · `ReelPlayer` · `CallControls`
`Toast` · `EmptyState` · `TabBar`

## 5. Screen ↔ data mapping
| Screen | Reads from |
|--------|------------|
| Discover | `users` + `user_locations` (PostGIS) + `user_preferences`, minus `swipes`/`blocks` |
| Match | `matches` |
| Reels | `reels` filtered by `follows` |
| Matches/Chats | `matches` → `conversations` → `messages` |
| Video call | `video_calls` + signaling |
| Profile | `users` + `photos` + `user_interests` + `user_preferences` |
