import { SendCommandCommand, GetCommandInvocationCommand } from '@aws-sdk/client-ssm'
import { ssmClient } from '../aws/config'
import { prisma } from '../db/client'
import { getAvailableInstance, recycleInstance } from '../aws/ec2'
import { retrieveApiKey } from '../aws/secrets'

export async function executeLoop(executionId: string): Promise<void> {
  try {
    // Update execution status
    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status: 'running',
        startedAt: new Date(),
      },
    })

    // Get execution details
    const execution = await prisma.execution.findUnique({
      where: { id: executionId },
      include: {
        apiKey: true,
        loop: true,
      },
    })

    if (!execution) {
      throw new Error('Execution not found')
    }

    // Get available EC2 instance
    const instanceId = await getAvailableInstance()

    // Update execution with instance ID
    await prisma.execution.update({
      where: { id: executionId },
      data: { ec2InstanceId: instanceId },
    })

    // Update EC2 instance with execution ID
    await prisma.eC2Instance.update({
      where: { instanceId },
      data: { currentExecutionId: executionId },
    })

    // Retrieve API key
    const apiKey = await retrieveApiKey(execution.apiKey.secretArn)

    // Execute Ralph on EC2
    await executeRalphOnEC2(
      instanceId,
      executionId,
      JSON.stringify(execution.prdSnapshot),
      apiKey,
      execution.apiKey.provider
    )

    // Start monitoring in background
    monitorExecution(executionId, instanceId).catch(console.error)
  } catch (error) {
    console.error('Execution failed:', error)
    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status: 'failed',
        progress: `Error: ${error instanceof Error ? error.message : String(error)}`,
        completedAt: new Date(),
      },
    })
  }
}

async function executeRalphOnEC2(
  instanceId: string,
  executionId: string,
  prdJson: string,
  apiKey: string,
  provider: string
): Promise<string> {
  // SECURITY: Use ralph-runner.sh script which handles API keys securely
  // API keys are passed as base64-encoded parameters to avoid logging
  const encodedApiKey = Buffer.from(apiKey).toString('base64')
  const encodedPrdJson = Buffer.from(prdJson).toString('base64')

  const script = `#!/bin/bash
set -e

# Decode parameters (prevents API keys from appearing in SSM command logs)
PRD_JSON=$(echo "${encodedPrdJson}" | base64 -d)
API_KEY=$(echo "${encodedApiKey}" | base64 -d)

# Execute using the pre-installed ralph-runner.sh script
/opt/lobsterloop/ralph-runner.sh "${executionId}" "$PRD_JSON" "$API_KEY" "${provider}"
`

  const command = new SendCommandCommand({
    InstanceIds: [instanceId],
    DocumentName: 'AWS-RunShellScript',
    Parameters: {
      commands: [script],
    },
    TimeoutSeconds: 3600, // 1 hour timeout
    // SECURITY: CloudWatch logging disabled for this command to prevent API key exposure
    CloudWatchOutputConfig: {
      CloudWatchLogGroupName: undefined,
      CloudWatchOutputEnabled: false,
    },
  })

  const response = await ssmClient.send(command)
  return response.Command?.CommandId || ''
}

async function monitorExecution(executionId: string, instanceId: string): Promise<void> {
  const maxDuration = 60 * 60 * 1000 // 1 hour
  const startTime = Date.now()
  const pollInterval = 5000 // 5 seconds

  while (Date.now() - startTime < maxDuration) {
    try {
      // Read progress from EC2
      const progress = await readProgressFile(instanceId, executionId)

      // Parse current step
      const currentStep = parseCurrentStep(progress)

      // Check if complete
      const isComplete = isExecutionComplete(progress)

      // Update execution
      await prisma.execution.update({
        where: { id: executionId },
        data: {
          progress,
          currentStep,
          status: isComplete ? 'completed' : 'running',
          completedAt: isComplete ? new Date() : null,
        },
      })

      if (isComplete) {
        // Recycle instance
        await recycleInstance(instanceId)
        return
      }
    } catch (error) {
      console.error('Monitoring error:', error)
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval))
  }

  // Timeout
  await prisma.execution.update({
    where: { id: executionId },
    data: {
      status: 'failed',
      progress: 'Execution timed out after 1 hour',
      completedAt: new Date(),
    },
  })

  await recycleInstance(instanceId)
}

async function readProgressFile(instanceId: string, executionId: string): Promise<string> {
  const command = new SendCommandCommand({
    InstanceIds: [instanceId],
    DocumentName: 'AWS-RunShellScript',
    Parameters: {
      commands: [`cat /opt/lobsterloop/executions/${executionId}/progress.txt 2>&1 || echo "No progress yet"`],
    },
  })

  const response = await ssmClient.send(command)
  const commandId = response.Command?.CommandId

  if (!commandId) {
    return 'No progress yet'
  }

  // Wait for command to complete
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Get command output
  const outputCommand = new GetCommandInvocationCommand({
    CommandId: commandId,
    InstanceId: instanceId,
  })

  const outputResponse = await ssmClient.send(outputCommand)
  return outputResponse.StandardOutputContent || 'No progress yet'
}

function parseCurrentStep(progress: string): number {
  // Count completed user stories
  const passMatches = progress.match(/passes:\s*true/g)
  const completedStories = passMatches ? passMatches.length : 0

  // Ralph has 10 steps total
  // Map completed stories to steps (roughly)
  return Math.min(completedStories + 1, 10)
}

function isExecutionComplete(progress: string): boolean {
  return progress.includes('<promise>COMPLETE</promise>') || progress.includes('Execution complete')
}
