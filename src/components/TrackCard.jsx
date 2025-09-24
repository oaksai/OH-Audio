import React from 'react'
import { Music } from 'lucide-react'

const TrackCard = ({ track }) => {
  return (
    <div className="track-card">
      <div className="track-header">
        <div>
          <h3 className="track-title">{track.title}</h3>
          <span className="track-genre">{track.genre}</span>
        </div>
        <Music size={24} style={{ color: '#667eea', opacity: 0.7 }} />
      </div>

      {track.description && (
        <p className="track-description">{track.description}</p>
      )}

      {track.tags && track.tags.length > 0 && (
        <div className="track-tags">
          {track.tags.map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      <audio 
        className="audio-player" 
        controls 
        preload="metadata"
        onError={(e) => {
          console.error('Audio playback error:', e)
          e.target.style.display = 'none'
        }}
      >
        <source src={track.url} type="audio/mpeg" />
        <source src={track.url} type="audio/wav" />
        <source src={track.url} type="audio/ogg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  )
}

export default TrackCard
