import React from 'react'

const GenreFilter = ({ genres, selectedGenre, onGenreSelect }) => {
  if (genres.length <= 1) {
    return null
  }

  return (
    <div className="genres-filter">
      {genres.map((genre) => (
        <button
          key={genre}
          className={`genre-btn ${selectedGenre === genre ? 'active' : ''}`}
          onClick={() => onGenreSelect(genre)}
        >
          {genre}
        </button>
      ))}
    </div>
  )
}

export default GenreFilter
