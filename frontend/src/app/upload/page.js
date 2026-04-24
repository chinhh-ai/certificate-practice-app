'use client'
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import SubjectSelector from '../../components/SubjectSelector'
import { useToast } from '../../components/Toast'

export default function UploadPage() {
  const [files, setFiles] = useState([])
  const [uploadFile, setUploadFile] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [uploading, setUploading] = useState(false)
  const [filterSubject, setFilterSubject] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  
  const toast = useToast()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  const fetchFiles = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/content/files`)
      setFiles(res.data)
    } catch (err) {
      console.error(err)
    }
  }, [API_URL])

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    await fetchFiles()
  }

  // Poll for parsing status
  useEffect(() => {
    const isParsing = files.some(f => f.status === 'pending' || f.status === 'parsing')
    if (isParsing) {
      const interval = setInterval(fetchFiles, 3000)
      return () => clearInterval(interval)
    }
  }, [files, fetchFiles])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadFile || !selectedSubject) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', uploadFile)
    formData.append('subject_id', selectedSubject)
    
    try {
      const res = await axios.post(`${API_URL}/content/upload`, formData)
      toast({ message: `Upload started: ${uploadFile.name}` })
      setUploadFile(null)
      fetchFiles()
    } catch (err) {
      toast({ message: `Error: ${err.response?.data?.detail || err.message}` })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (fileId, fileName) => {
    if (!confirm(`Are you sure you want to delete ${fileName}? This will also delete all associated questions.`)) return
    try {
      await axios.delete(`${API_URL}/content/files/${fileId}`)
      toast({ 
        message: `Deleted ${fileName}`, 
        onUndo: async () => {
          await axios.post(`${API_URL}/content/files/${fileId}/restore`)
          fetchFiles()
        }
      })
      fetchFiles()
    } catch (err) {
      toast({ message: "Failed to delete" })
    }
  }

  const filteredFiles = files.filter(f => {
    if (filterSubject && f.subject_id !== filterSubject) return false
    if (filterStatus && f.status !== filterStatus) return false
    return true
  })

  return (
    <div className="animate-fade-in">
      <h2>Document Library</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Manage your source documents and question batches.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Left: Upload */}
        <div>
          <div className="glass-card">
            <h3>Upload New Document</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              PDF, DOCX or JSON. Questions will be automatically extracted.
            </p>
            <form onSubmit={handleUpload}>
              <SubjectSelector selectedId={selectedSubject} onChange={setSelectedSubject} required />
              <div 
                className="upload-area" 
                onClick={() => document.getElementById('filePageUpload').click()}
                style={{ padding: '3rem 1rem' }}
              >
                <div className="upload-icon">📁</div>
                <h4>{uploadFile ? uploadFile.name : 'Select or drop file'}</h4>
                <input id="filePageUpload" type="file" accept=".pdf,.docx,.json" onChange={e => setUploadFile(e.target.files[0])} style={{ display: 'none' }} />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '1.5rem' }} 
                disabled={!uploadFile || !selectedSubject || uploading}
              >
                {uploading ? 'Processing...' : 'Upload & Parse Batch'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Library */}
        <div>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Your Files</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select 
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  style={{ padding: '0.4rem', borderRadius: '4px', background: '#000', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.8rem' }}
                >
                  <option value="">All Status</option>
                  <option value="done">Done</option>
                  <option value="parsing">Parsing</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Filename</th>
                  <th style={{ padding: '0.75rem' }}>Subject</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Questions</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Date</th>
                  <th style={{ padding: '0.75rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.length > 0 ? filteredFiles.map(f => (
                  <tr key={f.id} className="file-row" style={{ borderBottom: '1px solid rgba(48,54,61,0.3)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem 0.75rem', fontWeight: '500' }}>{f.filename}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ 
                        padding: '0.2rem 0.6rem', borderRadius: '12px', background: `${f.subject_color}22`, 
                        color: f.subject_color, fontSize: '0.75rem', border: `1px solid ${f.subject_color}44` 
                      }}>
                        {f.subject_name || 'Uncategorized'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>{f.question_count}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ 
                        padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem',
                        background: f.status === 'done' ? '#2ea04322' : f.status === 'parsing' ? '#58a6ff22' : '#f8514922',
                        color: f.status === 'done' ? '#3fb950' : f.status === 'parsing' ? '#58a6ff' : '#f85149'
                      }}>
                        {f.status}
                        {f.status === 'parsing' && <span className="pulse">...</span>}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {new Date(f.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDelete(f.id, f.filename)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.1rem' }}
                        onMouseEnter={e => e.target.style.color = 'var(--error-color)'}
                        onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No files found. 
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        .file-row:hover { background: rgba(255,255,255,0.02); }
        .pulse { animation: blink 1.5s infinite; }
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
      `}</style>
    </div>
  )
}
