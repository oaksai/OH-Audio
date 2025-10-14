import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'

const AudioPlayer = ({ src, title }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef(null)
  const progressRef = useRef(null)
  const [fallbackNative, setFallbackNative] = useState(false)

  const getMimeTypeFromUrl = (url) => {
    const lower = (url || '').toLowerCase()
    if (lower.endsWith('.mp3')) return 'audio/mpeg'
    if (lower.endsWith('.ogg') || lower.endsWith('.oga')) return 'audio/ogg'
    if (lower.endsWith('.wav')) return 'audio/wav'
    return 'audio/mpeg' // sensible default
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleError = () => {
      // Fall back to native controls if custom fails to load/play
      setFallbackNative(true)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleProgressClick = (e) => {
    const progressBar = progressRef.current
    const rect = progressBar.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * duration
    
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    audioRef.current.volume = newVolume
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (isMuted) {
      audioRef.current.volume = volume
      setIsMuted(false)
    } else {
      audioRef.current.volume = 0
      setIsMuted(true)
    }
  }

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  if (fallbackNative) {
    // Native fallback with multiple sources for broad support
    return (
      <audio 
        className="audio-player" 
        controls 
        preload="metadata"
        crossOrigin="anonymous"
        onError={() => {/* hide error loop */}}
      >
        <source src={src} type={getMimeTypeFromUrl(src)} />
        <source src={src} type="audio/mpeg" />
        <source src={src} type="audio/ogg" />
        <source src={src} type="audio/wav" />
        Your browser does not support the audio element.
      </audio>
    )
  }

  return (
    <div className="audio-player-custom">
      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous">
        <source src={src} type={getMimeTypeFromUrl(src)} />
      </audio>
      
      <div className="audio-controls">
        <button 
          className="play-button" 
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <div className="time-display">
          {formatTime(currentTime)}
        </div>

        <div 
          className="progress-bar-container" 
          ref={progressRef}
          onClick={handleProgressClick}
        >
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progress}%` }}
            />
            <div 
              className="progress-bar-handle" 
              style={{ left: `${progress}%` }}
            />
          </div>
        </div>

        <div className="time-display">
          {formatTime(duration)}
        </div>

        <div className="volume-control">
          <button 
            className="volume-button" 
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
        </div>
      </div>
    </div>
  )
}

export default AudioPlayer

