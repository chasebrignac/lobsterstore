import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LobsterLoop - Ralph Workflow Platform',
  description: 'Create, publish, and execute Ralph loops (autonomous AI agent workflows)',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
