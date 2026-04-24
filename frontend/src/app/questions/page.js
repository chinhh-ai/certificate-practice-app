'use client'
import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useToast } from '../../components/Toast'

export default function QuestionsPage() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 })
  const [subjects, setSubjects] = useState([])
  const [files, setFiles] = useState([])
  
  const [filters, setFilters] = useState({ 
    subject_id: '', difficulty: '', file_id: '', search: '', page: 1 
  })
  
  const [selectedIds, setSelectedIds] = useState([])
  const [editingQ, setEditingQ] = useState(null)
  
  const toast = useToast()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

  const fetchQuestions = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/content/questions`, { params: filters })
      setData(res.data)
    } catch (err) { console.error(err) }
  }, [filters, API_URL])

  const fetchMeta = useCallback(async () => {
    try {
      const [s, f] = await Promise.all([
        axios.get(`${API_URL}/subjects`),
        axios.get(`${API_URL}/content/files`)
      ])
      setSubjects(s.data)
      setFiles(f.data)
    } catch (err) { console.error(err) }
  }, [API_URL])

  useEffect(() => { fetchMeta() }, [fetchMeta])
  useEffect(() => { fetchQuestions() }, [fetchQuestions])

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} questions?`)) return
    try {
      await axios.delete(`${API_URL}/content/questions/bulk`, { data: { ids: selectedIds } })
      toast({ message: `Deleted ${selectedIds.length} questions` })
      setSelectedIds([])
      fetchQuestions()
    } catch (err) { toast({ message: "Bulk delete failed" }) }
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    try {
      await axios.put(`${API_URL}/content/questions/${editingQ.id}`, editingQ)
      toast({ message: "Question updated" })
      setEditingQ(null)
      fetchQuestions()
    } catch (err) { toast({ message: "Update failed" }) }
  }

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2rem' }}>
      {/* Sidebar Filters */}
      <div>
        <div className="glass-card" style={{ padding: '1.2rem', position: 'sticky', top: '100px' }}>
          <h4 style={{ marginBottom: '1.2rem' }}>Filters</h4>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Subject</label>
            <select 
              value={filters.subject_id} 
              onChange={e => setFilters({...filters, subject_id: e.target.value, page: 1})}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: '#000', border: '1px solid var(--border-color)', color: 'white' }}
            >
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Difficulty</label>
            <select 
              value={filters.difficulty} 
              onChange={e => setFilters({...filters, difficulty: e.target.value, page: 1})}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: '#000', border: '1px solid var(--border-color)', color: 'white' }}
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Source File</label>
            <select 
              value={filters.file_id} 
              onChange={e => setFilters({...filters, file_id: e.target.value, page: 1})}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', background: '#000', border: '1px solid var(--border-color)', color: 'white' }}
            >
              <option value="">All Files</option>
              {files.map(f => <option key={f.id} value={f.id}>{f.filename}</option>)}
            </select>
          </div>

          <button 
            className="btn btn-outline" 
            style={{ width: '100%', fontSize: '0.85rem' }}
            onClick={() => setFilters({ subject_id: '', difficulty: '', file_id: '', search: '', page: 1 })}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="glass-card" style={{ padding: '0' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>🔍</span>
            <input 
              placeholder="Search question content..."
              value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value, page: 1})}
              style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', borderRadius: '6px', background: '#000', border: '1px solid var(--border-color)', color: 'white' }}
            />
          </div>
          <div>
            {selectedIds.length > 0 && (
              <button onClick={handleBulkDelete} className="btn" style={{ background: '#f85149', color: 'white', fontSize: '0.85rem' }}>
                Delete Selected ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>
                <input type="checkbox" onChange={e => setSelectedIds(e.target.checked ? data.items.map(i => i.id) : [])} checked={selectedIds.length === data.items.length && data.items.length > 0} />
              </th>
              <th style={{ padding: '0.75rem' }}>Question</th>
              <th style={{ padding: '0.75rem' }}>Options</th>
              <th style={{ padding: '0.75rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map(q => (
              <tr key={q.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem 0.75rem' }}>
                  <input type="checkbox" checked={selectedIds.includes(q.id)} onChange={() => setSelectedIds(p => p.includes(q.id) ? p.filter(id => id !== q.id) : [...p, q.id])} />
                </td>
                <td style={{ padding: '1rem 0.75rem', maxWidth: '400px' }}>
                  <div style={{ fontWeight: '500', marginBottom: '0.4rem' }}>{q.content}</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#58a6ff', background: '#58a6ff1a', padding: '1px 6px', borderRadius: '10px', border: '1px solid #58a6ff33' }}>
                      {q.difficulty || 'medium'}
                    </span>
                    {q.explanation && <span style={{ fontSize: '0.7rem', color: '#2ea043', background: '#2ea0431a', padding: '1px 6px', borderRadius: '10px', border: '1px solid #2ea04333' }}>💡 Explained</span>}
                  </div>
                </td>
                <td style={{ padding: '1rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  {q.options.length} options
                </td>
                <td style={{ padding: '1rem 0.75rem' }}>
                  <button onClick={() => setEditingQ(q)} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
          <button disabled={filters.page === 1} onClick={() => setFilters({...filters, page: filters.page - 1})} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }}>Prev</button>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Page {filters.page} of {data.pages}</span>
          <button disabled={filters.page === data.pages} onClick={() => setFilters({...filters, page: filters.page + 1})} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem' }}>Next</button>
        </div>
      </div>

      {/* Edit Modal */}
      {editingQ && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3>Edit Question</h3>
            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Question Content</label>
                <textarea 
                  value={editingQ.content} 
                  onChange={e => setEditingQ({...editingQ, content: e.target.value})}
                  style={{ width: '100%', height: '80px', padding: '0.5rem', background: '#000', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Options (one per line, start with A., B., etc)</label>
                <textarea 
                  value={editingQ.options.join('\n')} 
                  onChange={e => setEditingQ({...editingQ, options: e.target.value.split('\n')})}
                  style={{ width: '100%', height: '100px', padding: '0.5rem', background: '#000', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Answer (A/B/C/D)</label>
                  <input 
                    value={editingQ.answer} 
                    onChange={e => setEditingQ({...editingQ, answer: e.target.value})}
                    style={{ width: '100%', padding: '0.5rem', background: '#000', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Difficulty</label>
                  <select 
                    value={editingQ.difficulty} 
                    onChange={e => setEditingQ({...editingQ, difficulty: e.target.value})}
                    style={{ width: '100%', padding: '0.5rem', background: '#000', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Explanation</label>
                <textarea 
                  value={editingQ.explanation || ''} 
                  onChange={e => setEditingQ({...editingQ, explanation: e.target.value})}
                  style={{ width: '100%', height: '60px', padding: '0.5rem', background: '#000', border: '1px solid var(--border-color)', color: 'white', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditingQ(null)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
