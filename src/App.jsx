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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)

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

  // Filter tracks by selected genre
  useEffect(() => {
    if (selectedGenre === 'All') {
      setFilteredTracks(tracks)
    } else {
      setFilteredTracks(tracks.filter(track => track.genre === selectedGenre))
    }
  }, [tracks, selectedGenre])

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

  return (
    <div className="container">
      <header className="header">
        <h1>Audio Portfolio</h1>
        <p>Showcasing creative audio work and musical compositions</p>
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
          <GenreFilter
            genres={genres}
            selectedGenre={selectedGenre}
            onGenreSelect={setSelectedGenre}
          />
          
          <TrackGrid tracks={filteredTracks} />
        </>
      )}
    </div>
  )
}

export default App
