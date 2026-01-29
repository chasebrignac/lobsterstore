import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import { storeApiKey, retrieveApiKey } from '@/lib/aws/secrets'
import { executeLoop } from '@/lib/ralph/executor'

export async function POST(request: NextRequest) {
  if (process.env.TEST_API_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Disabled' }, { status: 403 })
  }

  const secret = request.headers.get('x-test-secret')
  if (!secret || secret !== process.env.TEST_API_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const {
    prd,
    apiKey,
    provider = 'kimi',
    tool = 'claude-code',
    name = 'Test Loop',
    description = 'Automated test loop',
  } = body

  if (!prd || !apiKey) {
    return NextResponse.json({ error: 'prd and apiKey required' }, { status: 400 })
  }

  // Ensure test user exists
  const email = process.env.TEST_USER_EMAIL || 'test@example.com'
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return NextResponse.json({ error: 'Test user not seeded' }, { status: 400 })
  }

  // Store API key in Secrets Manager
  const secretArn = await storeApiKey(user.id, provider, apiKey)
  const apiRecord = await prisma.apiKey.create({
    data: {
      userId: user.id,
      name: `${provider}-test-${Date.now()}`,
      provider,
      secretArn,
      isDefault: false,
    },
  })

  // Create loop
  const loop = await prisma.loop.create({
    data: {
      userId: user.id,
      name,
      description,
      prd,
      isPublic: false,
    },
  })

  const totalSteps = prd?.userStories?.length || 10

  // Create execution
  const execution = await prisma.execution.create({
    data: {
      loopId: loop.id,
      userId: user.id,
      apiKeyId: apiRecord.id,
      status: 'queued',
      prdSnapshot: prd,
      totalSteps,
    },
  })

  // Kick off execution (background)
  executeLoop(execution.id, tool).catch(console.error)

  return NextResponse.json({
    loopId: loop.id,
    executionId: execution.id,
    apiKeyId: apiRecord.id,
    tool,
    provider,
  })
}
