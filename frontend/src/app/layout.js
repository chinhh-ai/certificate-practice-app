import './globals.css'
import AppShell from '../components/AppShell'

export const metadata = {
  title: 'Certificate Practice App',
  description: 'A premium certification practice platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  )
}
