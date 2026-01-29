import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'

export default async function LoopsPage() {
  const session = await getServerSession(authOptions)

  const loops = await prisma.loop.findMany({
    where: { userId: session!.user!.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: {
          executions: true,
        },
      },
    },
  })

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-50 mb-2">My Loops</h1>
            <p className="text-gray-300">Manage your Ralph workflows</p>
          </div>

          <Link
            href="/loops/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Loop
          </Link>
        </div>

        {loops.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 p-12 rounded-lg shadow-lg text-center">
            <p className="text-gray-200 mb-6 text-lg">No loops yet</p>
            <Link
              href="/loops/new"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create your first loop
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loops.map((loop) => (
              <Link
                key={loop.id}
                href={`/loops/${loop.id}`}
                className="bg-gray-900 border border-gray-800 p-6 rounded-lg shadow-lg hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-50 text-lg">
                    {loop.name}
                  </h3>
                  {loop.isPublic && (
                    <span className="px-2 py-1 bg-green-900 text-green-200 text-xs rounded-full border border-green-700">
                      Public
                    </span>
                  )}
                </div>

                {loop.description && (
                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                    {loop.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{loop._count.executions} executions</span>
                  <span>{new Date(loop.updatedAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
