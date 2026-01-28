#!/usr/bin/env tsx
/**
 * Warm Pool Maintenance Script
 *
 * This script ensures that 3 EC2 instances are kept warm at all times.
 * Run this script:
 * - On a cron schedule (every 15 minutes recommended)
 * - After deploying new infrastructure
 * - Manually via: npm run warm-pool:maintain
 */

import 'dotenv/config'
import { maintainWarmPool, getWarmPoolStatus } from '../src/lib/aws/warm-pool'

async function main() {
  console.log('=== LobsterLoop Warm Pool Maintenance ===')
  console.log('Time:', new Date().toISOString())
  console.log()

  try {
    // Get current status
    console.log('Current warm pool status:')
    const statusBefore = await getWarmPoolStatus()
    console.log(`  Total instances: ${statusBefore.total}`)
    console.log(`  Available: ${statusBefore.available}`)
    console.log(`  Busy: ${statusBefore.busy}`)

    if (statusBefore.instances.length > 0) {
      console.log('\n  Instances:')
      statusBefore.instances.forEach((instance) => {
        console.log(`    - ${instance.instanceId} (${instance.status}) - Age: ${instance.age}`)
      })
    }

    console.log()

    // Run maintenance
    await maintainWarmPool()

    // Get updated status
    const statusAfter = await getWarmPoolStatus()
    console.log('\nWarm pool status after maintenance:')
    console.log(`  Total instances: ${statusAfter.total}`)
    console.log(`  Available: ${statusAfter.available}`)
    console.log(`  Busy: ${statusAfter.busy}`)

    if (statusAfter.instances.length > 0) {
      console.log('\n  Instances:')
      statusAfter.instances.forEach((instance) => {
        console.log(`    - ${instance.instanceId} (${instance.status}) - Age: ${instance.age}`)
      })
    }

    console.log('\n✅ Warm pool maintenance completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Warm pool maintenance failed:')
    console.error(error)
    process.exit(1)
  }
}

main()
