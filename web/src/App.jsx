import { useState } from 'react'
import Aurora from './components/Aurora'
import Sidebar from './components/Sidebar'
import Discover from './screens/Discover'
import Reels from './screens/Reels'
import Matches from './screens/Matches'
import Chat from './screens/Chat'
import Profile from './screens/Profile'
import VideoCall from './screens/VideoCall'
import { matchesList } from './data/mock'

export default function App() {
  const [tab, setTab] = useState('discover')
  const [peer, setPeer] = useState(null)      // active chat peer
  const [inCall, setInCall] = useState(false)
  const [match, setMatch] = useState(null)    // "It's a match" popup

  const openChat = (m) => { setPeer(m); setTab('chat') }

  return (
    <div className="app">
      <Aurora />
      <Sidebar active={tab} onChange={(t) => { setTab(t); if (t !== 'chat') setPeer(null) }} />

      <div className="stage">
        {tab === 'discover' && <Discover onMatch={(c) => setMatch(c)} />}
        {tab === 'reels' && <Reels />}
        {tab === 'matches' && <Matches onOpenChat={openChat} />}
        {tab === 'chat' && (
          peer
            ? <Chat peer={peer} onBack={() => setTab('matches')} onCall={() => setInCall(true)} />
            : <Matches onOpenChat={openChat} />
        )}
        {tab === 'profile' && <Profile />}
      </div>

      {inCall && peer && <VideoCall peer={peer} onEnd={() => setInCall(false)} />}

      {match && (
        <div className="matchpop">
          <div className="avs">
            <div style={{ background: 'linear-gradient(135deg,var(--p2),var(--p4))' }}>🧑🏻</div>
            <div style={{ background: 'linear-gradient(135deg,var(--p1),var(--p3))' }}>{match.emoji}</div>
          </div>
          <h2>It's a Match!</h2>
          <p>You and {match.name} liked each other</p>
          <div className="m-actions">
            <button className="primary" onClick={() => {
              const peerMatch = matchesList.find((x) => x.name === match.name) || matchesList[0]
              setMatch(null); openChat(peerMatch)
            }}>Say hi 💬</button>
            <button className="secondary" onClick={() => setMatch(null)}>Keep swiping</button>
          </div>
        </div>
      )}
    </div>
  )
}
