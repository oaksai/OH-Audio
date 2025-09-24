import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Upload, LogIn, LogOut, Loader } from 'lucide-react'

const AdminPanel = ({ user, onTrackUploaded }) => {
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [uploadData, setUploadData] = useState({
    title: '',
    genre: '',
    description: '',
    tags: '',
    file: null
  })
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

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

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadData.file || !uploadData.title || !uploadData.genre) {
      setMessage('Please fill in all required fields and select a file.')
      return
    }

    setUploading(true)
    try {
      // Upload file to Supabase Storage
      const fileExt = uploadData.file.name.split('.').pop()
      const fileName = `${Date.now()}-${uploadData.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, uploadData.file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('audio')
        .getPublicUrl(fileName)

      // Insert track data into database
      const trackData = {
        title: uploadData.title,
        url: publicUrl,
        genre: uploadData.genre,
        description: uploadData.description || null,
        tags: uploadData.tags ? uploadData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : null
      }

      const { error: insertError } = await supabase
        .from('tracks')
        .insert([trackData])

      if (insertError) throw insertError

      setMessage('Track uploaded successfully!')
      setUploadData({ title: '', genre: '', description: '', tags: '', file: null })
      
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]')
      if (fileInput) fileInput.value = ''

      // Refresh tracks
      onTrackUploaded()
    } catch (error) {
      console.error('Upload error:', error)
      setMessage(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>Admin Panel</h2>
        {user && (
          <button onClick={handleLogout} className="btn btn-secondary">
            <LogOut size={16} />
            Logout ({user.email})
          </button>
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
        <form onSubmit={handleUpload} className="upload-form">
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
        </form>
      )}
    </div>
  )
}

export default AdminPanel
