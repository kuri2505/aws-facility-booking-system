import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class CognitoStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ユーザープールの作成
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'FacilityBookingUserPool',
      // メールアドレスでサインイン
      signInAliases: {
        email: true,
      },
      // パスワードポリシー
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      // サインアップ時にメール確認を要求
      selfSignUpEnabled: true,
      autoVerify: {
        email: true,
      },
      // アカウント削除設定（開発環境用）
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 一般ユーザーグループの作成
    new cognito.CfnUserPoolGroup(this, 'UsersGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'Users',
      description: '一般ユーザーグループ',
    });

    // 管理者グループの作成
    new cognito.CfnUserPoolGroup(this, 'AdminsGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'Admins',
      description: '管理者グループ',
    });

    // アプリクライアントの作成
    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: 'FacilityBookingClient',
      // 認証フロー（メール・パスワードでの認証を許可）
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      // トークンの有効期限
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    // 出力（デプロイ後に確認できる情報）
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });
  }
}
