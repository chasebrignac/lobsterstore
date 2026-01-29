import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from '@/components/auth/LogoutButton'

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-black">
      <nav className="border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/dashboard" className="text-xl font-bold text-white">
                LobsterLoop
              </Link>
              <div className="flex gap-6">
                <Link
                  href="/dashboard"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/loops"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  My Loops
                </Link>
                <Link
                  href="/discover"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Explore
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <Link
                href="/settings/api-keys"
                className="text-gray-400 hover:text-white transition-colors"
              >
                API Keys
              </Link>
              <span className="text-gray-300 text-sm">
                {session.user?.name || session.user?.email}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  )
}
