import { useState } from 'react'
import { reels, grad } from '../data/mock'

function Reel({ r }) {
  const [liked, setLiked] = useState(false)
  const [following, setFollowing] = useState(r.following)
  return (
    <div className="reel">
      <div className="vid" style={{ background: grad(r.grad) }}>{r.emoji}</div>
      <div className="side">
        <button onClick={() => setLiked((v) => !v)}>
          {liked ? '❤️' : '🤍'}<small>{r.likes}</small>
        </button>
        <button>💬<small>{r.comments}</small></button>
        <button>↗︎<small>Share</small></button>
      </div>
      <div className="meta">
        <div className="u">
          <span className="av" style={{ background: grad(r.grad) }} />
          @{r.user}
          <button className={'follow' + (following ? ' on' : '')} onClick={() => setFollowing((v) => !v)}>
            {following ? 'Following' : 'Follow'}
          </button>
        </div>
        <p>{r.caption}</p>
      </div>
    </div>
  )
}

export default function Reels() {
  return (
    <div className="screen">
      <div className="reels">
        {reels.map((r) => <Reel key={r.id} r={r} />)}
      </div>
    </div>
  )
}
