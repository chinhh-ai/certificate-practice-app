'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '../../components/Toast'

function PracticeSession() {
  const [exam, setExam] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [attempts, setAttempts] = useState([])
  const [startTime, setStartTime] = useState(null)
  const fetchRef = useRef(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
  const fetchQuestions = useCallback(async () => {
    if (fetchRef.current) return
    fetchRef.current = true
    
    const resumeId = searchParams.get('resume')
    const num = searchParams.get('n') || 10
    const subjectId = searchParams.get('subject_id')
    
    try {
      if (resumeId) {
        // RESUME mode
        const res = await axios.get(`${API_URL}/practice/exam/${resumeId}`)
        setQuestions(res.data.questions)
        setExam(res.data.exam)
        
        if (res.data.attempts && res.data.attempts.length > 0) {
          setAttempts(res.data.attempts)
          // Find first unanswered
          const answeredIds = res.data.attempts.map(a => a.question_id)
          const firstUnansweredIndex = res.data.questions.findIndex(q => !answeredIds.includes(q.id))
          if (firstUnansweredIndex !== -1) {
            setCurrentIndex(firstUnansweredIndex)
          } else {
            // All answered, go to last
            setCurrentIndex(res.data.questions.length - 1)
          }
        }
      } else {
        // GENERATE mode
        let url = `${API_URL}/practice/generate-exam?num_questions=${num}`
        if (subjectId) url += `&subject_id=${subjectId}`
        
        const res = await axios.post(url)
        if (res.data.questions && res.data.questions.length > 0) {
          setQuestions(res.data.questions)
          setExam(res.data.exam)
        }
      }
    } catch (err) {
      console.error('Failed to generate exam', err)
    } finally {
      setLoading(false)
      setStartTime(Date.now())
      fetchRef.current = false
    }
  }, [searchParams, API_URL])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isSubmitted && e.key === 'Enter') {
        handleNext()
        return
      }
      
      if (!isSubmitted) {
        const key = e.key.toUpperCase()
        if (['A', 'B', 'C', 'D'].includes(key)) {
          const q = questions[currentIndex]
          if (q && q.options) {
            const opt = q.options.find(o => o.trim().startsWith(key))
            if (opt) setSelectedAnswer(opt)
          }
        } else if (e.key === 'Enter' && selectedAnswer) {
          handleSubmit()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, selectedAnswer, isSubmitted, questions])

  const handleSubmit = () => {
    if (!selectedAnswer) return
    setIsSubmitted(true)
    
    const timeSpent = Math.floor((Date.now() - (startTime || Date.now())) / 1000)
    const q = questions[currentIndex]
    
    // Extract letter safely (A, B, C, D)
    const letterMatch = selectedAnswer.trim().match(/^([A-D])[\.\)]/)
    const selectedLetter = letterMatch ? letterMatch[1] : selectedAnswer.trim().charAt(0).toUpperCase()

    setAttempts(prev => [...prev, {
      question_id: q.id,
      selected_answer: selectedLetter,
      time_spent_sec: timeSpent
    }])
  }

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setIsSubmitted(false)
      setStartTime(Date.now())
    } else {
      setSubmitting(true)
      try {
        const res = await axios.post(`${API_URL}/practice/submit-exam`, {
          exam_id: exam.id,
          attempts: attempts
        })
        // Redirect to specific review page
        router.push(`/review/${exam.id}`)
      } catch (err) {
        console.error("Failed to submit exam", err)
        setSubmitting(false)
        toast({ message: "Submission failed. Your results might not be saved." })
      }
    }
  }

  if (loading) return (
    <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
      <div className="pulse" style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧩</div>
      <h2>Generating Your Personalized Exam...</h2>
    </div>
  )
  
  if (submitting) return (
    <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
      <div className="pulse" style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧠</div>
      <h2>Analyzing Results & Generating Feedback...</h2>
    </div>
  )
  
  if (questions.length === 0) return (
    <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h2>No Questions Available</h2>
      <p style={{ margin: '1rem 0', color: 'var(--text-secondary)' }}>Please upload study material for this subject first.</p>
      <button className="btn btn-primary" onClick={() => router.push('/')}>Go to Dashboard</button>
    </div>
  )

  const q = questions[currentIndex]
  const progressPercent = ((currentIndex) / questions.length) * 100
  
  // Extract correct letter from q.answer
  const correctLetter = q.answer.trim().match(/^([A-D])/)?.[1] || q.answer.trim().charAt(0).toUpperCase()

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '800px', paddingBottom: '4rem' }}>
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Question {currentIndex + 1} of {questions.length}</span>
        <span style={{ 
          background: 'rgba(88,166,255,0.1)', color: 'var(--accent-color)', 
          padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600'
        }}>{q.topic || 'General Knowledge'}</span>
      </div>

      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', lineHeight: '1.6', marginBottom: '2.5rem', whiteSpace: 'pre-line', color: 'var(--text-primary)' }}>
          {q.content}
        </h3>

        <div className="options-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {q.options.map((opt, i) => {
            const letterMatch = opt.trim().match(/^([A-D])[\.\)]/)
            const letter = letterMatch ? letterMatch[1] : String.fromCharCode(65 + i)
            
            let statusClass = ""
            if (selectedAnswer === opt) statusClass = "selected"
            
            if (isSubmitted) {
              const isOptionCorrect = letter === correctLetter
              const isOptionSelected = selectedAnswer === opt
              
              if (isOptionCorrect) statusClass = "correct"
              else if (isOptionSelected && !isOptionCorrect) statusClass = "incorrect"
            }

            return (
              <div 
                key={i} 
                className={`option ${statusClass}`} 
                onClick={() => !isSubmitted && setSelectedAnswer(opt)}
                style={{
                  padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                  cursor: isSubmitted ? 'default' : 'pointer', display: 'flex', gap: '1rem',
                  alignItems: 'center', transition: 'all 0.2s', background: 'rgba(255,255,255,0.02)'
                }}
              >
                <div style={{ 
                  width: '28px', height: '28px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '700',
                  background: 'rgba(0,0,0,0.2)'
                }} className="opt-letter">
                  {letter}
                </div>
                <div style={{ fontSize: '0.95rem' }}>{opt.replace(/^[A-D][\.\)]\s*/, '')}</div>
              </div>
            )
          })}
        </div>

        {isSubmitted && q.explanation && (
          <div style={{ 
            marginTop: '2.5rem', padding: '1.5rem', background: 'rgba(88, 166, 255, 0.03)', 
            borderRadius: '8px', borderLeft: '4px solid var(--accent-color)', border: '1px solid rgba(88,166,255,0.1)' 
          }}>
            <h4 style={{ marginBottom: '0.75rem', color: 'var(--accent-color)', fontSize: '0.9rem', textTransform: 'uppercase' }}>💡 Explanation</h4>
            <div style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '1rem' }}>{q.explanation}</div>
          </div>
        )}

        <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          {!isSubmitted ? (
            <button 
              className="btn btn-primary" 
              onClick={handleSubmit} 
              disabled={!selectedAnswer}
              style={{ padding: '0.75rem 2rem' }}
            >
              Submit Answer
            </button>
          ) : (
            <button 
              className="btn btn-primary" 
              onClick={handleNext}
              autoFocus
              style={{ padding: '0.75rem 2rem' }}
            >
              {currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
            </button>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .option:hover:not(.selected):not(.correct):not(.incorrect) { background: rgba(255,255,255,0.05) !important; border-color: var(--accent-color) !important; }
        .selected { border-color: var(--accent-color) !important; background: rgba(88,166,255,0.05) !important; }
        .correct { border-color: #2ea043 !important; background: rgba(46,160,67,0.1) !important; }
        .incorrect { border-color: #f85149 !important; background: rgba(248,81,73,0.1) !important; }
        .correct .opt-letter { background: #2ea043 !important; color: white; border-color: #2ea043; }
        .incorrect .opt-letter { background: #f85149 !important; color: white; border-color: #f85149; }
        .selected .opt-letter { background: var(--accent-color) !important; color: white; border-color: var(--accent-color); }
        .pulse { animation: blink 1.5s infinite; }
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
      `}</style>
    </div>
  )
}

export default function PracticePage() {
  return (
    <React.Suspense fallback={<div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>Loading Practice Configuration...</div>}>
      <PracticeSession />
    </React.Suspense>
  )
}
