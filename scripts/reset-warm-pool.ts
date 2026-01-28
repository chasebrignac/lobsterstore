#!/usr/bin/env tsx
/**
 * Reset Warm Pool
 *
 * Cleans up stale instance records and spawns fresh warm instances with CDK infrastructure
 */

import 'dotenv/config'
import { prisma } from '../src/lib/db/client'
import { maintainWarmPool } from '../src/lib/aws/warm-pool'
import { ec2Client } from '../src/lib/aws/config'
import { DescribeInstancesCommand } from '@aws-sdk/client-ec2'

async function resetWarmPool() {
  console.log('=== Resetting Warm Pool ===')
  console.log('Time:', new Date().toISOString())
  console.log()

  try {
    // Step 1: Get all instances from database
    console.log('Step 1: Checking database for stale instances...')
    const dbInstances = await prisma.eC2Instance.findMany()
    console.log(`Found ${dbInstances.length} instances in database`)
    console.log()

    // Step 2: Check which ones actually exist in AWS
    console.log('Step 2: Verifying instances in AWS...')
    const staleInstances = []

    for (const dbInstance of dbInstances) {
      try {
        const command = new DescribeInstancesCommand({
          InstanceIds: [dbInstance.instanceId],
        })
        const response = await ec2Client.send(command)
        const state = response.Reservations?.[0]?.Instances?.[0]?.State?.Name

        if (!state || state === 'stopped' || state === 'stopping' || state === 'shutting-down') {
          staleInstances.push(dbInstance.instanceId)
        } else if (state === 'running' || state === 'pending') {
          console.log(`  ✅ ${dbInstance.instanceId}: ${state}`)
        } else {
          // Any other state is considered stale
          staleInstances.push(dbInstance.instanceId)
        }
      } catch (error: any) {
        // Instance not found or other error - mark as stale
        staleInstances.push(dbInstance.instanceId)
      }
    }

    // Step 3: Delete stale records
    if (staleInstances.length > 0) {
      console.log()
      console.log(`Step 3: Removing ${staleInstances.length} stale instances from database...`)
      await prisma.eC2Instance.deleteMany({
        where: {
          instanceId: {
            in: staleInstances,
          },
        },
      })
      console.log('✅ Stale instances removed')
    } else {
      console.log()
      console.log('Step 3: No stale instances to remove')
    }
    console.log()

    // Step 4: Spawn 3 fresh warm instances
    console.log('Step 4: Spawning 3 fresh warm instances with CDK infrastructure...')
    await maintainWarmPool()
    console.log()
    console.log('✅ Warm pool reset complete!')

    // Step 5: Show final status
    const finalInstances = await prisma.eC2Instance.findMany({
      where: { isWarm: true, status: 'available' },
    })
    console.log()
    console.log(`Final warm pool: ${finalInstances.length} instances`)
    finalInstances.forEach(instance => {
      console.log(`  - ${instance.instanceId}`)
    })

    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to reset warm pool:')
    console.error(error)
    process.exit(1)
  }
}

resetWarmPool()
