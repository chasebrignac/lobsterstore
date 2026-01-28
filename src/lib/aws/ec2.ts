import {
  RunInstancesCommand,
  DescribeInstancesCommand,
  TerminateInstancesCommand,
  DescribeInstanceStatusCommand,
} from '@aws-sdk/client-ec2'
import { ec2Client, awsConfig } from './config'
import { prisma } from '../db/client'
import { getWarmInstance } from './warm-pool'

export async function getAvailableInstance(): Promise<string> {
  // PRIORITY 1: Try to get a warm instance (instant startup)
  const warmInstanceId = await getWarmInstance()
  if (warmInstanceId) {
    console.log('✅ Using warm instance (no cold start)')
    return warmInstanceId
  }

  // PRIORITY 2: Try to find an available instance in the pool
  const availableInstance = await prisma.eC2Instance.findFirst({
    where: { status: 'available', isWarm: false },
  })

  if (availableInstance) {
    // Mark as busy
    await prisma.eC2Instance.update({
      where: { id: availableInstance.id },
      data: { status: 'busy', lastUsedAt: new Date() },
    })
    console.log('Using existing instance from pool')
    return availableInstance.instanceId
  }

  // PRIORITY 3: Check if we can spawn a new instance
  const instanceCount = await prisma.eC2Instance.count({
    where: { status: { in: ['launching', 'available', 'busy'] } },
  })

  if (instanceCount >= awsConfig.ec2.maxInstances) {
    throw new Error('EC2 instance pool exhausted. Please try again later.')
  }

  // PRIORITY 4: Spawn a new instance (cold start)
  console.log('⚠️  No warm instances available, spawning new instance (cold start)')
  return await spawnInstance()
}

export async function spawnInstance(useSpot: boolean = true): Promise<string> {
  // Use CDK-managed launch template for all instance configuration
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
          { Key: 'Name', Value: 'LobsterLoop-Runner' },
          { Key: 'Project', Value: 'LobsterLoop' },
          { Key: 'ManagedBy', Value: 'CDK' },
        ],
      },
    ],
  }

  // Try spot instance first (70% cost savings)
  if (useSpot) {
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
      const instanceId = response.Instances![0].InstanceId!
      console.log('✅ Spawned spot instance:', instanceId)

      // Save to database
      await prisma.eC2Instance.create({
        data: {
          instanceId,
          status: 'launching',
        },
      })

      await waitForInstanceReady(instanceId)
      return instanceId
    } catch (error: any) {
      // If spot capacity unavailable, fall back to on-demand
      if (error.Code === 'InsufficientInstanceCapacity') {
        console.log('⚠️  Spot capacity unavailable, falling back to on-demand')
      } else {
        throw error
      }
    }
  }

  // Fallback: Use on-demand instance
  const onDemandCommand = new RunInstancesCommand(baseParams)
  const response = await ec2Client.send(onDemandCommand)
  const instanceId = response.Instances![0].InstanceId!
  console.log('✅ Spawned on-demand instance:', instanceId)

  // Save to database
  await prisma.eC2Instance.create({
    data: {
      instanceId,
      status: 'launching',
    },
  })

  // Wait for instance to be ready
  await waitForInstanceReady(instanceId)

  return instanceId
}

export async function waitForInstanceReady(instanceId: string): Promise<void> {
  const maxAttempts = 60 // 5 minutes
  let attempts = 0

  while (attempts < maxAttempts) {
    const statusCommand = new DescribeInstanceStatusCommand({
      InstanceIds: [instanceId],
    })

    try {
      const statusResponse = await ec2Client.send(statusCommand)
      const status = statusResponse.InstanceStatuses?.[0]

      if (
        status?.InstanceState?.Name === 'running' &&
        status?.InstanceStatus?.Status === 'ok' &&
        status?.SystemStatus?.Status === 'ok'
      ) {
        // Get IP address
        const describeCommand = new DescribeInstancesCommand({
          InstanceIds: [instanceId],
        })
        const describeResponse = await ec2Client.send(describeCommand)
        const ipAddress = describeResponse.Reservations?.[0]?.Instances?.[0]?.PublicIpAddress

        // Update database
        await prisma.eC2Instance.update({
          where: { instanceId },
          data: {
            status: 'available',
            ipAddress: ipAddress || null,
          },
        })

        return
      }
    } catch (error) {
      // Instance might not be ready yet, continue waiting
    }

    await new Promise((resolve) => setTimeout(resolve, 5000))
    attempts++
  }

  throw new Error(`Instance ${instanceId} failed to become ready in time`)
}

export async function recycleInstance(instanceId: string): Promise<void> {
  await prisma.eC2Instance.update({
    where: { instanceId },
    data: {
      status: 'available',
      currentExecutionId: null,
      lastUsedAt: new Date(),
    },
  })
}

export async function terminateInstance(instanceId: string): Promise<void> {
  // Mark as terminating in database
  await prisma.eC2Instance.update({
    where: { instanceId },
    data: { status: 'terminating' },
  })

  // Terminate in AWS
  const command = new TerminateInstancesCommand({
    InstanceIds: [instanceId],
  })

  await ec2Client.send(command)

  // Remove from database after a delay
  setTimeout(async () => {
    await prisma.eC2Instance.delete({
      where: { instanceId },
    })
  }, 60000) // 1 minute delay
}
