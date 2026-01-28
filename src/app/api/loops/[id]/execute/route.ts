import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'
import { executeLoop } from '@/lib/ralph/executor'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { apiKeyId, tool } = body

  if (!apiKeyId) {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 })
  }

  const allowedTools = ['claude-code', 'codex', 'opencode']
  const resolvedTool = allowedTools.includes(tool) ? tool : 'claude-code'

  // Get loop
  const loop = await prisma.loop.findUnique({
    where: { id },
  })

  if (!loop) {
    return NextResponse.json({ error: 'Loop not found' }, { status: 404 })
  }

  // Verify API key belongs to user
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: apiKeyId },
  })

  if (!apiKey || apiKey.userId !== session.user.id) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 403 })
  }

  // Count total steps (user stories)
  const prd = loop.prd as any
  const totalSteps = prd.userStories?.length || 10

  // Create execution
  const execution = await prisma.execution.create({
    data: {
      loopId: loop.id,
      userId: session.user.id,
      apiKeyId: apiKey.id,
      // tool is not persisted in the schema; progress log will note it
      status: 'queued',
      prdSnapshot: loop.prd as any,
      totalSteps,
    },
  })

  // Start execution in background
  executeLoop(execution.id, resolvedTool).catch(console.error)

  return NextResponse.json(execution)
}
