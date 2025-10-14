import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Upload, LogIn, LogOut, Loader, Edit, Trash2, Plus, Save, X, Image } from 'lucide-react'

const AdminPanel = ({ user, onTrackUploaded }) => {
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [uploadData, setUploadData] = useState({
    title: '',
    genre: '',
    description: '',
    tags: '',
    file: null,
    coverArt: null
  })
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [tracks, setTracks] = useState([])
  const [editingTrack, setEditingTrack] = useState(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [loading, setLoading] = useState(false)

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
    } else {
      setTracks([])
    }
  }, [user])

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
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadData.file || !uploadData.title || !uploadData.genre) {
      setMessage('Please fill in all required fields and select a file.')
      return
    }

    setUploading(true)
    try {
      // Upload audio file
      const audioUrl = await uploadFile(uploadData.file, 'audio')
      
      // Upload cover art if provided
      let coverArtUrl = null
      if (uploadData.coverArt) {
        coverArtUrl = await uploadFile(uploadData.coverArt, 'images')
      }

      // Insert track data into database
      const trackData = {
        title: uploadData.title,
        url: audioUrl,
        genre: uploadData.genre,
        description: uploadData.description || null,
        tags: uploadData.tags ? uploadData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : null,
        cover_art_url: coverArtUrl
      }

      const { error: insertError } = await supabase
        .from('tracks')
        .insert([trackData])

      if (insertError) throw insertError

      setMessage('Track uploaded successfully!')
      setUploadData({ title: '', genre: '', description: '', tags: '', file: null, coverArt: null })
      setShowUploadForm(false)
      
      // Reset file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]')
      fileInputs.forEach(input => input.value = '')

      // Refresh tracks
      onTrackUploaded()
      loadTracks()
    } catch (error) {
      console.error('Upload error:', error)
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
      coverArt: null
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
          <button type="submit" className="btn btn-primary">
            <LogIn size={16} />
            Login
          </button>
        </form>
      ) : (
        <>
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
