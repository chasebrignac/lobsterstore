import Link from 'next/link'
import { prisma } from '@/lib/db/client'

export default async function DiscoverPage() {
  const publicLoops = await prisma.loop.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          username: true,
          name: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          executions: true,
        },
      },
    },
    take: 50,
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Loops</h1>
        <p className="text-gray-600">
          Explore public Ralph workflows created by the community
        </p>
      </div>

      {publicLoops.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm text-center">
          <p className="text-gray-500 text-lg">No public loops yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicLoops.map((loop) => (
            <Link
              key={loop.id}
              href={`/loops/${loop.id}`}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-3">
                {loop.user.avatarUrl && (
                  <img
                    src={loop.user.avatarUrl}
                    alt={loop.user.username || loop.user.name || 'User'}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-600">
                  @{loop.user.username || loop.user.name || 'Anonymous'}
                </span>
              </div>

              <h3 className="font-semibold text-gray-900 text-lg mb-2">
                {loop.name}
              </h3>

              {loop.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {loop.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{loop._count.executions} executions</span>
                <span>{new Date(loop.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
