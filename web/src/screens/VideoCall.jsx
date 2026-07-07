import { useEffect, useState } from 'react'
import { grad } from '../data/mock'

export default function VideoCall({ peer, onEnd }) {
  const [sec, setSec] = useState(0)
  const [muted, setMuted] = useState(false)
  const [camOff, setCamOff] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setSec((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const mm = String(Math.floor(sec / 60)).padStart(2, '0')
  const ss = String(sec % 60).padStart(2, '0')

  return (
    <div className="vc">
      <div className="name">{peer.name}<small>{mm}:{ss}</small></div>
      <div className="remote" style={{ background: camOff ? '#1a1020' : 'transparent' }}>{peer.emoji}</div>
      <div className="self">🙂</div>
      <div className="ctrl">
        <button className="b" style={{ opacity: muted ? 0.5 : 1 }} onClick={() => setMuted((v) => !v)}>{muted ? '🔇' : '🎤'}</button>
        <button className="b" style={{ opacity: camOff ? 0.5 : 1 }} onClick={() => setCamOff((v) => !v)}>📹</button>
        <button className="b end" onClick={onEnd}>☎️</button>
      </div>
    </div>
  )
}
