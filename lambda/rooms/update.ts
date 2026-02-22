import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

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

    const roomId = event.pathParameters?.roomId;
    const body = JSON.parse(event.body);

    await docClient.send(
      new UpdateCommand({
        TableName: process.env.ROOMS_TABLE_NAME,
        Key: { roomId },
        UpdateExpression:
          'SET #name = :name, capacity = :capacity, #location = :location, facilities = :facilities, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#location': 'location',
        },
        ExpressionAttributeValues: {
          ':name': body.name,
          ':capacity': body.capacity,
          ':location': body.location,
          ':facilities': body.facilities ?? [],
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
        message: '会議室を更新しました',
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
        message: '会議室の更新に失敗しました',
      }),
    };
  }
};
