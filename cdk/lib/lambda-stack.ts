import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';

interface LambdaStackProps extends cdk.StackProps {
  roomsTable: dynamodb.Table;
  reservationsTable: dynamodb.Table;
}

export class LambdaStack extends cdk.Stack {
  // API Gatewayと接続するためにLambda関数を外部公開
  public readonly listRooms: nodejs.NodejsFunction;
  public readonly createRoom: nodejs.NodejsFunction;
  public readonly updateRoom: nodejs.NodejsFunction;
  public readonly deleteRoom: nodejs.NodejsFunction;
  public readonly listReservations: nodejs.NodejsFunction;
  public readonly createReservation: nodejs.NodejsFunction;
  public readonly updateReservation: nodejs.NodejsFunction;
  public readonly cancelReservation: nodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    const { roomsTable, reservationsTable } = props;

    // 共通の環境変数
    const environment = {
      ROOMS_TABLE_NAME: roomsTable.tableName,
      RESERVATIONS_TABLE_NAME: reservationsTable.tableName,
    };

    // 共通のLambda設定
    const commonProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      environment,
      timeout: cdk.Duration.seconds(30),
      bundling: {
        forceDockerBundling: false,
      },
    };

    // 会議室関連Lambda
    this.listRooms = new nodejs.NodejsFunction(this, 'ListRooms', {
      ...commonProps,
      entry: path.join(__dirname, '../../lambda/rooms/list.ts'),
      handler: 'handler',
    });

    this.createRoom = new nodejs.NodejsFunction(this, 'CreateRoom', {
      ...commonProps,
      entry: path.join(__dirname, '../../lambda/rooms/create.ts'),
      handler: 'handler',
    });

    this.updateRoom = new nodejs.NodejsFunction(this, 'UpdateRoom', {
      ...commonProps,
      entry: path.join(__dirname, '../../lambda/rooms/update.ts'),
      handler: 'handler',
    });

    this.deleteRoom = new nodejs.NodejsFunction(this, 'DeleteRoom', {
      ...commonProps,
      entry: path.join(__dirname, '../../lambda/rooms/delete.ts'),
      handler: 'handler',
    });

    // 予約関連Lambda
    this.listReservations = new nodejs.NodejsFunction(this, 'ListReservations', {
      ...commonProps,
      entry: path.join(__dirname, '../../lambda/reservations/list.ts'),
      handler: 'handler',
    });

    this.createReservation = new nodejs.NodejsFunction(this, 'CreateReservation', {
      ...commonProps,
      entry: path.join(__dirname, '../../lambda/reservations/create.ts'),
      handler: 'handler',
    });

    this.updateReservation = new nodejs.NodejsFunction(this, 'UpdateReservation', {
      ...commonProps,
      entry: path.join(__dirname, '../../lambda/reservations/update.ts'),
      handler: 'handler',
    });

    this.cancelReservation = new nodejs.NodejsFunction(this, 'CancelReservation', {
      ...commonProps,
      entry: path.join(__dirname, '../../lambda/reservations/cancel.ts'),
      handler: 'handler',
    });

    // DynamoDBへのアクセス権限付与
    roomsTable.grantReadData(this.listRooms);
    roomsTable.grantReadWriteData(this.createRoom);
    roomsTable.grantReadWriteData(this.updateRoom);
    roomsTable.grantReadWriteData(this.deleteRoom);

    reservationsTable.grantReadData(this.listReservations);
    reservationsTable.grantReadWriteData(this.createReservation);
    reservationsTable.grantReadWriteData(this.updateReservation);
    reservationsTable.grantReadWriteData(this.cancelReservation);
  }
}
