import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  try {
    const userId = event.requestContext?.authorizer?.claims?.sub;
    const body = JSON.parse(event.body);
    const { roomId, date, startTime, endTime } = body;

    // 同じ会議室・同じ日時に予約が重複していないかチェック
    const existing = await docClient.send(
      new QueryCommand({
        TableName: process.env.RESERVATIONS_TABLE_NAME,
        IndexName: 'roomDateIndex',
        KeyConditionExpression: 'roomIdDate = :roomIdDate',
        ExpressionAttributeValues: {
          ':roomIdDate': `${roomId}#${date}`,
        },
      })
    );

    const isOverlapping = (existing.Items || []).some((item) => {
      return startTime < item.endTime && endTime > item.startTime;
    });

    if (isOverlapping) {
      return {
        statusCode: 409,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: '指定の時間帯はすでに予約されています',
        }),
      };
    }

    const reservationId = `rsv-${randomUUID()}`;

    await docClient.send(
      new PutCommand({
        TableName: process.env.RESERVATIONS_TABLE_NAME,
        Item: {
          reservationId,
          roomIdDate: `${roomId}#${date}`,
          userId,
          roomId,
          date,
          startTime,
          endTime,
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
        },
      })
    );

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: '予約を作成しました',
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
        message: '予約の作成に失敗しました',
      }),
    };
  }
};
