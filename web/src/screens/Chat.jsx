import { useState } from 'react'
import { conversation, grad } from '../data/mock'

export default function Chat({ peer, onBack, onCall }) {
  const [msgs, setMsgs] = useState(conversation)
  const [text, setText] = useState('')

  const send = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setMsgs((m) => [...m, { id: Date.now(), from: 'me', text: text.trim() }])
    setText('')
  }

  return (
    <div className="screen">
      <div className="chat">
        <div className="chat-hd">
          <button className="icn" onClick={onBack}>‹</button>
          <div className="av" style={{ background: grad(peer.grad), display: 'grid', placeItems: 'center', fontSize: 22 }}>{peer.emoji}</div>
          <div>
            <b>{peer.name}</b>
            <div className="st">● Online</div>
          </div>
          <div className="sp">
            <button className="icn">📞</button>
            <button className="icn" onClick={onCall}>📹</button>
          </div>
        </div>

        <div className="msgs">
          {msgs.map((m) => (
            <div key={m.id} className={'bub ' + m.from}>{m.text}</div>
          ))}
        </div>

        <form className="composer" onSubmit={send}>
          <button type="button" className="icn">＋</button>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message…" />
          <button type="submit" className="send">➤</button>
        </form>
      </div>
    </div>
  )
}
