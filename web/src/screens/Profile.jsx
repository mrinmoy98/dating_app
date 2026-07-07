import { useState } from 'react'
import { me, grad } from '../data/mock'

export default function Profile() {
  const [interestedIn, setInterestedIn] = useState('Everyone')

  return (
    <div className="screen">
      <div className="scr-head"><h1>Profile</h1><button className="icn">⚙︎</button></div>
      <div className="profile">
        <div className="p-top">
          <div className="big" style={{ background: grad(me.grad) }}>{me.emoji}</div>
          <h2>{me.name}, {me.age}</h2>
          <button className="editbtn">✎ Edit profile</button>
        </div>

        <div className="panel">
          <h4>Photos</h4>
          <div className="gallery">
            {me.photos.map((p, i) => (
              <div key={i} style={{ background: grad([me.grad[i % 2], me.grad[(i + 1) % 2]]) }}>{p}</div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h4>About</h4>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--muted)' }}>{me.bio}</p>
        </div>

        <div className="panel">
          <h4>Interests</h4>
          <div className="seg">
            {me.interests.map((i) => <span className="chip" key={i}>{i}</span>)}
          </div>
        </div>

        <div className="panel">
          <h4>I'm interested in</h4>
          <div className="seg">
            {['Man', 'Woman', 'Everyone'].map((g) => (
              <button key={g} className={interestedIn === g ? 'on' : ''} onClick={() => setInterestedIn(g)}>{g}</button>
            ))}
          </div>
        </div>

        <div className="panel">
          <h4>Preferences</h4>
          <div className="pref"><span>Age range</span><span>{me.prefs.ageRange}</span></div>
          <div className="pref"><span>Maximum distance</span><span>{me.prefs.distance}</span></div>
        </div>

        <button className="navbtn" style={{ color: 'var(--danger)', justifyContent: 'center', border: '1px solid var(--glass-brd)', borderRadius: 16 }}>
          Log out
        </button>
      </div>
    </div>
  )
}
