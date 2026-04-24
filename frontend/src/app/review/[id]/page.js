'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ReviewPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const router = useRouter()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const res = await axios.get(`${API_URL}/review/${id}`)
        setData(res.data)
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load review")
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchReview()
  }, [id, API_URL])

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}><h2>Analyzing results...</h2><div className="pulse" style={{ fontSize: '3rem' }}>🧠</div></div>
  if (error) return <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}><h3>Error</h3><p>{error}</p><button onClick={() => router.push('/')} className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Dashboard</button></div>

  const getScoreColor = (score) => {
    if (score >= 80) return '#2ea043'
    if (score >= 60) return '#d29922'
    return '#f85149'
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <Link href="/exams" style={{ display: 'inline-block', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>← Back to History</Link>

      {/* Row 1: Score & AI Review */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ 
            width: '120px', height: '120px', borderRadius: '50%', margin: '0 auto 1.5rem',
            border: `8px solid ${getScoreColor(data.score)}22`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: getScoreColor(data.score) }}>{data.score}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>percent</div>
          </div>
          <h3>{data.correct_count} / {data.num_questions} Correct</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Completed on {new Date(data.completed_at).toLocaleString()}</p>
          <button onClick={() => router.push('/practice')} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Practice More</button>
        </div>

        <div className="glass-card" style={{ borderLeft: `4px solid ${getScoreColor(data.score)}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🤖</span>
            <h3 style={{ margin: 0 }}>AI Performance Analysis</h3>
          </div>
          <div style={{ 
            color: 'var(--text-primary)', lineHeight: '1.6', fontSize: '1.05rem', 
            background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '8px' 
          }}>
            {data.llm_review ? (
              <div dangerouslySetInnerHTML={{ __html: data.llm_review.replace(/\n/g, '<br/>') }} />
            ) : (
              "AI analysis is not available for this session."
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Question List */}
      <h3 style={{ marginBottom: '1.5rem' }}>Detailed Question Review</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {data.questions.map((q, idx) => (
          <div 
            key={q.id} 
            className="glass-card" 
            style={{ 
              padding: '1.5rem', 
              borderLeft: `4px solid ${q.is_correct ? '#2ea043' : '#f85149'}`,
              background: q.is_correct ? 'rgba(46,160,67,0.02)' : 'rgba(248,81,73,0.02)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>#{idx + 1}</span>
              <span style={{ 
                fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px',
                background: q.is_correct ? '#2ea04322' : '#f8514922',
                color: q.is_correct ? '#3fb950' : '#f85149',
                border: `1px solid ${q.is_correct ? '#2ea04333' : '#f8514933'}`
              }}>
                {q.is_correct ? 'CORRECT' : 'INCORRECT'}
              </span>
            </div>

            <div style={{ fontSize: '1.1rem', fontWeight: '500', marginBottom: '1.2rem' }}>{q.content}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.2rem' }}>
              {q.options.map(opt => {
                const optKey = opt.trim().split('.')[0]
                const isSelected = q.selected_answer === optKey
                const isCorrect = q.correct_answer === optKey
                
                let borderColor = 'var(--border-color)'
                let bg = 'transparent'
                if (isCorrect) { borderColor = '#2ea043'; bg = '#2ea04311' }
                if (isSelected && !isCorrect) { borderColor = '#f85149'; bg = '#f8514911' }

                return (
                  <div 
                    key={opt}
                    style={{ 
                      padding: '0.8rem', borderRadius: '6px', border: `1px solid ${borderColor}`,
                      background: bg, fontSize: '0.9rem', position: 'relative'
                    }}
                  >
                    {opt}
                    {isSelected && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem' }}>{isCorrect ? '✅' : '❌'}</span>}
                  </div>
                )
              })}
            </div>

            {q.explanation && (
              <div style={{ 
                marginTop: '1rem', padding: '1rem', borderRadius: '6px', 
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--accent-color)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>💡 Explanation</span>
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {q.explanation}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .pulse { animation: blink 1.5s infinite; }
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
      `}</style>
    </div>
  )
}
