// Mock data — mirrors the normalized DB schema (see /docs/02-database.md).
// No JSON blobs in the real DB; this is just in-memory sample data for the UI.

export const genders = [
  { id: 1, code: 'man', label: 'Man' },
  { id: 2, code: 'woman', label: 'Woman' },
  { id: 3, code: 'nonbinary', label: 'Non-binary' },
  { id: 4, code: 'all', label: 'Everyone' },
]

// grad = gradient used as placeholder photo, emoji = placeholder avatar
export const candidates = [
  { id: 11, name: 'Aisha', age: 24, distanceKm: 3, verified: true, emoji: '👩🏻',
    grad: ['#FF9F45', '#7C4DFF'], interests: ['✈️ Travel', '🎵 Music', '☕ Coffee'] },
  { id: 12, name: 'Maya', age: 26, distanceKm: 5, verified: false, emoji: '👩🏽',
    grad: ['#3BE0C9', '#FF5E8A'], interests: ['📸 Photo', '🐕 Dogs', '🍕 Food'] },
  { id: 13, name: 'Sara', age: 23, distanceKm: 2, verified: true, emoji: '👩🏼',
    grad: ['#7C4DFF', '#3BE0C9'], interests: ['🎨 Art', '📚 Books', '🧘 Yoga'] },
  { id: 14, name: 'Rina', age: 28, distanceKm: 8, verified: false, emoji: '👩🏾',
    grad: ['#FF5E8A', '#FF9F45'], interests: ['🏋️ Gym', '🎬 Movies', '🌮 Tacos'] },
]

export const matchesList = [
  { id: 21, name: 'Aisha', emoji: '👩🏻', grad: ['#FF5E8A', '#FF9F45'], last: 'Wanna video? 📹', time: '2m', online: true, unread: true },
  { id: 22, name: 'Maya', emoji: '👩🏽', grad: ['#7C4DFF', '#3BE0C9'], last: 'Typing…', time: 'now', online: true, unread: false },
  { id: 23, name: 'Sara', emoji: '👩🏼', grad: ['#FF9F45', '#7C4DFF'], last: 'Seen ✓✓', time: '1h', online: false, unread: false },
  { id: 24, name: 'Rina', emoji: '👩🏾', grad: ['#3BE0C9', '#FF5E8A'], last: 'Haha that was fun 😄', time: '3h', online: false, unread: false },
]

export const reels = [
  { id: 31, user: 'maya_sky', emoji: '🌅', grad: ['#12324a', '#2a0f2e'], caption: 'Golden hour on the rooftop 🌅✨ #sunsetvibes', likes: '1.2k', comments: '84', following: true },
  { id: 32, user: 'the.wanderer', emoji: '🏔️', grad: ['#0f2f3a', '#3a1030'], caption: 'Trek day 3 — worth every step 🥾', likes: '3.4k', comments: '210', following: true },
  { id: 33, user: 'coffee.aisha', emoji: '☕', grad: ['#3a2718', '#241533'], caption: 'Slow mornings ☕📖 #coffeelover', likes: '892', comments: '46', following: true },
]

export const conversation = [
  { id: 1, from: 'them', text: 'Hey! Loved your travel reel 😍' },
  { id: 2, from: 'me', text: 'Haha thanks! That was Bali 🌴' },
  { id: 3, from: 'them', text: "No way, it's on my list!" },
  { id: 4, from: 'me', text: 'Wanna hop on a quick video? 📹' },
  { id: 5, from: 'them', text: 'Yes! Give me 5 min 😄' },
]

export const me = {
  name: 'Rahim', age: 27, emoji: '🧑🏻', grad: ['#7C4DFF', '#3BE0C9'],
  bio: 'Coffee, code and long drives. Looking for someone to explore the city with.',
  interests: ['🏋️ Gym', '🍜 Food', '🎸 Music', '🚗 Drives'],
  photos: ['🧑🏻', '🏖️', '🎸'],
  prefs: { interestedIn: 'Everyone', ageRange: '22 – 32', distance: '50 km' },
}

export const grad = (arr) => `linear-gradient(160deg, ${arr[0]}, ${arr[1]})`
