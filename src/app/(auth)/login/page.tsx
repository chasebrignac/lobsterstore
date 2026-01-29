'use client'

import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useState } from 'react'

export default function LoginPage() {
  const allowTest = process.env.NEXT_PUBLIC_ALLOW_TEST_LOGIN === 'true'
  const [testEmail, setTestEmail] = useState(
    process.env.NEXT_PUBLIC_TEST_USER_EMAIL || ''
  )
  const [testPassword, setTestPassword] = useState('')

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            LobsterLoop
          </Link>
        </div>
      </header>

      {/* Sign in content */}
      <div className="flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome to LobsterLoop
            </h1>
            <p className="text-gray-400 mb-8">
              Run autonomous AI coding workflows
            </p>
          </div>

          <button
            onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-black rounded-md hover:bg-gray-100 transition-colors font-semibold text-base"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                clipRule="evenodd"
              />
            </svg>
            Sign in with GitHub
          </button>

          {allowTest && (
            <div className="mt-6 border border-gray-800 rounded-lg p-4 text-left bg-gray-900 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Test Email
                </label>
                <input
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="test@example.com"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Test Password
                </label>
                <input
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded px-3 py-2 text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter test password"
                />
              </div>
              <button
                onClick={() =>
                  signIn('credentials', {
                    email: testEmail,
                    password: testPassword,
                    callbackUrl: '/dashboard',
                  })
                }
                className="w-full px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-white transition-colors font-semibold text-sm"
              >
                Sign in with Test Account
              </button>
              <p className="text-xs text-gray-500">
                Set env: NEXT_PUBLIC_ALLOW_TEST_LOGIN=true, TEST_USER_EMAIL,
                TEST_USER_PASSWORD (and matching server env).
              </p>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-8">
            By signing in, you agree to our{' '}
            <a href="#" className="text-gray-400 hover:text-white underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-gray-400 hover:text-white underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
