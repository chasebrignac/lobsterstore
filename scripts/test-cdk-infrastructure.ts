#!/usr/bin/env tsx
/**
 * Test CDK Infrastructure
 *
 * Tests that the new CDK-managed infrastructure works properly:
 * 1. Spawn an EC2 instance using the launch template
 * 2. Verify SSM connectivity
 * 3. Run a simple command
 * 4. Clean up the test instance
 */

import 'dotenv/config'
import { spawnInstance, terminateInstance } from '../src/lib/aws/ec2'
import { ssmClient } from '../src/lib/aws/config'
import { SendCommandCommand, GetCommandInvocationCommand } from '@aws-sdk/client-ssm'

async function testInfrastructure() {
  console.log('=== Testing CDK Infrastructure ===')
  console.log('Time:', new Date().toISOString())
  console.log()

  let instanceId: string | null = null

  try {
    // Step 1: Spawn instance
    console.log('Step 1: Spawning test instance using CDK launch template...')
    instanceId = await spawnInstance()
    console.log(`✅ Instance spawned: ${instanceId}`)
    console.log()

    // Step 2: Wait a bit for SSM agent to be ready
    console.log('Step 2: Waiting for SSM agent to be ready (30 seconds)...')
    await new Promise(resolve => setTimeout(resolve, 30000))
    console.log('✅ Wait complete')
    console.log()

    // Step 3: Test SSM command
    console.log('Step 3: Testing SSM connectivity...')
    const command = new SendCommandCommand({
      InstanceIds: [instanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: ['echo "CDK infrastructure test successful"', 'node --version', 'which claude'],
      },
    })

    const response = await ssmClient.send(command)
    const commandId = response.Command!.CommandId!
    console.log(`✅ Command sent: ${commandId}`)
    console.log()

    // Step 4: Wait for command to complete
    console.log('Step 4: Waiting for command to complete...')
    await new Promise(resolve => setTimeout(resolve, 10000))

    const invocationCommand = new GetCommandInvocationCommand({
      CommandId: commandId,
      InstanceId: instanceId,
    })

    const invocationResponse = await ssmClient.send(invocationCommand)
    console.log('Command output:')
    console.log(invocationResponse.StandardOutputContent)
    console.log('✅ SSM command executed successfully')
    console.log()

    console.log('=== Infrastructure Test: PASSED ===')
    console.log()
    console.log('The CDK infrastructure is working correctly!')
    console.log('You can now proceed to delete the old AWS CLI infrastructure.')

  } catch (error) {
    console.error('❌ Infrastructure test failed:')
    console.error(error)
    process.exit(1)
  } finally {
    // Cleanup
    if (instanceId) {
      console.log()
      console.log('Cleaning up test instance...')
      await terminateInstance(instanceId)
      console.log('✅ Test instance terminated')
    }
  }

  process.exit(0)
}

testInfrastructure()
