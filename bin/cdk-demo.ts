#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkDemoStack } from '../lib/cdk-demo-stack';

const app = new cdk.App();
const prNumber = process.env.PR_NUM || app.node.tryGetContext("prNumber");

if (!prNumber) {
  // Default stack for main branch or manual deployments
  new CdkDemoStack(app, "DemoStack", {
    tags: {
      environment: "prod",
      env: "production",
      service: "demo",
    },
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });
} else {
  // PR-specific stack
  new CdkDemoStack(app, `DemoStack-PR-${prNumber}`, {
    /* props specific to PR environments, potentially smaller instance sizes etc. */

    stackName: `Demo-PR-${prNumber}`, // Explicit stack name
    tags: {
      environment: "pr",
      env: "pr",
      service: "demo",
      "pr-number": prNumber,
    },
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });
}