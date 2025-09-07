import './globals.css'

export const metadata = {
  title: 'Database Query Interface - VOSF',
  description: 'Secure database query interface for Voice Over Studio Finder',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
