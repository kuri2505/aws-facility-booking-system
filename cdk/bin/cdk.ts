#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DynamoDbStack } from '../lib/dynamodb-stack';
import { CognitoStack } from '../lib/cognito-stack';
import { LambdaStack } from '../lib/lambda-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const dynamoDbStack = new DynamoDbStack(app, 'DynamoDbStack', { env });

const cognitoStack = new CognitoStack(app, 'CognitoStack', { env });

const lambdaStack = new LambdaStack(app, 'LambdaStack', {
  env,
  roomsTable: dynamoDbStack.roomsTable,
  reservationsTable: dynamoDbStack.reservationsTable,
});

new ApiStack(app, 'ApiStack', {
  env,
  userPool: cognitoStack.userPool,
  listRooms: lambdaStack.listRooms,
  createRoom: lambdaStack.createRoom,
  updateRoom: lambdaStack.updateRoom,
  deleteRoom: lambdaStack.deleteRoom,
  listReservations: lambdaStack.listReservations,
  createReservation: lambdaStack.createReservation,
  updateReservation: lambdaStack.updateReservation,
  cancelReservation: lambdaStack.cancelReservation,
});
