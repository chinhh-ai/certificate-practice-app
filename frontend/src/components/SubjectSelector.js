'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useToast } from './Toast'

const PRESET_COLORS = ['#4F86C6', '#2ea043', '#f85149', '#a371f7', '#d29922', '#7C8394', '#3fb950', '#58a6ff']

export default function SubjectSelector({ selectedId, onChange, required = false }) {
  const [subjects, setSubjects] = useState([])
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [loading, setLoading] = useState(false)
  
  const toast = useToast()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/subjects`)
      setSubjects(res.data)
    } catch (err) {
      console.error("Failed to fetch subjects", err)
    }
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setLoading(true)
    try {
      const res = await axios.post(`${API_URL}/subjects`, { name: newName, color: newColor })
      setSubjects([...subjects, res.data])
      onChange(res.data.id)
      setIsAdding(false)
      setNewName('')
    } catch (err) {
      toast({ message: "Error creating subject" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Subject {required && <span style={{ color: 'var(--error-color)' }}>*</span>}
      </label>
      
      {!isAdding ? (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select 
            value={selectedId || ''} 
            onChange={(e) => onChange(e.target.value)}
            style={{
              flex: 1, padding: '0.6rem', borderRadius: '6px',
              background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)',
              color: 'white', fontSize: '0.95rem'
            }}
          >
            <option value="">-- Select Subject --</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button 
            type="button"
            onClick={() => setIsAdding(true)}
            style={{
              padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--accent-color)',
              background: 'transparent', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.9rem'
            }}
          >
            + New
          </button>
        </div>
      ) : (
        <div style={{ 
          background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)'
        }}>
          <input 
            autoFocus
            placeholder="Subject Name (e.g. AWS Cloud Practitioner)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            style={{
              width: '100%', padding: '0.6rem', borderRadius: '6px', marginBottom: '0.75rem',
              background: '#000', border: '1px solid var(--border-color)', color: 'white'
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {PRESET_COLORS.map(c => (
              <div 
                key={c}
                onClick={() => setNewColor(c)}
                style={{
                  width: '24px', height: '24px', borderRadius: '50%', background: c,
                  cursor: 'pointer', border: newColor === c ? '2px solid white' : 'none',
                  boxShadow: newColor === c ? '0 0 8px rgba(255,255,255,0.5)' : 'none'
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setIsAdding(false)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Cancel</button>
            <button type="button" onClick={handleCreate} disabled={loading || !newName.trim()} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
