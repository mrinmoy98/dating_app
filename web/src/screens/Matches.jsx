import { matchesList, grad } from '../data/mock'

export default function Matches({ onOpenChat }) {
  return (
    <div className="screen">
      <div className="scr-head"><h1>Matches</h1></div>
      <div className="list">
        <div className="subhead">New matches</div>
        <div className="rail">
          {matchesList.map((m) => (
            <button className="m" key={m.id} onClick={() => onOpenChat(m)}>
              <div className="av" style={{ background: grad(m.grad), display: 'grid', placeItems: 'center', fontSize: 30 }}>{m.emoji}</div>
              <span>{m.name}</span>
            </button>
          ))}
        </div>

        <div className="subhead">Messages</div>
        {matchesList.map((m) => (
          <button className="row" key={m.id} style={{ width: '100%', textAlign: 'left' }} onClick={() => onOpenChat(m)}>
            <div className="av" style={{ background: grad(m.grad), display: 'grid', placeItems: 'center', fontSize: 26 }}>{m.emoji}</div>
            <div>
              <b>{m.name}</b>
              <small>{m.last}</small>
            </div>
            <div className="time">
              {m.time}
              <div style={{ marginTop: 6 }}>{m.unread ? <span className="dot" /> : (m.online ? <span className="dot" /> : '')}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
