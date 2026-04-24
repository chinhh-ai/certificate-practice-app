'use client'
import { useState, useEffect } from 'react'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, items = [], nuclear = false, confirmPhrase = null, confirmLabel = "Delete" }) {
  const [typed, setTyped] = useState('')
  const [deleteEnabled, setDeleteEnabled] = useState(false)

  // Disable button for 2 seconds on open (standard mode)
  useEffect(() => {
    if (!isOpen) { setTyped(''); setDeleteEnabled(false); return }
    if (!nuclear) {
      const t = setTimeout(() => setDeleteEnabled(true), 2000)
      return () => clearTimeout(t)
    }
  }, [isOpen, nuclear])

  useEffect(() => {
    if (nuclear && confirmPhrase) {
      setDeleteEnabled(typed.trim().toUpperCase() === confirmPhrase.toUpperCase())
    }
  }, [typed, confirmPhrase, nuclear])

  // ESC to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(4px)'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--glass-bg, #1a1a2e)', border: '1px solid var(--border-color, #30363d)',
          borderRadius: '12px', padding: '2rem', width: '100%', maxWidth: '440px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.15s ease'
        }}
      >
        {nuclear && (
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚠️</div>
        )}
        <h3 style={{ marginBottom: '1rem', color: 'white', fontSize: '1.1rem' }}>{title}</h3>

        {items.length > 0 && (
          <div style={{ marginBottom: '1.5rem', color: 'var(--text-secondary, #8b949e)' }}>
            <p style={{ marginBottom: '0.5rem' }}>This will permanently delete:</p>
            <ul style={{ listStyle: 'none', paddingLeft: '0.5rem' }}>
              {items.map((item, i) => (
                <li key={i} style={{ marginBottom: '0.25rem' }}>• {item}</li>
              ))}
            </ul>
          </div>
        )}

        <p style={{ color: 'var(--text-secondary, #8b949e)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          This action cannot be undone.
        </p>

        {nuclear && confirmPhrase && (
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              To confirm, type: <strong style={{ color: 'white' }}>{confirmPhrase}</strong>
            </p>
            <input
              autoFocus
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={confirmPhrase}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '6px',
                background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)',
                color: 'white', fontSize: '0.95rem', boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '0.6rem 1.2rem', borderRadius: '6px', border: '1px solid var(--border-color)',
            background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer'
          }}>
            Cancel
          </button>
          <button
            onClick={() => { if (deleteEnabled) { onConfirm(); onClose(); } }}
            disabled={!deleteEnabled}
            style={{
              padding: '0.6rem 1.4rem', borderRadius: '6px', border: 'none',
              background: deleteEnabled ? 'var(--error-color, #f85149)' : 'rgba(248,81,73,0.3)',
              color: deleteEnabled ? 'white' : 'rgba(255,255,255,0.4)', cursor: deleteEnabled ? 'pointer' : 'not-allowed',
              fontWeight: '600', transition: 'all 0.2s'
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
