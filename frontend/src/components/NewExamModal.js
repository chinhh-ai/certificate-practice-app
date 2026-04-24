'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'

export default function NewExamModal({ isOpen, onClose }) {
  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [numQuestions, setNumQuestions] = useState(10)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  useEffect(() => {
    if (isOpen) {
      axios.get(`${API_URL}/subjects`).then(res => setSubjects(res.data)).catch(err => console.error(err))
    }
  }, [isOpen, API_URL])

  // Update default num questions based on subject name (as per user's example)
  useEffect(() => {
    const subj = subjects.find(s => s.id === selectedSubject)
    if (subj) {
      const name = subj.name.toLowerCase()
      const isMath = name.includes('toán') || name.includes('toan')
      const isLit = name.includes('văn') || name.includes('van')
      
      if (isMath) setNumQuestions(30)
      else if (isLit) setNumQuestions(5)
      else setNumQuestions(10)
    } else {
      setNumQuestions(10)
    }
  }, [selectedSubject, subjects])

  if (!isOpen) return null

  const handleStart = () => {
    router.push(`/practice?n=${numQuestions}${selectedSubject ? `&subject_id=${selectedSubject}` : ''}`)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
    }}>
      <div className="glass-card" style={{ width: '400px', padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Create New Exam</h3>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Choose Subject
          </label>
          <select 
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            style={{
              width: '100%', padding: '0.6rem', borderRadius: '6px',
              background: '#000', border: '1px solid var(--border-color)', color: 'white'
            }}
          >
            <option value="">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Number of Questions
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input 
              type="range" min="5" max="100" step="5"
              value={numQuestions}
              onChange={e => setNumQuestions(e.target.value)}
              style={{ flex: 1, accentColor: 'var(--accent-color)' }}
            />
            <div style={{ 
              width: '50px', textAlign: 'center', fontWeight: '700', 
              fontSize: '1.1rem', color: 'var(--accent-color)' 
            }}>
              {numQuestions}
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Recommended: 10-20 for quick review, 50-100 for full simulation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
          <button onClick={handleStart} className="btn btn-primary" style={{ flex: 1 }}>Start Practice</button>
        </div>
      </div>
    </div>
  )
}
