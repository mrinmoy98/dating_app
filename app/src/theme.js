// Shared design tokens — mirrors web/src/index.css :root variables.
export const colors = {
  bg: '#0b0710',
  ink: '#F6F1FA',
  muted: '#A99DB6',
  glass: 'rgba(255,255,255,0.06)',
  glassBrd: 'rgba(255,255,255,0.12)',
  p1: '#FF5E8A', // rose
  p2: '#7C4DFF', // violet
  p3: '#FF9F45', // amber
  p4: '#3BE0C9', // mint
  danger: '#ff6b6b',
}

export const radius = { card: 26, pill: 100, sheet: 24 }
export const font = {
  serif: 'Fraunces',        // load via expo-font in a real build; falls back to system
  sans: 'System',
}
