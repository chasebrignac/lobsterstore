import { NextResponse } from 'next/server'
import { getWarmPoolStatus } from '@/lib/aws/warm-pool'

export async function GET() {
  try {
    const status = await getWarmPoolStatus()

    return NextResponse.json({
      healthy: status.available >= 2, // At least 2 available is healthy
      warmPool: status,
      message:
        status.available >= 3
          ? 'Warm pool is fully healthy'
          : status.available >= 2
            ? 'Warm pool is operational but below target'
            : 'Warm pool needs attention',
    })
  } catch (error) {
    console.error('Error checking warm pool status:', error)
    return NextResponse.json(
      {
        healthy: false,
        error: 'Failed to check warm pool status',
      },
      { status: 500 }
    )
  }
}
