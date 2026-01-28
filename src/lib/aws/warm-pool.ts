import {
  RunInstancesCommand,
  DescribeInstancesCommand,
  TerminateInstancesCommand,
} from '@aws-sdk/client-ec2'
import { ec2Client, awsConfig } from './config'
import { prisma } from '../db/client'

const WARM_POOL_SIZE = 3 // Keep 3 instances warm at all times
const WARM_INSTANCE_MAX_AGE_HOURS = 24 // Rotate instances after 24 hours

export async function maintainWarmPool(): Promise<void> {
  console.log('Starting warm pool maintenance...')

  try {
    // Get current warm pool instances from database
    const warmInstances = await prisma.eC2Instance.findMany({
      where: {
        status: 'available',
        isWarm: true,
      },
    })

    console.log(`Current warm pool size: ${warmInstances.length}`)

    // Check if we need to add more instances
    const instancesNeeded = WARM_POOL_SIZE - warmInstances.length

    if (instancesNeeded > 0) {
      console.log(`Spawning ${instancesNeeded} warm instances...`)

      for (let i = 0; i < instancesNeeded; i++) {
        await spawnWarmInstance()
      }
    }

    // Rotate old instances (older than 24 hours)
    const now = new Date()
    const oldInstances = warmInstances.filter((instance) => {
      const age = now.getTime() - (instance.createdAt?.getTime() || 0)
      return age > WARM_INSTANCE_MAX_AGE_HOURS * 60 * 60 * 1000
    })

    if (oldInstances.length > 0) {
      console.log(`Rotating ${oldInstances.length} old instances...`)

      for (const instance of oldInstances) {
        // Spawn a new instance before terminating the old one
        await spawnWarmInstance()

        // Terminate the old instance
        await terminateWarmInstance(instance.instanceId)
      }
    }

    console.log('✅ Warm pool maintenance complete')
  } catch (error) {
    console.error('❌ Warm pool maintenance failed:', error)
    throw error
  }
}

async function spawnWarmInstance(): Promise<string> {
  console.log('Spawning new warm instance...')

  const baseParams = {
    LaunchTemplate: {
      LaunchTemplateId: awsConfig.ec2.launchTemplateId,
    },
    MinCount: 1,
    MaxCount: 1,
    TagSpecifications: [
      {
        ResourceType: 'instance' as const,
        Tags: [
          { Key: 'Name', Value: 'LobsterLoop-Warm-Pool' },
          { Key: 'Project', Value: 'LobsterLoop' },
          { Key: 'WarmPool', Value: 'true' },
          { Key: 'ManagedBy', Value: 'CDK' },
        ],
      },
    ],
  }

  let instanceId: string
  let isSpot = false

  // Try spot instance first (70% cost savings)
  try {
    const spotCommand = new RunInstancesCommand({
      ...baseParams,
      InstanceMarketOptions: {
        MarketType: 'spot',
        SpotOptions: {
          MaxPrice: '0.05',
          SpotInstanceType: 'one-time',
          InstanceInterruptionBehavior: 'terminate',
        },
      },
    })

    const response = await ec2Client.send(spotCommand)
    instanceId = response.Instances![0].InstanceId!
    isSpot = true
    console.log(`Warm instance launched (spot): ${instanceId}`)
  } catch (error: any) {
    if (error.Code === 'InsufficientInstanceCapacity' || error.name === 'InsufficientInstanceCapacity') {
      console.log('⚠️  Spot capacity unavailable, falling back to on-demand...')

      // Fallback: Use on-demand instance
      const onDemandCommand = new RunInstancesCommand(baseParams)
      const response = await ec2Client.send(onDemandCommand)
      instanceId = response.Instances![0].InstanceId!
      console.log(`Warm instance launched (on-demand): ${instanceId}`)
    } else {
      console.error('Failed to spawn warm instance:', error)
      throw error
    }
  }

  // Save to database
  await prisma.eC2Instance.create({
    data: {
      instanceId: instanceId!,
      status: 'available',
      isWarm: true,
      createdAt: new Date(),
    },
  })

  // Wait for instance to be fully ready (in background)
  waitForWarmInstanceReady(instanceId!).catch(console.error)

  return instanceId!
}

async function waitForWarmInstanceReady(instanceId: string): Promise<void> {
  console.log(`Waiting for warm instance ${instanceId} to be ready...`)

  const maxAttempts = 60 // 5 minutes
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      })

      const response = await ec2Client.send(command)
      const instance = response.Reservations?.[0]?.Instances?.[0]

      if (instance?.State?.Name === 'running') {
        // Get IP address
        const ipAddress = instance.PublicIpAddress || instance.PrivateIpAddress

        // Update database
        await prisma.eC2Instance.update({
          where: { instanceId },
          data: {
            ipAddress,
            lastUsedAt: new Date(),
          },
        })

        console.log(`✅ Warm instance ${instanceId} is ready at ${ipAddress}`)
        return
      }
    } catch (error) {
      console.error(`Error checking warm instance ${instanceId}:`, error)
    }

    attempts++
    await new Promise((resolve) => setTimeout(resolve, 5000))
  }

  console.error(`⚠️  Warm instance ${instanceId} did not become ready in time`)
}

async function terminateWarmInstance(instanceId: string): Promise<void> {
  console.log(`Terminating warm instance ${instanceId}...`)

  try {
    const command = new TerminateInstancesCommand({
      InstanceIds: [instanceId],
    })

    await ec2Client.send(command)

    // Update database
    await prisma.eC2Instance.update({
      where: { instanceId },
      data: {
        status: 'terminating',
      },
    })

    console.log(`Warm instance ${instanceId} terminated`)
  } catch (error) {
    console.error(`Failed to terminate warm instance ${instanceId}:`, error)
  }
}

export async function getWarmInstance(): Promise<string | null> {
  // Get the oldest warm instance (FIFO for even usage)
  const warmInstance = await prisma.eC2Instance.findFirst({
    where: {
      status: 'available',
      isWarm: true,
    },
    orderBy: {
      lastUsedAt: 'asc', // Oldest first
    },
  })

  if (!warmInstance) {
    return null
  }

  // Mark as busy
  await prisma.eC2Instance.update({
    where: { id: warmInstance.id },
    data: {
      status: 'busy',
      isWarm: false, // No longer in warm pool
      lastUsedAt: new Date(),
    },
  })

  // Spawn a replacement warm instance in background
  spawnWarmInstance().catch(console.error)

  console.log(`Using warm instance: ${warmInstance.instanceId}`)
  return warmInstance.instanceId
}

export async function getWarmPoolStatus(): Promise<{
  total: number
  available: number
  busy: number
  instances: Array<{ instanceId: string; status: string; age: string }>
}> {
  const warmInstances = await prisma.eC2Instance.findMany({
    where: {
      isWarm: true,
      status: { in: ['available', 'busy'] },
    },
  })

  const now = new Date()
  const instances = warmInstances.map((instance) => {
    const ageMs = now.getTime() - (instance.createdAt?.getTime() || 0)
    const ageHours = Math.floor(ageMs / (1000 * 60 * 60))
    const ageMinutes = Math.floor((ageMs % (1000 * 60 * 60)) / (1000 * 60))

    return {
      instanceId: instance.instanceId,
      status: instance.status,
      age: `${ageHours}h ${ageMinutes}m`,
    }
  })

  return {
    total: warmInstances.length,
    available: warmInstances.filter((i) => i.status === 'available').length,
    busy: warmInstances.filter((i) => i.status === 'busy').length,
    instances,
  }
}
