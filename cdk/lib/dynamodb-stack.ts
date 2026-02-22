import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class DynamoDbStack extends cdk.Stack {
  public readonly roomsTable: dynamodb.Table;
  public readonly reservationsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 会議室テーブル
    this.roomsTable = new dynamodb.Table(this, 'RoomsTable', {
      tableName: 'Rooms',
      partitionKey: {
        name: 'roomId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // 開発環境用
    });

    // 予約テーブル
    this.reservationsTable = new dynamodb.Table(this, 'ReservationsTable', {
      tableName: 'Reservations',
      partitionKey: {
        name: 'reservationId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'roomIdDate',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // 開発環境用
    });

    // GSI: ユーザーの予約履歴取得用
    this.reservationsTable.addGlobalSecondaryIndex({
      indexName: 'userIndex',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // GSI: 特定会議室・特定日の予約一覧取得用
    this.reservationsTable.addGlobalSecondaryIndex({
      indexName: 'roomDateIndex',
      partitionKey: {
        name: 'roomIdDate',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'startTime',
        type: dynamodb.AttributeType.STRING,
      },
    });
  }
}
