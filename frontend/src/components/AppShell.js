'use client'
import { ToastProvider } from './Toast'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import NewExamModal from './NewExamModal'

export default function AppShell({ children }) {
  const pathname = usePathname()
  const [showModal, setShowModal] = useState(false)

  const navItems = [
    { name: 'Dashboard', href: '/' },
    { name: 'Upload', href: '/upload' },
    { name: 'Questions', href: '/questions' },
    { name: 'Exams', href: '/exams' },
  ]

  return (
    <ToastProvider>
      <header className="header">
        <div className="logo">CertiMaster</div>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {navItems.map(item => (
            <Link 
              key={item.href} 
              href={item.href}
              className={`btn ${pathname === item.href ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
            >
              {item.name}
            </Link>
          ))}
          <div style={{ marginLeft: '1rem', borderLeft: '1px solid var(--border-color)', height: '24px' }}></div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ marginLeft: '1rem' }}>
            Quick Practice
          </button>
        </nav>
      </header>
      <main className="container">
        {children}
      </main>
      <NewExamModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </ToastProvider>
  )
}
