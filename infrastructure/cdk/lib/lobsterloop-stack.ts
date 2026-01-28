import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class LobsterLoopStack extends cdk.Stack {
  public readonly securityGroup: ec2.SecurityGroup;
  public readonly ec2InstanceRole: iam.Role;
  public readonly appRole: iam.Role;
  public readonly instanceProfile: iam.CfnInstanceProfile;
  public readonly vpc: ec2.IVpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Use default VPC
    this.vpc = ec2.Vpc.fromLookup(this, 'DefaultVPC', {
      isDefault: true,
    });

    // Security Group for EC2 instances
    this.securityGroup = new ec2.SecurityGroup(this, 'LobsterLoopSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for LobsterLoop EC2 instances',
      allowAllOutbound: true,
    });

    // EC2 Instance IAM Role (for instances to use SSM)
    this.ec2InstanceRole = new iam.Role(this, 'LobsterLoopEC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for LobsterLoop EC2 instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });

    // Create Instance Profile
    this.instanceProfile = new iam.CfnInstanceProfile(this, 'LobsterLoopInstanceProfile', {
      roles: [this.ec2InstanceRole.roleName],
      instanceProfileName: 'LobsterLoopEC2InstanceProfile',
    });

    // App IAM Role (for Next.js app to manage infrastructure)
    this.appRole = new iam.Role(this, 'LobsterLoopAppRole', {
      assumedBy: new iam.AccountPrincipal(cdk.Stack.of(this).account),
      description: 'IAM role for LobsterLoop application',
    });

    // Grant EC2 permissions to app role
    this.appRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ec2:RunInstances',
          'ec2:DescribeInstances',
          'ec2:DescribeInstanceStatus',
          'ec2:TerminateInstances',
          'ec2:CreateTags',
          'ec2:DescribeTags',
          'ec2:StopInstances',
          'ec2:StartInstances',
        ],
        resources: ['*'],
      })
    );

    // Grant SSM permissions to app role
    this.appRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ssm:SendCommand',
          'ssm:GetCommandInvocation',
          'ssm:ListCommandInvocations',
          'ssm:DescribeInstanceInformation',
        ],
        resources: ['*'],
      })
    );

    // Grant Secrets Manager permissions to app role
    this.appRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:CreateSecret',
          'secretsmanager:GetSecretValue',
          'secretsmanager:DeleteSecret',
          'secretsmanager:ListSecrets',
          'secretsmanager:TagResource',
        ],
        resources: ['*'],
      })
    );

    // Grant IAM PassRole permission (required for RunInstances)
    this.appRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['iam:PassRole'],
        resources: [this.ec2InstanceRole.roleArn],
      })
    );

    // Create Launch Template for Ralph EC2 instances
    // Note: userData not needed since using custom AMI with everything pre-installed

    const launchTemplate = new ec2.LaunchTemplate(this, 'LobsterLoopLaunchTemplate', {
      launchTemplateName: 'LobsterLoop-Ralph-Template',
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      // Use custom AMI with Ralph + Claude Code pre-installed
      machineImage: ec2.MachineImage.genericLinux({
        'us-east-1': process.env.EC2_AMI_ID || 'ami-0bf2dfe67e7b1f155',
      }),
      securityGroup: this.securityGroup,
      role: this.ec2InstanceRole,
      // Removed spot options - will use on-demand for reliability
      // Spot instances can be configured at runtime in RunInstances call if needed
    });

    // Outputs
    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: this.securityGroup.securityGroupId,
      description: 'Security Group ID for EC2 instances',
      exportName: 'LobsterLoop-SecurityGroupId',
    });

    new cdk.CfnOutput(this, 'EC2InstanceRoleArn', {
      value: this.ec2InstanceRole.roleArn,
      description: 'IAM Role ARN for EC2 instances',
      exportName: 'LobsterLoop-EC2RoleArn',
    });

    new cdk.CfnOutput(this, 'InstanceProfileArn', {
      value: this.instanceProfile.attrArn,
      description: 'Instance Profile ARN for EC2 instances',
      exportName: 'LobsterLoop-InstanceProfileArn',
    });

    new cdk.CfnOutput(this, 'AppRoleArn', {
      value: this.appRole.roleArn,
      description: 'IAM Role ARN for application',
      exportName: 'LobsterLoop-AppRoleArn',
    });

    new cdk.CfnOutput(this, 'LaunchTemplateId', {
      value: launchTemplate.launchTemplateId!,
      description: 'Launch Template ID',
      exportName: 'LobsterLoop-LaunchTemplateId',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: 'LobsterLoop-VpcId',
    });
  }
}
