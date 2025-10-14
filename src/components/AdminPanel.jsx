import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Upload, LogIn, LogOut, Loader, Edit, Trash2, Plus, Save, X, Image, Settings } from 'lucide-react'

const AdminPanel = ({ user, onTrackUploaded }) => {
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [uploadData, setUploadData] = useState({
    title: '',
    genre: '',
    description: '',
    tags: '',
    file: null,
    coverArt: null,
    markers: ['', '', '', '']
  })
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [tracks, setTracks] = useState([])
  const [editingTrack, setEditingTrack] = useState(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [backgroundColor, setBackgroundColor] = useState('#f5f5f5')
  const [showSettings, setShowSettings] = useState(false)
  const [siteTitleInput, setSiteTitleInput] = useState('Audio Portfolio')
  const [siteDescriptionInput, setSiteDescriptionInput] = useState('Showcasing creative audio work and musical compositions')
  const [bgControls, setBgControls] = useState({
    color1: '#f5f5f5',
    color2: '#eaeaea',
    pos1x: 20,
    pos1y: 20,
    pos2x: 80,
    pos2y: 80,
    intensity: 1
  })
  const [draftBgControls, setDraftBgControls] = useState({
    color1: '#f5f5f5',
    color2: '#eaeaea',
    pos1x: 20,
    pos1y: 20,
    pos2x: 80,
    pos2y: 80,
    intensity: 1
  })

  // Load tracks for admin management
  const loadTracks = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTracks(data || [])
    } catch (error) {
      console.error('Error loading tracks:', error)
      setMessage(`Failed to load tracks: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Load tracks when user logs in
  useEffect(() => {
    if (user) {
      loadTracks()
      // Test bucket access
      checkBuckets()
    } else {
      setTracks([])
    }
  }, [user])

  const checkBuckets = async () => {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets()
      if (error) {
        console.error('Error listing buckets:', error)
      } else {
        console.log('Available buckets:', buckets)
        const audioExists = buckets.some(b => b.name === 'Audio')
        const imagesExists = buckets.some(b => b.name === 'images')
        
        if (!audioExists || !imagesExists) {
          setMessage(`Missing buckets! Audio: ${audioExists ? '✓' : '✗'}, images: ${imagesExists ? '✓' : '✗'}`)
        } else {
          console.log('✓ All required buckets exist')
        }
      }
    } catch (err) {
      console.error('Bucket check error:', err)
    }
  }

  // Load saved background color from localStorage
  useEffect(() => {
    const savedColor = localStorage.getItem('portfolioBackgroundColor')
    const savedTitle = localStorage.getItem('portfolioSiteTitle')
    const savedDescription = localStorage.getItem('portfolioSiteDescription')
    const savedBg = localStorage.getItem('portfolioBgControls')
    if (savedColor) {
      setBackgroundColor(savedColor)
      // Treat legacy savedColor as blob 1 colour draft
      handleBgDraftChange('color1', savedColor)
    }
    if (savedTitle) setSiteTitleInput(savedTitle)
    if (savedDescription) setSiteDescriptionInput(savedDescription)
    if (savedBg) {
      try {
        const parsed = JSON.parse(savedBg)
        setBgControls(parsed)
        setDraftBgControls(parsed)
        applyBgControls(parsed)
      } catch {}
    }
  }, [])

  // Update background color
  const handleColorChange = (color) => {
    setBackgroundColor(color)
    // Update draft only; requires explicit Save
    handleBgDraftChange('color1', color)
    localStorage.setItem('portfolioBackgroundColor', color)
    setMessage('Background colour updated!')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleSaveSiteSettings = () => {
    localStorage.setItem('portfolioSiteTitle', siteTitleInput)
    localStorage.setItem('portfolioSiteDescription', siteDescriptionInput)
    // Notify the app so it updates immediately without reload
    window.dispatchEvent(new CustomEvent('siteSettingsChanged', {
      detail: { title: siteTitleInput, description: siteDescriptionInput }
    }))
    setMessage('Site settings saved!')
    setTimeout(() => setMessage(''), 2500)
  }

  const applyBgControls = (controls) => {
    const root = document.body
    root.style.setProperty('--bg-color1', controls.color1)
    root.style.setProperty('--bg-color2', controls.color2)
    root.style.setProperty('--bg-pos1x', `${controls.pos1x}%`)
    root.style.setProperty('--bg-pos1y', `${controls.pos1y}%`)
    root.style.setProperty('--bg-pos2x', `${controls.pos2x}%`)
    root.style.setProperty('--bg-pos2y', `${controls.pos2y}%`)
    root.style.setProperty('--bg-intensity', String(controls.intensity))
  }

  const handleBgDraftChange = (key, value) => {
    setDraftBgControls(prev => ({ ...prev, [key]: value }))
  }

  const saveBgControls = () => {
    setBgControls(draftBgControls)
    applyBgControls(draftBgControls)
    localStorage.setItem('portfolioBgControls', JSON.stringify(draftBgControls))
    setMessage('Background updated!')
    setTimeout(() => setMessage(''), 2000)
  }

  const cancelBgControls = () => {
    setDraftBgControls(bgControls)
    // Re-apply current saved controls to ensure display matches
    applyBgControls(bgControls)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase.auth.signInWithPassword(loginData)
      if (error) throw error
      setMessage('Logged in successfully!')
      setLoginData({ email: '', password: '' })
    } catch (error) {
      setMessage(`Login failed: ${error.message}`)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase.auth.signUp(loginData)
      if (error) throw error
      setMessage('Account created! Check your email to verify (or login if email confirmation is disabled).')
      setLoginData({ email: '', password: '' })
    } catch (error) {
      setMessage(`Signup failed: ${error.message}`)
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setMessage('Logged out successfully!')
    } catch (error) {
      setMessage(`Logout failed: ${error.message}`)
    }
  }

  const uploadFile = async (file, bucket) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    
    console.log(`Attempting to upload to bucket: ${bucket}`)
    console.log('File details:', { name: file.name, type: file.type, size: file.size })
    
    // First, check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError)
      throw new Error(`Cannot access storage: ${bucketsError.message}`)
    }
    
    console.log('Available buckets:', buckets.map(b => ({ name: b.name, public: b.public })))
    
    const bucketExists = buckets.some(b => b.name === bucket)
    if (!bucketExists) {
      throw new Error(`Bucket "${bucket}" does not exist. Available buckets: ${buckets.map(b => b.name).join(', ')}`)
    }
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined
      })

    if (uploadError) {
      console.error('Upload error details:', uploadError)
      throw new Error(`Failed to upload to ${bucket}: ${uploadError.message}`)
    }

    console.log('Upload successful:', uploadData)

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    console.log('Public URL generated:', publicUrl)
    return publicUrl
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadData.file || !uploadData.title || !uploadData.genre) {
      setMessage('Please fill in all required fields and select a file.')
      return
    }

    setUploading(true)
    console.log('Starting upload process...')
    console.log('User logged in:', !!user)
    
    try {
      // Upload audio file
      console.log('Uploading audio file...')
      const audioUrl = await uploadFile(uploadData.file, 'Audio')
      console.log('Audio uploaded successfully:', audioUrl)
      
      // Upload cover art if provided
      let coverArtUrl = null
      if (uploadData.coverArt) {
        console.log('Uploading cover art...')
        coverArtUrl = await uploadFile(uploadData.coverArt, 'images')
        console.log('Cover art uploaded successfully:', coverArtUrl)
      }

      // Insert track data into database
      console.log('Inserting track data into database...')
      const parsedMarkers = (uploadData.markers || [])
        .map(v => parseFloat(v))
        .filter(v => Number.isFinite(v) && v >= 0)

      const trackData = {
        title: uploadData.title,
        url: audioUrl,
        genre: uploadData.genre,
        description: uploadData.description || null,
        tags: uploadData.tags ? uploadData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : null,
        cover_art_url: coverArtUrl,
        markers: parsedMarkers.length ? parsedMarkers.slice(0, 4) : null
      }
      console.log('Track data:', trackData)

      const { data: insertData, error: insertError } = await supabase
        .from('tracks')
        .insert([trackData])

      if (insertError) {
        console.error('Database insert error:', insertError)
        throw insertError
      }

      console.log('Track inserted successfully!')
      setMessage('Track uploaded successfully!')
      setUploadData({ title: '', genre: '', description: '', tags: '', file: null, coverArt: null, markers: ['', '', '', ''] })
      setShowUploadForm(false)
      
      // Reset file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]')
      fileInputs.forEach(input => input.value = '')

      // Refresh tracks
      onTrackUploaded()
      loadTracks()
    } catch (error) {
      console.error('Upload error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      setMessage(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = async (trackId, updatedData) => {
    try {
      setUploading(true)
      
      // Upload new cover art if provided
      if (updatedData.coverArt && typeof updatedData.coverArt !== 'string') {
        updatedData.cover_art_url = await uploadFile(updatedData.coverArt, 'images')
        delete updatedData.coverArt
      }

      // Upload new audio file if provided
      if (updatedData.file) {
        updatedData.url = await uploadFile(updatedData.file, 'audio')
        delete updatedData.file
      }

      // Process tags
      if (updatedData.tags && typeof updatedData.tags === 'string') {
        updatedData.tags = updatedData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      }

      // Process markers
      if (updatedData.markers) {
        const parsed = updatedData.markers
          .map(v => (typeof v === 'string' ? parseFloat(v) : v))
          .filter(v => Number.isFinite(v) && v >= 0)
        updatedData.markers = parsed.length ? parsed.slice(0, 4) : null
      }

      const { error } = await supabase
        .from('tracks')
        .update(updatedData)
        .eq('id', trackId)

      if (error) throw error

      setMessage('Track updated successfully!')
      setEditingTrack(null)
      loadTracks()
      onTrackUploaded()
    } catch (error) {
      console.error('Edit error:', error)
      setMessage(`Update failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (trackId) => {
    if (!confirm('Are you sure you want to delete this track?')) return

    try {
      const { error } = await supabase
        .from('tracks')
        .delete()
        .eq('id', trackId)

      if (error) throw error

      setMessage('Track deleted successfully!')
      loadTracks()
      onTrackUploaded()
    } catch (error) {
      console.error('Delete error:', error)
      setMessage(`Delete failed: ${error.message}`)
    }
  }

  const EditForm = ({ track, onSave, onCancel }) => {
    const [editData, setEditData] = useState({
      title: track.title,
      genre: track.genre,
      description: track.description || '',
      tags: Array.isArray(track.tags) ? track.tags.join(', ') : '',
      file: null,
      coverArt: null,
      markers: Array.isArray(track.markers) ? track.markers.map(m => String(m)) : ['', '', '', '']
    })

    const handleSubmit = (e) => {
      e.preventDefault()
      onSave(track.id, editData)
    }

    return (
      <form onSubmit={handleSubmit} className="edit-form">
        <div className="form-row">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Genre *</label>
            <input
              type="text"
              value={editData.genre}
              onChange={(e) => setEditData(prev => ({ ...prev, genre: e.target.value }))}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={editData.description}
            onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Track description"
          />
        </div>
        <div className="form-group">
          <label>Tags</label>
          <input
            type="text"
            value={editData.tags}
            onChange={(e) => setEditData(prev => ({ ...prev, tags: e.target.value }))}
            placeholder="film, commercial, upbeat (comma-separated)"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Replace Audio File</label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setEditData(prev => ({ ...prev, file: e.target.files[0] }))}
            />
          </div>
          <div className="form-group">
            <label>Replace Cover Art</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setEditData(prev => ({ ...prev, coverArt: e.target.files[0] }))}
            />
          </div>
        </div>
        <div className="form-row">
          {[0,1,2,3].map((i) => (
            <div key={i} className="form-group">
              <label>Marker {i+1} (seconds)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editData.markers[i] || ''}
                onChange={(e) => setEditData(prev => {
                  const m = [...prev.markers]
                  m[i] = e.target.value
                  return { ...prev, markers: m }
                })}
                placeholder="e.g., 30.0"
              />
            </div>
          ))}
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            <Save size={16} />
            Save Changes
          </button>
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            <X size={16} />
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>Admin Panel</h2>
        {user && (
          <div className="admin-actions">
            <button 
              onClick={() => setShowSettings(!showSettings)} 
              className="btn btn-secondary"
            >
              <Settings size={16} />
              Settings
            </button>
            <button 
              onClick={() => setShowUploadForm(!showUploadForm)} 
              className="btn btn-primary"
            >
              <Plus size={16} />
              Add Track
            </button>
            <button onClick={handleLogout} className="btn btn-secondary">
              <LogOut size={16} />
              Logout ({user.email})
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className={message.includes('successfully') ? 'success' : 'error'}>
          {message}
        </div>
      )}

      {!user ? (
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={loginData.email}
              onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
              required
              placeholder="admin@example.com"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
              required
              placeholder="••••••••"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <LogIn size={16} />
              Login
            </button>
            <button type="button" onClick={handleSignup} className="btn btn-secondary">
              Create Account
            </button>
          </div>
        </form>
      ) : (
        <>
          {showSettings && (
            <div className="settings-section">
              <h3>Site Settings</h3>
              <div className="settings-content">
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Site Title</label>
                    <input
                      type="text"
                      value={siteTitleInput}
                      onChange={(e) => setSiteTitleInput(e.target.value)}
                      placeholder="Audio Portfolio"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Site Description</label>
                    <input
                      type="text"
                      value={siteDescriptionInput}
                      onChange={(e) => setSiteDescriptionInput(e.target.value)}
                      placeholder="Showcasing creative audio work and musical compositions"
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button className="btn btn-primary" type="button" onClick={handleSaveSiteSettings}>Save Title & Description</button>
                </div>
                <div className="color-picker-group">
                  <label htmlFor="bgColorPicker">Background Color</label>
                  <div className="color-picker-controls">
                    <input
                      id="bgColorPicker"
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="color-input"
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      placeholder="#f5f5f5"
                      className="color-text-input"
                      maxLength="7"
                    />
                    <div className="preset-colors">
                      <button
                        className="preset-color"
                        style={{ background: '#f5f5f5' }}
                        onClick={() => handleColorChange('#f5f5f5')}
                        title="Light Gray"
                      />
                      <button
                        className="preset-color"
                        style={{ background: '#ffffff' }}
                        onClick={() => handleColorChange('#ffffff')}
                        title="White"
                      />
                      <button
                        className="preset-color"
                        style={{ background: '#1f2937' }}
                        onClick={() => handleColorChange('#1f2937')}
                        title="Dark Gray"
                      />
                      <button
                        className="preset-color"
                        style={{ background: '#0f172a' }}
                        onClick={() => handleColorChange('#0f172a')}
                        title="Dark Blue"
                      />
                      <button
                        className="preset-color"
                        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                        onClick={() => handleColorChange('linear-gradient(135deg, #667eea 0%, #764ba2 100%)')}
                        title="Purple Gradient"
                      />
                      <button
                        className="preset-color"
                        style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
                        onClick={() => handleColorChange('linear-gradient(135deg, #f093fb 0%, #f5576c 100%)')}
                        title="Pink Gradient"
                      />
                    </div>
                  </div>
                  <p className="setting-description">Choose a background color for your portfolio site</p>
                </div>
                <div className="upload-section" style={{ marginTop: '1rem' }}>
                  <h3>Colour Manipulators</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Blob 1 Color</label>
                      <input type="color" value={draftBgControls.color1} onChange={(e) => handleBgDraftChange('color1', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Blob 2 Color</label>
                      <input type="color" value={draftBgControls.color2} onChange={(e) => handleBgDraftChange('color2', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Blob 1 X (%)</label>
                      <input type="range" min="0" max="100" value={draftBgControls.pos1x} onChange={(e) => handleBgDraftChange('pos1x', Number(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label>Blob 1 Y (%)</label>
                      <input type="range" min="0" max="100" value={draftBgControls.pos1y} onChange={(e) => handleBgDraftChange('pos1y', Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Blob 2 X (%)</label>
                      <input type="range" min="0" max="100" value={draftBgControls.pos2x} onChange={(e) => handleBgDraftChange('pos2x', Number(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label>Blob 2 Y (%)</label>
                      <input type="range" min="0" max="100" value={draftBgControls.pos2y} onChange={(e) => handleBgDraftChange('pos2y', Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group" style={{ width: '100%' }}>
                      <label>Intensity</label>
                      <input type="range" min="0.5" max="2" step="0.05" value={draftBgControls.intensity} onChange={(e) => handleBgDraftChange('intensity', Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn btn-primary" onClick={saveBgControls}>Save Background</button>
                    <button type="button" className="btn btn-secondary" onClick={cancelBgControls}>Cancel</button>
                    </div>
                  <p className="setting-description">Adjust positions, colors, and intensity, then click Save.</p>
                </div>
              </div>
            </div>
          )}

          {showUploadForm && (
            <div className="upload-section">
              <h3>Upload New Track</h3>
              <form onSubmit={handleUpload} className="upload-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Audio File *</label>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setUploadData(prev => ({ ...prev, file: e.target.files[0] }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Cover Art</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setUploadData(prev => ({ ...prev, coverArt: e.target.files[0] }))}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      value={uploadData.title}
                      onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                      required
                      placeholder="Track title"
                    />
                  </div>
                  <div className="form-group">
                    <label>Genre *</label>
                    <input
                      type="text"
                      value={uploadData.genre}
                      onChange={(e) => setUploadData(prev => ({ ...prev, genre: e.target.value }))}
                      required
                      placeholder="e.g., Ambient, Lofi, Electronic"
                    />
                  </div>
                </div>
                <div className="form-row">
                  {[0,1,2,3].map((i) => (
                    <div key={i} className="form-group">
                      <label>Marker {i+1} (seconds)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={uploadData.markers[i]}
                        onChange={(e) => {
                          const val = e.target.value
                          setUploadData(prev => {
                            const m = [...prev.markers]
                            m[i] = val
                            return { ...prev, markers: m }
                          })
                        }}
                        placeholder="e.g., 12.5"
                      />
                    </div>
                  ))}
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={uploadData.description}
                    onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description of the track"
                  />
                </div>
                <div className="form-group">
                  <label>Tags</label>
                  <input
                    type="text"
                    value={uploadData.tags}
                    onChange={(e) => setUploadData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="film, commercial, upbeat (comma-separated)"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Upload & Save
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowUploadForm(false)} 
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="tracks-management">
            <h3>Manage Tracks ({tracks.length})</h3>
            {loading ? (
              <div className="loading">Loading tracks...</div>
            ) : tracks.length === 0 ? (
              <div className="no-tracks">No tracks found. Upload your first track!</div>
            ) : (
              <div className="tracks-list">
                {tracks.map((track) => (
                  <div key={track.id} className="track-item">
                    {editingTrack === track.id ? (
                      <EditForm
                        track={track}
                        onSave={handleEdit}
                        onCancel={() => setEditingTrack(null)}
                      />
                    ) : (
                      <>
                        <div className="track-info">
                          {track.cover_art_url && (
                            <img 
                              src={track.cover_art_url} 
                              alt={track.title}
                              className="track-thumbnail"
                            />
                          )}
                          <div className="track-details">
                            <h4>{track.title}</h4>
                            <p className="track-meta">{track.genre} • {new Date(track.created_at).toLocaleDateString()}</p>
                            {track.description && <p className="track-desc">{track.description}</p>}
                            {track.tags && track.tags.length > 0 && (
                              <div className="track-tags-preview">
                                {track.tags.map((tag, index) => (
                                  <span key={index} className="tag-small">{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="track-actions">
                          <button 
                            onClick={() => setEditingTrack(track.id)} 
                            className="btn btn-small btn-secondary"
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(track.id)} 
                            className="btn btn-small btn-danger"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default AdminPanel

