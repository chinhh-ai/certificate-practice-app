'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell 
} from 'recharts'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import SubjectSelector from '../components/SubjectSelector'
import NewExamModal from '../components/NewExamModal'

export default function Dashboard() {
  const [summary, setSummary] = useState({ 
    total_exams_created: 0, total_exams_completed: 0, average_score: 0, 
    streak_days: 0, total_questions_answered: 0, total_files_uploaded: 0,
    weak_topics: [] 
  })
  const [scoreHistory, setScoreHistory] = useState([])
  const [subjectBreakdown, setSubjectBreakdown] = useState([])
  const [activity, setActivity] = useState([])
  const [dataStats, setDataStats] = useState({ total_files: 0, total_questions: 0, total_exams_created: 0, total_exams_completed: 0 })
  
  const [uploadFile, setUploadFile] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [uploading, setUploading] = useState(false)
  const [numQuestions, setNumQuestions] = useState(10)
  const [dialog, setDialog] = useState({ open: false })
  const [showExamModal, setShowExamModal] = useState(false)
  
  const router = useRouter()
  const toast = useToast()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  const fetchData = useCallback(async () => {
    try {
      const [s1, s2, s3, s4, s5] = await Promise.all([
        axios.get(`${API_URL}/analytics/summary`),
        axios.get(`${API_URL}/analytics/score-history`),
        axios.get(`${API_URL}/analytics/by-subject`),
        axios.get(`${API_URL}/analytics/activity`),
        axios.get(`${API_URL}/user/data/stats`)
      ])
      setSummary(s1.data)
      setScoreHistory(s2.data)
      setSubjectBreakdown(s3.data)
      setActivity(s4.data)
      setDataStats(s5.data)
    } catch (err) {
      console.error("Failed to fetch dashboard data", err)
    }
  }, [API_URL])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadFile || !selectedSubject) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', uploadFile)
    formData.append('subject_id', selectedSubject)
    
    try {
      const res = await axios.post(`${API_URL}/content/upload`, formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      })
      toast({ message: `Success! Imported ${res.data.imported} questions.` })
      fetchData()
      setUploadFile(null)
    } catch (err) {
      toast({ message: `Error: ${err.response?.data?.detail || err.message}` })
    } finally {
      setUploading(false)
    }
  }

  const handleNuclear = async (action, phrase) => {
    setDialog({
      open: true, nuclear: true, confirmPhrase: phrase,
      title: `⚠️ ${action.label}?`,
      items: action.items,
      confirmLabel: 'Confirm Delete',
      onConfirm: async () => {
        try {
          const tokenRes = await axios.post(`${API_URL}/user/data/reset-token`)
          const token = tokenRes.data.token
          await axios.delete(`${API_URL}${action.endpoint}`, { data: { confirmation_token: token } })
          toast({ message: `${action.label} — completed.` })
          fetchData()
        } catch (err) {
          toast({ message: `Error: ${err.response?.data?.detail || err.message}` })
        }
      }
    })
  }

  const openDeleteAll = (type) => {
    const actions = {
      exams: {
        label: 'Delete all exam history',
        endpoint: '/user/data/exams',
        phrase: 'DELETE MY EXAMS',
        items: [`${dataStats.total_exams_created} exams`, `${dataStats.total_exams_completed} results`]
      },
      questions: {
        label: 'Delete all questions & documents',
        endpoint: '/user/data/questions',
        phrase: 'DELETE MY QUESTIONS',
        items: [`${dataStats.total_files} files`, `${dataStats.total_questions} questions`]
      },
      all: {
        label: 'Reset all my data',
        endpoint: '/user/data/all',
        phrase: 'RESET ALL MY DATA',
        items: ['Everything']
      }
    }
    handleNuclear(actions[type], actions[type].phrase)
  }

  // Heatmap rendering
  const heatmapData = useMemo(() => {
    const data = {}
    activity.forEach(a => { data[a.date] = a.count })
    return data
  }, [activity])

  const last7Days = useMemo(() => {
    return [...Array(7)].map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return d.toISOString().split('T')[0]
    }).reverse()
  }, [])

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Welcome back, Master</h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <button onClick={() => setShowExamModal(true)} className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}>
          🚀 Start New Exam
        </button>
      </div>

      {/* Row 1: Stat Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-box">
          <div className="stat-value">{summary.total_exams_completed}</div>
          <div className="stat-label">Exams Completed</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{summary.average_score}%</div>
          <div className="stat-label">Average Score</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{summary.total_questions_answered}</div>
          <div className="stat-label">Questions Answered</div>
        </div>
        <div className="stat-box">
          <div className="stat-value" style={{ color: '#ff9a00' }}>🔥 {summary.streak_days}</div>
          <div className="stat-label">Study Streak</div>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="glass-card" style={{ height: '400px' }}>
          <h4 style={{ marginBottom: '1.5rem' }}>Score Timeline</h4>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={scoreHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
              <XAxis 
                dataKey="completed_at" 
                tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                stroke="#8b949e" fontSize={12}
              />
              <YAxis domain={[0, 100]} stroke="#8b949e" fontSize={12} />
              <Tooltip 
                contentStyle={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px' }}
                labelFormatter={(label) => new Date(label).toLocaleString()}
              />
              <Line 
                type="monotone" dataKey="score" stroke="#58a6ff" strokeWidth={3} 
                dot={{ r: 4, fill: '#58a6ff' }} activeDot={{ r: 6 }}
              />

            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card" style={{ height: '400px' }}>
          <h4 style={{ marginBottom: '1.5rem' }}>Subject Breakdown</h4>
          <ResponsiveContainer width="100%" height="70%">
            <PieChart>
              <Pie
                data={subjectBreakdown}
                dataKey="total_attempted"
                nameKey="subject_name"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
              >
                {subjectBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: '1rem', overflowY: 'auto', maxHeight: '100px' }}>
            {subjectBreakdown.map(s => (
              <div key={s.subject_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color }}></div>
                  {s.subject_name}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>{s.accuracy}% accuracy</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Activity Heatmap (Simplified for now) */}
      <div className="glass-card" style={{ marginTop: '1.5rem' }}>
        <h4 style={{ marginBottom: '1rem' }}>Activity History</h4>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {/* Real implementation would use a proper react-calendar-heatmap, 
              but we build a custom 52-week grid skeleton for visual impact */}
          {[...Array(52)].map((_, weekIndex) => (
            <div key={weekIndex} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[...Array(7)].map((_, dayIndex) => {
                const dayOffset = (51 - weekIndex) * 7 + (6 - dayIndex)
                const date = new Date()
                date.setDate(date.getDate() - dayOffset)
                const dateString = date.toISOString().split('T')[0]
                const count = heatmapData[dateString] || 0
                const intensity = count === 0 ? 0 : count < 5 ? 1 : count < 15 ? 2 : count < 30 ? 3 : 4
                const colors = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']
                
                return (
                  <div 
                    key={dayIndex} 
                    title={`${dateString}: ${count} questions`}
                    style={{ 
                      width: '12px', height: '12px', borderRadius: '2px', 
                      background: colors[intensity], transition: 'all 0.2s' 
                    }}
                  ></div>
                )
              })}
            </div>
          ))}
        </div>
        <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span>Less</span>
          <div style={{ display: 'flex', gap: '3px' }}>
            {['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'].map(c => <div key={c} style={{ width: '10px', height: '10px', background: c, borderRadius: '2px' }}></div>)}
          </div>
          <span>More</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Row 4 Left: Upload Widget */}
        <div className="glass-card">
          <h3>Upload Study Material</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Quickly add new practice material.</p>
          <form onSubmit={handleUpload}>
            <SubjectSelector selectedId={selectedSubject} onChange={setSelectedSubject} required />
            <div 
              className="upload-area" 
              onClick={() => document.getElementById('fileUpload').click()}
              style={{ padding: '2rem 1rem' }}
            >
              <div className="upload-icon" style={{ fontSize: '2rem' }}>📄</div>
              <h4 style={{ fontSize: '0.9rem' }}>{uploadFile ? uploadFile.name : 'Click to select file'}</h4>
              <input id="fileUpload" type="file" accept=".pdf,.docx,.json" onChange={e => setUploadFile(e.target.files[0])} style={{ display: 'none' }} />
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link href="/upload" style={{ fontSize: '0.9rem' }}>View all files →</Link>
              <button type="submit" className="btn btn-primary" disabled={!uploadFile || !selectedSubject || uploading}>
                {uploading ? 'Processing...' : 'Upload & Parse'}
              </button>
            </div>
          </form>
        </div>

        {/* Row 4 Right: Data & Danger */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>🗂 Data Management</h3>
            <Link href="/exams" style={{ fontSize: '0.9rem' }}>Review History →</Link>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Library</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>{dataStats.total_questions} Questions</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>from {dataStats.total_files} files</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border-color)' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Performance</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>{dataStats.total_exams_completed} Exams</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>completed total</div>
            </div>
          </div>

          <div style={{ border: '1px solid rgba(248,81,73,0.3)', borderRadius: '8px', padding: '1rem', background: 'rgba(248,81,73,0.02)' }}>
            <div style={{ color: '#f85149', fontWeight: '600', marginBottom: '0.75rem', fontSize: '0.9rem' }}>⚠️ Danger Zone</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button onClick={() => openDeleteAll('exams')} className="btn btn-outline" style={{ fontSize: '0.75rem', borderColor: 'rgba(248,81,73,0.4)', color: '#f85149' }}>Delete Exams</button>
              <button onClick={() => openDeleteAll('questions')} className="btn btn-outline" style={{ fontSize: '0.75rem', borderColor: 'rgba(248,81,73,0.4)', color: '#f85149' }}>Delete Content</button>
              <button onClick={() => openDeleteAll('all')} className="btn btn-outline" style={{ fontSize: '0.75rem', borderColor: '#f85149', background: 'rgba(248,81,73,0.1)', color: '#f85149' }}>Full Reset</button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={dialog.open}
        onClose={() => setDialog({ open: false })}
        onConfirm={dialog.onConfirm}
        title={dialog.title}
        items={dialog.items || []}
        nuclear={dialog.nuclear}
        confirmPhrase={dialog.confirmPhrase}
        confirmLabel={dialog.confirmLabel}
      />
      <NewExamModal isOpen={showExamModal} onClose={() => setShowExamModal(false)} />
    </div>
  )
}
