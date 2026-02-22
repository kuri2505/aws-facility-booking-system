#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DynamoDbStack } from '../lib/dynamodb-stack';
import { CognitoStack } from '../lib/cognito-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const dynamoDbStack = new DynamoDbStack(app, 'DynamoDbStack', { env });

const cognitoStack = new CognitoStack(app, 'CognitoStack', { env });

new ApiStack(app, 'ApiStack', {
  env,
  userPool: cognitoStack.userPool,
});
