import React from 'react'
import { Music } from 'lucide-react'
import AudioPlayer from './AudioPlayer'

const TrackCard = ({ track, onTagClick }) => {
  return (
    <div className="track-card">
      {track.cover_art_url && (
        <div className="track-cover">
          <img 
            src={track.cover_art_url} 
            alt={track.title}
            className="cover-art"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        </div>
      )}
      
      <div className="track-header">
        <div>
          <h3 className="track-title">{track.title}</h3>
          <button 
            className="track-genre" 
            onClick={() => onGenreClick && onGenreClick(track.genre)}
            aria-label={`Filter by ${track.genre}`}
          >
            {track.genre}
          </button>
        </div>
        {!track.cover_art_url && <Music size={24} style={{ color: '#667eea', opacity: 0.7 }} />}
      </div>

      {track.description && (
        <p className="track-description">{track.description}</p>
      )}

      {track.tags && track.tags.length > 0 && (
        <div className="track-tags">
          {track.tags.map((tag, index) => (
            <button 
              key={index} 
              className="tag"
              onClick={() => onTagClick && onTagClick(tag)}
              aria-label={`Filter by ${tag}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <AudioPlayer src={track.url} title={track.title} />
    </div>
  )
}

export default TrackCard
