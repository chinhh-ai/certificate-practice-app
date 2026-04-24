'use client'
import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ message, onUndo = null, duration = 3000 }) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, onUndo }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration + 500)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{
        position: 'fixed', bottom: '1.5rem', right: '1.5rem',
        display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 2000
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: '#21262d', border: '1px solid #30363d', borderRadius: '8px',
            padding: '0.75rem 1.2rem', color: 'white', display: 'flex', alignItems: 'center',
            gap: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            animation: 'slideIn 0.3s ease'
          }}>
            <span>{t.message}</span>
            {t.onUndo && (
              <button onClick={() => { t.onUndo(); removeToast(t.id) }} style={{
                background: 'none', border: 'none', color: '#58a6ff', cursor: 'pointer',
                fontWeight: '600', fontSize: '0.9rem', padding: 0
              }}>
                Undo
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
