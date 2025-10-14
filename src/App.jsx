import React, { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import AdminPanel from './components/AdminPanel'
import TrackGrid from './components/TrackGrid'
import GenreFilter from './components/GenreFilter'

function App() {
  const [tracks, setTracks] = useState([])
  const [filteredTracks, setFilteredTracks] = useState([])
  const [genres, setGenres] = useState([])
  const [selectedGenre, setSelectedGenre] = useState('All')
  const [tags, setTags] = useState([])
  const [selectedTag, setSelectedTag] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [siteTitle, setSiteTitle] = useState('Audio Portfolio')
  const [siteDescription, setSiteDescription] = useState('Showcasing creative audio work and musical compositions')

  // Load tracks from Supabase or JSON fallback
  const loadTracks = async () => {
    try {
      setLoading(true)
      setError('')

      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('tracks')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setTracks(data || [])
      } else {
        // Fallback to JSON file
        const response = await fetch('/tracks.json')
        if (!response.ok) {
          throw new Error('Failed to load tracks.json')
        }
        const data = await response.json()
        setTracks(data || [])
      }
    } catch (err) {
      console.error('Error loading tracks:', err)
      setError('Failed to load tracks. Please try again.')
      setTracks([])
    } finally {
      setLoading(false)
    }
  }

  // Extract unique genres from tracks
  useEffect(() => {
    const uniqueGenres = [...new Set(tracks.map(track => track.genre))].filter(Boolean)
    setGenres(['All', ...uniqueGenres])
  }, [tracks])

  // Extract unique tags from tracks
  useEffect(() => {
    const allTags = tracks.flatMap(track => track.tags || [])
    const uniqueTags = [...new Set(allTags)].filter(Boolean)
    setTags(['All', ...uniqueTags])
  }, [tracks])

  // Filter tracks by selected genre and tag
  useEffect(() => {
    let filtered = tracks

    // Filter by genre
    if (selectedGenre !== 'All') {
      filtered = filtered.filter(track => track.genre === selectedGenre)
    }

    // Filter by tag
    if (selectedTag !== 'All') {
      filtered = filtered.filter(track => 
        track.tags && track.tags.includes(selectedTag)
      )
    }

    setFilteredTracks(filtered)
  }, [tracks, selectedGenre, selectedTag])

  // Check authentication status
  useEffect(() => {
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  // Load tracks on mount
  useEffect(() => {
    loadTracks()
  }, [])

  // Load saved background controls and legacy colour
  useEffect(() => {
    const savedBg = localStorage.getItem('portfolioBgControls')
    const savedColor = localStorage.getItem('portfolioBackgroundColor')
    const savedTitle = localStorage.getItem('portfolioSiteTitle')
    const savedDescription = localStorage.getItem('portfolioSiteDescription')

    const root = document.body
    const applyVars = (ctrls) => {
      if (!ctrls) return
      root.style.setProperty('--bg-color1', ctrls.color1)
      root.style.setProperty('--bg-color2', ctrls.color2)
      root.style.setProperty('--bg-pos1x', `${ctrls.pos1x}%`)
      root.style.setProperty('--bg-pos1y', `${ctrls.pos1y}%`)
      root.style.setProperty('--bg-pos2x', `${ctrls.pos2x}%`)
      root.style.setProperty('--bg-pos2y', `${ctrls.pos2y}%`)
      root.style.setProperty('--bg-intensity', String(ctrls.intensity))
    }

    if (savedBg) {
      try {
        const ctrls = JSON.parse(savedBg)
        // ensure no hard override that blocks gradients
        root.style.background = ''
        applyVars(ctrls)
      } catch {}
    } else if (savedColor) {
      root.style.background = ''
      root.style.setProperty('--bg-color1', savedColor)
    }
    if (savedTitle) setSiteTitle(savedTitle)
    if (savedDescription) setSiteDescription(savedDescription)

    const handleSettingsChange = (e) => {
      if (e.detail.title) setSiteTitle(e.detail.title)
      if (e.detail.description) setSiteDescription(e.detail.description)
    }
    window.addEventListener('siteSettingsChanged', handleSettingsChange)
    return () => window.removeEventListener('siteSettingsChanged', handleSettingsChange)
  }, [])

  return (
    <div className="container">
      <header className="header">
        <h1>{siteTitle}</h1>
        <p>{siteDescription}</p>
      </header>

      {isSupabaseConfigured() && (
        <AdminPanel 
          user={user}
          onTrackUploaded={loadTracks}
        />
      )}

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading tracks...</div>
      ) : (
        <>
          <div className="filters-container">
            <div className="filter-section">
              <h3 className="filter-label">Filter by Genre:</h3>
              <GenreFilter
                genres={genres}
                selectedGenre={selectedGenre}
                onGenreSelect={setSelectedGenre}
              />
            </div>
            
            {tags.length > 1 && (
              <div className="filter-section">
                <h3 className="filter-label">Filter by Tag:</h3>
                <div className="genres-filter">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`genre-btn ${selectedTag === tag ? 'active' : ''}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {selectedGenre !== 'All' || selectedTag !== 'All' ? (
            <div className="active-filters">
              <span className="filter-text">
                Showing {filteredTracks.length} track{filteredTracks.length !== 1 ? 's' : ''}
                {selectedGenre !== 'All' && ` in ${selectedGenre}`}
                {selectedTag !== 'All' && ` tagged with "${selectedTag}"`}
              </span>
              {(selectedGenre !== 'All' || selectedTag !== 'All') && (
                <button 
                  className="clear-filters-btn"
                  onClick={() => {
                    setSelectedGenre('All')
                    setSelectedTag('All')
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : null}
          
          <TrackGrid 
            tracks={filteredTracks} 
            onTagClick={(tag) => setSelectedTag(tag)}
            onGenreClick={(genre) => setSelectedGenre(genre)}
          />
        </>
      )}
    </div>
  )
}

export default App
