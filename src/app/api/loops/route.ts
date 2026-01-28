import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const isPublic = searchParams.get('public') === 'true'

  const loops = await prisma.loop.findMany({
    where: isPublic
      ? { isPublic: true }
      : { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          username: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          executions: true,
        },
      },
    },
  })

  return NextResponse.json(loops)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, description, prd, isPublic } = body

  if (!name || !prd) {
    return NextResponse.json({ error: 'Name and PRD are required' }, { status: 400 })
  }

  const loop = await prisma.loop.create({
    data: {
      userId: session.user.id,
      name,
      description,
      prd,
      isPublic: isPublic || false,
    },
  })

  return NextResponse.json(loop)
}
