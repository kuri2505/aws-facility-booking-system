import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  try {
    // 管理者のみ実行可能かチェック
    const groups: string[] =
      event.requestContext?.authorizer?.claims['cognito:groups'] ?? [];
    if (!groups.includes('Admins')) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: '管理者のみ実行できます',
        }),
      };
    }

    const body = JSON.parse(event.body);
    const roomId = `room-${randomUUID()}`;

    await docClient.send(
      new PutCommand({
        TableName: process.env.ROOMS_TABLE_NAME,
        Item: {
          roomId,
          name: body.name,
          capacity: body.capacity,
          location: body.location,
          facilities: body.facilities ?? [],
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
        message: '会議室を作成しました',
        roomId,
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
        message: '会議室の作成に失敗しました',
      }),
    };
  }
};
