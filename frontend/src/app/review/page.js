'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ReviewPage() {
  const [result, setResult] = useState(null)
  const router = useRouter()
  
  useEffect(() => {
    const data = sessionStorage.getItem('last_review')
    if (data) {
      setResult(JSON.parse(data))
    }
  }, [])
  
  if (!result) return <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>No exam results found. Let's start practicing!</div>

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '800px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Exam Completed!</h2>
      
      <div className="stats-grid">
        <div className="stat-box" style={{ borderColor: result.score >= 80 ? 'var(--success-color)' : 'var(--border-color)' }}>
          <div className="stat-value">{result.score}%</div>
          <div className="stat-label">Final Score</div>
        </div>
      </div>
      
      {result.llm_review && (
        <div className="glass-card" style={{ marginTop: '2rem', borderLeft: '4px solid var(--accent-color)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>AI Core Performance Review</h3>
          <div style={{ color: 'var(--text-primary)', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
            {result.llm_review}
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <button className="btn btn-primary" onClick={() => router.push('/')} style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>Return to Dashboard</button>
      </div>
    </div>
  )
}
