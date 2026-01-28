import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'
import { storeApiKey, deleteApiKey } from '@/lib/aws/secrets'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      provider: true,
      isDefault: true,
      createdAt: true,
    },
  })

  return NextResponse.json(apiKeys)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, provider, apiKey } = body

  if (!name || !provider || !apiKey) {
    return NextResponse.json(
      { error: 'Name, provider, and API key are required' },
      { status: 400 }
    )
  }

  // Validate provider
  const validProviders = ['anthropic', 'openai', 'xai', 'kimi']
  if (!validProviders.includes(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
  }

  // Store in AWS Secrets Manager
  const secretArn = await storeApiKey(session.user.id, provider, apiKey)

  // Save to database
  const newApiKey = await prisma.apiKey.create({
    data: {
      userId: session.user.id,
      name,
      provider,
      secretArn,
      isDefault: false,
    },
    select: {
      id: true,
      name: true,
      provider: true,
      isDefault: true,
      createdAt: true,
    },
  })

  return NextResponse.json(newApiKey)
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: { id },
  })

  if (!apiKey || apiKey.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Delete from AWS Secrets Manager
  await deleteApiKey(apiKey.secretArn)

  // Delete from database
  await prisma.apiKey.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
