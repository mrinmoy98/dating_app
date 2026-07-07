import { useState, useRef } from 'react'
import { candidates, grad } from '../data/mock'

export default function Discover({ onMatch }) {
  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState({ x: 0, active: false })
  const start = useRef(0)

  const current = candidates[index]
  const next = candidates[index + 1]

  const swipe = (dir) => {
    // dir: 'like' | 'nope' | 'super'
    if (dir === 'like' && current && current.id === 11) onMatch(current)
    setDrag({ x: 0, active: false })
    setIndex((i) => i + 1)
  }

  const onDown = (e) => {
    start.current = e.clientX
    setDrag({ x: 0, active: true })
  }
  const onMove = (e) => {
    if (!drag.active) return
    setDrag((d) => ({ ...d, x: e.clientX - start.current }))
  }
  const onUp = () => {
    if (drag.x > 120) return swipe('like')
    if (drag.x < -120) return swipe('nope')
    setDrag({ x: 0, active: false })
  }

  return (
    <div className="screen">
      <div className="scr-head">
        <h1>Discover</h1>
        <button className="icn">⚙︎</button>
      </div>

      <div className="deck-wrap">
        {!current ? (
          <div className="empty">
            <h3>You're all caught up ✨</h3>
            <p>Come back later for fresh people near you.</p>
          </div>
        ) : (
          <div className="deck">
            {next && (
              <div className="card" style={{ transform: 'scale(.95) translateY(10px)', filter: 'brightness(.7)' }}>
                <div className="photo" style={{ background: grad(next.grad) }}>{next.emoji}</div>
              </div>
            )}
            <div
              className="card"
              style={{
                transform: `translateX(${drag.x}px) rotate(${drag.x / 22}deg)`,
                transition: drag.active ? 'none' : 'transform .3s ease',
                cursor: 'grab',
              }}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerLeave={onUp}
            >
              <div className="photo" style={{ background: grad(current.grad) }}>{current.emoji}</div>
              <div className="stamp like" style={{ opacity: Math.max(0, drag.x / 120) }}>Like</div>
              <div className="stamp nope" style={{ opacity: Math.max(0, -drag.x / 120) }}>Nope</div>
              <div className="info">
                <h3>{current.name}, {current.age} {current.verified && <span className="badge">✓</span>}</h3>
                <div className="dist">📍 {current.distanceKm} km away · Active now</div>
                <div className="chips">
                  {current.interests.map((i) => <span className="chip" key={i}>{i}</span>)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {current && (
        <div className="actions">
          <button className="act no" onClick={() => swipe('nope')}>✕</button>
          <button className="act star" onClick={() => swipe('super')}>⭐</button>
          <button className="act yes" onClick={() => swipe('like')}>❤️</button>
        </div>
      )}
      <div style={{ height: 26 }} />
    </div>
  )
}
