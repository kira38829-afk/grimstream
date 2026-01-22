// app/layout.js - UPDATED
import './globals.css'
import APIStatus from '../components/APIStatus'

export const metadata = {
  title: 'GrimStream - Watch Anime Online',
  description: 'Watch your favorite anime series online for free',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#0f0f0f] text-white min-h-screen">
        {process.env.NODE_ENV === 'development' && <APIStatus />}
        {children}
      </body>
    </html>
  )
}