import {
  CreateSecretCommand,
  GetSecretValueCommand,
  DeleteSecretCommand,
} from '@aws-sdk/client-secrets-manager'
import { secretsClient } from './config'

export async function storeApiKey(
  userId: string,
  provider: string,
  apiKey: string
): Promise<string> {
  const secretName = `lobsterloop/${userId}/${provider}/${Date.now()}`

  const command = new CreateSecretCommand({
    Name: secretName,
    SecretString: apiKey,
    Tags: [
      { Key: 'UserId', Value: userId },
      { Key: 'Provider', Value: provider },
      { Key: 'App', Value: 'LobsterLoop' },
    ],
  })

  const response = await secretsClient.send(command)
  return response.ARN!
}

export async function retrieveApiKey(secretArn: string): Promise<string> {
  const command = new GetSecretValueCommand({
    SecretId: secretArn,
  })

  const response = await secretsClient.send(command)
  return response.SecretString!
}

export async function deleteApiKey(secretArn: string): Promise<void> {
  const command = new DeleteSecretCommand({
    SecretId: secretArn,
    ForceDeleteWithoutRecovery: true,
  })

  await secretsClient.send(command)
}
