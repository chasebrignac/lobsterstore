#!/usr/bin/env tsx
/**
 * Warm Pool Status Check
 *
 * Displays the current status of the warm pool instances.
 */

import 'dotenv/config'
import { getWarmPoolStatus } from '../src/lib/aws/warm-pool'

async function main() {
  console.log('=== LobsterLoop Warm Pool Status ===')
  console.log('Time:', new Date().toISOString())
  console.log()

  try {
    const status = await getWarmPoolStatus()

    console.log('Warm Pool Status:')
    console.log(`  Total instances: ${status.total}`)
    console.log(`  Available: ${status.available}`)
    console.log(`  Busy: ${status.busy}`)
    console.log()

    if (status.instances.length === 0) {
      console.log('⚠️  No warm instances found!')
      console.log('Run: npm run warm-pool:maintain')
    } else {
      console.log('Instances:')
      status.instances.forEach((instance, index) => {
        const emoji = instance.status === 'available' ? '✅' : '⚙️'
        console.log(`  ${index + 1}. ${emoji} ${instance.instanceId}`)
        console.log(`     Status: ${instance.status}`)
        console.log(`     Age: ${instance.age}`)
        console.log()
      })

      if (status.available >= 3) {
        console.log('✅ Warm pool is fully healthy!')
      } else if (status.available >= 2) {
        console.log('⚠️  Warm pool is operational but below target (need 3, have ' + status.available + ')')
      } else {
        console.log('❌ Warm pool is below minimum threshold!')
        console.log('Run: npm run warm-pool:maintain')
      }
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Failed to get warm pool status:')
    console.error(error)
    process.exit(1)
  }
}

main()
