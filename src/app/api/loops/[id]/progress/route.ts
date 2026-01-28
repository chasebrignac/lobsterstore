import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Get the most recent execution for this loop
  const execution = await prisma.execution.findFirst({
    where: {
      loopId: id,
      userId: session.user.id,
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!execution) {
    return new Response('Execution not found', { status: 404 })
  }

  // Set up Server-Sent Events
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = async () => {
        try {
          const currentExecution = await prisma.execution.findUnique({
            where: { id: execution.id },
          })

          if (!currentExecution) {
            controller.close()
            return
          }

          const data = {
            status: currentExecution.status,
            progress: currentExecution.progress || '',
            currentStep: currentExecution.currentStep,
            totalSteps: currentExecution.totalSteps,
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          )

          // Close stream if execution is complete or failed
          if (currentExecution.status === 'completed' || currentExecution.status === 'failed') {
            controller.close()
            return
          }

          // Schedule next update
          setTimeout(sendUpdate, 2000)
        } catch (error) {
          console.error('SSE error:', error)
          controller.close()
        }
      }

      // Start sending updates
      sendUpdate()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
