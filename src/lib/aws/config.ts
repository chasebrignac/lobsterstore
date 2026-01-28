import { EC2Client } from '@aws-sdk/client-ec2'
import { SSMClient } from '@aws-sdk/client-ssm'
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager'

const region = process.env.AWS_REGION || 'us-east-1'

export const ec2Client = new EC2Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export const ssmClient = new SSMClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export const secretsClient = new SecretsManagerClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export const awsConfig = {
  region,
  ec2: {
    amiId: process.env.EC2_AMI_ID!,
    securityGroupId: process.env.EC2_SECURITY_GROUP_ID!,
    instanceProfileArn: process.env.EC2_INSTANCE_PROFILE_ARN!,
    launchTemplateId: process.env.EC2_LAUNCH_TEMPLATE_ID!,
    keyPairName: process.env.EC2_KEY_PAIR_NAME || 'lobsterloop-key',
    maxInstances: parseInt(process.env.MAX_EC2_INSTANCES || '5'),
  },
}
