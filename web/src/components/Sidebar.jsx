const TABS = [
  { key: 'discover', icon: '🔥', label: 'Discover' },
  { key: 'reels', icon: '🎬', label: 'Reels' },
  { key: 'matches', icon: '❤️', label: 'Matches' },
  { key: 'chat', icon: '💬', label: 'Chats' },
  { key: 'profile', icon: '👤', label: 'Profile' },
]

export default function Sidebar({ active, onChange }) {
  return (
    <>
      <aside className="sidebar">
        <div className="brand"><span className="mk">💜</span> Amour</div>
        {TABS.map((t) => (
          <button key={t.key} className={'navbtn' + (active === t.key ? ' on' : '')} onClick={() => onChange(t.key)}>
            <span className="ico">{t.icon}</span> {t.label}
          </button>
        ))}
        <button className="navbtn" style={{ marginTop: 'auto' }}>
          <span className="ico">⚙︎</span> Settings
        </button>
      </aside>

      <nav className="mtabbar">
        {TABS.map((t) => (
          <button key={t.key} className={active === t.key ? 'on' : ''} onClick={() => onChange(t.key)}>
            {t.icon}
          </button>
        ))}
      </nav>
    </>
  )
}
