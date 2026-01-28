import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.id) {
    // Return a minimal shell; middleware should normally guard this
    return (
      <div className="container mx-auto px-4 py-8 text-white">
        <h1 className="text-2xl font-bold mb-2">Not signed in</h1>
        <p className="text-gray-400">Please sign in again.</p>
      </div>
    )
  }

  const loops = await prisma.loop.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    include: {
      _count: {
        select: {
          executions: true,
        },
      },
    },
  })

  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  })

  const recentExecutions = await prisma.execution.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      loop: {
        select: {
          name: true,
        },
      },
    },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">
          Welcome back! Manage your loops and executions.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg shadow-sm">
          <div className="text-3xl font-bold text-white mb-2">
            {loops.length}
          </div>
          <div className="text-gray-400">Total Loops</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg shadow-sm">
          <div className="text-3xl font-bold text-white mb-2">
            {recentExecutions.length}
          </div>
          <div className="text-gray-400">Recent Executions</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-lg shadow-sm">
          <div className="text-3xl font-bold text-white mb-2">
            {apiKeys.length}
          </div>
          <div className="text-gray-400">API Keys</div>
        </div>
      </div>

      {apiKeys.length === 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-8">
          <p className="text-yellow-400">
            You haven't added any API keys yet.{' '}
            <Link href="/settings/api-keys" className="underline font-semibold hover:text-yellow-300">
              Add one now
            </Link>{' '}
            to start executing loops.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">My Loops</h2>
            <Link
              href="/loops/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Create Loop
            </Link>
          </div>

          {loops.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-lg shadow-sm text-center">
              <p className="text-gray-500 mb-4">No loops yet</p>
              <Link
                href="/loops/new"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create your first loop
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {loops.map((loop) => (
                <Link
                  key={loop.id}
                  href={`/loops/${loop.id}`}
                  className="block bg-gray-900 border border-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-white mb-1">
                    {loop.name}
                  </h3>
                  {loop.description && (
                    <p className="text-sm text-gray-400 mb-2">
                      {loop.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-500">
                    {loop._count.executions} executions
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Recent Executions
          </h2>

          {recentExecutions.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-lg shadow-sm text-center">
              <p className="text-gray-500">No executions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentExecutions.map((execution) => (
                <div
                  key={execution.id}
                  className="bg-gray-900 border border-gray-800 p-4 rounded-lg shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">
                      {execution.loop.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        execution.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : execution.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : execution.status === 'running'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {execution.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {execution.createdAt.toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
