import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  const loop = await prisma.loop.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          username: true,
          avatarUrl: true,
        },
      },
      executions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!loop) {
    return NextResponse.json({ error: 'Loop not found' }, { status: 404 })
  }

  // Check access
  if (!loop.isPublic && loop.userId !== session?.user?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(loop)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const loop = await prisma.loop.findUnique({
    where: { id },
  })

  if (!loop || loop.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, description, prd, isPublic } = body

  const updatedLoop = await prisma.loop.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(prd && { prd }),
      ...(isPublic !== undefined && { isPublic }),
    },
  })

  return NextResponse.json(updatedLoop)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const loop = await prisma.loop.findUnique({
    where: { id },
  })

  if (!loop || loop.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.loop.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
