#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LobsterLoopStack } from '../lib/lobsterloop-stack';

const app = new cdk.App();
new LobsterLoopStack(app, 'LobsterLoopStack', {
  env: {
    account: '752160877725',
    region: 'us-east-1',
  },
});