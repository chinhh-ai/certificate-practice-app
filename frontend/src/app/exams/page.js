'use client'
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useToast } from '../../components/Toast'
import NewExamModal from '../../components/NewExamModal'

export default function ExamsPage() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 })
  const [subjects, setSubjects] = useState([])
  const [filters, setFilters] = useState({ status: 'all', subject_id: '', page: 1 })
  const [showModal, setShowModal] = useState(false)
  
  const router = useRouter()
  const toast = useToast()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  const fetchExams = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/exam/list`, { params: filters })
      setData(res.data)
    } catch (err) { console.error(err) }
  }, [filters, API_URL])

  const fetchMeta = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/subjects`)
      setSubjects(res.data)
    } catch (err) { console.error(err) }
  }, [API_URL])

  useEffect(() => { fetchMeta() }, [fetchMeta])
  useEffect(() => { fetchExams() }, [fetchExams])

  const handleDelete = async (id) => {
    if (!confirm("Delete this exam and its results?")) return
    try {
      await axios.delete(`${API_URL}/exam/${id}`)
      toast({ 
        message: "Exam deleted",
        onUndo: async () => {
          await axios.post(`${API_URL}/exam/${id}/restore`)
          fetchExams()
        }
      })
      fetchExams()
    } catch (err) { toast({ message: "Delete failed" }) }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#2ea043'
    if (score >= 60) return '#d29922'
    return '#f85149'
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Exam History</h2>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ New Exam</button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: '#000', borderRadius: '6px', border: '1px solid var(--border-color)', padding: '2px' }}>
          {['all', 'completed', 'in_progress'].map(s => (
            <button 
              key={s}
              onClick={() => setFilters({...filters, status: s, page: 1})}
              style={{
                padding: '0.4rem 1rem', borderRadius: '4px', border: 'none',
                background: filters.status === s ? 'var(--accent-color)' : 'transparent',
                color: filters.status === s ? 'white' : 'var(--text-secondary)',
                fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                textTransform: 'capitalize'
              }}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        <select 
          value={filters.subject_id}
          onChange={e => setFilters({...filters, subject_id: e.target.value, page: 1})}
          style={{ padding: '0.5rem', borderRadius: '6px', background: '#000', border: '1px solid var(--border-color)', color: 'white', minWidth: '180px' }}
        >
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Card Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {data.items.length > 0 ? data.items.map(e => (
          <div key={e.id} className="glass-card exam-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'transform 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ 
                padding: '1px 8px', borderRadius: '12px', background: `${e.subject_color}22`, 
                color: e.subject_color, fontSize: '0.7rem', border: `1px solid ${e.subject_color}44`, fontWeight: '600'
              }}>
                {e.subject_name}
              </span>
              <button 
                onClick={() => handleDelete(e.id)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem' }}
                onMouseEnter={e => e.target.style.color = 'var(--error-color)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
              >
                🗑️
              </button>
            </div>

            <div>
              <h4 style={{ margin: 0 }}>Exam Session</h4>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                {new Date(e.created_at).toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: 'auto' }}>
              <div style={{ 
                width: '60px', height: '60px', borderRadius: '50%', border: `4px solid ${e.is_completed ? getScoreColor(e.score) + '33' : '#30363d'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
              }}>
                {e.is_completed ? (
                  <>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', color: getScoreColor(e.score) }}>{e.score}</div>
                    <div style={{ fontSize: '0.5rem', position: 'absolute', bottom: '8px', color: 'var(--text-secondary)' }}>%</div>
                  </>
                ) : (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center' }}>IN<br/>PROG</div>
                )}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{e.num_questions} Questions</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {e.is_completed ? `Completed ${new Date(e.completed_at).toLocaleDateString()}` : 'Not finished yet'}
                </div>
              </div>

              {e.is_completed ? (
                <button onClick={() => router.push(`/review/${e.id}`)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Review</button>
              ) : (
                <button onClick={() => router.push(`/practice?resume=${e.id}`)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Continue</button>
              )}
            </div>
          </div>
        )) : (
          <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</div>
            <h3 style={{ color: 'var(--text-secondary)' }}>No exams found.</h3>
            <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ marginTop: '1rem' }}>Start your first exam</button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2.5rem', alignItems: 'center' }}>
          <button disabled={filters.page === 1} onClick={() => setFilters({...filters, page: filters.page - 1})} className="btn btn-outline">Prev</button>
          <span style={{ color: 'var(--text-secondary)' }}>{filters.page} / {data.pages}</span>
          <button disabled={filters.page === data.pages} onClick={() => setFilters({...filters, page: filters.page + 1})} className="btn btn-outline">Next</button>
        </div>
      )}

      <style jsx>{`
        .exam-card:hover { transform: translateY(-4px); border-color: var(--accent-color); }
      `}</style>
      <NewExamModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
