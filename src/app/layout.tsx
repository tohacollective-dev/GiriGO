import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title:       'GiriGo Courier',
  description: 'WhatsApp-First Hyperlocal Courier Platform — Gerung, Lombok Barat',
  manifest:    '/manifest.json',
  icons:       { icon: '/icon.png', apple: '/apple-icon.png' },
}

export const viewport: Viewport = {
  themeColor: '#0F172A',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="font-sans bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
