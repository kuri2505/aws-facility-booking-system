import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  try {
    const claims = event.requestContext?.authorizer?.claims;
    const userId = claims?.sub;
    const groups: string[] = claims?.['cognito:groups'] ?? [];
    const isAdmin = groups.includes('Admins');

    let result;

    if (isAdmin) {
      // 管理者は全予約を取得
      const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
      result = await docClient.send(
        new ScanCommand({
          TableName: process.env.RESERVATIONS_TABLE_NAME,
        })
      );
    } else {
      // 一般ユーザーは自分の予約のみ取得（GSI: userIndex使用）
      result = await docClient.send(
        new QueryCommand({
          TableName: process.env.RESERVATIONS_TABLE_NAME,
          IndexName: 'userIndex',
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': userId,
          },
        })
      );
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        reservations: result.Items || [],
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
        message: '予約一覧の取得に失敗しました',
      }),
    };
  }
};
