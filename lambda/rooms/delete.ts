import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';

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

    await docClient.send(
      new DeleteCommand({
        TableName: process.env.ROOMS_TABLE_NAME,
        Key: { roomId },
      })
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: '会議室を削除しました',
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
        message: '会議室の削除に失敗しました',
      }),
    };
  }
};
