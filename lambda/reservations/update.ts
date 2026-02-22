import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  try {
    const userId = event.requestContext?.authorizer?.claims?.sub;
    const groups: string[] =
      event.requestContext?.authorizer?.claims?.['cognito:groups'] ?? [];
    const isAdmin = groups.includes('Admins');
    const reservationId = event.pathParameters?.reservationId;
    const body = JSON.parse(event.body);

    // 既存の予約を取得
    const existing = await docClient.send(
      new GetCommand({
        TableName: process.env.RESERVATIONS_TABLE_NAME,
        Key: { reservationId },
      })
    );

    if (!existing.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: '予約が見つかりません',
        }),
      };
    }

    // 自分の予約かどうかチェック（管理者は全予約を変更可能）
    if (!isAdmin && existing.Item.userId !== userId) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: '他のユーザーの予約は変更できません',
        }),
      };
    }

    await docClient.send(
      new UpdateCommand({
        TableName: process.env.RESERVATIONS_TABLE_NAME,
        Key: { reservationId },
        UpdateExpression:
          'SET startTime = :startTime, endTime = :endTime, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':startTime': body.startTime,
          ':endTime': body.endTime,
          ':updatedAt': new Date().toISOString(),
        },
      })
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: '予約を変更しました',
        reservationId,
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: '予約の変更に失敗しました',
      }),
    };
  }
};

