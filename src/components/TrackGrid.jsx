import React from 'react'
import TrackCard from './TrackCard'

const TrackGrid = ({ tracks }) => {
  if (tracks.length === 0) {
    return (
      <div className="loading">
        No tracks found. Upload some audio files to get started!
      </div>
    )
  }

  return (
    <div className="tracks-grid">
      {tracks.map((track, index) => (
        <TrackCard key={track.id || index} track={track} />
      ))}
    </div>
  )
}

export default TrackGrid
