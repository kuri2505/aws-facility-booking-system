import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';

interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // REST APIの作成
    this.api = new apigateway.RestApi(this, 'FacilityBookingApi', {
      restApiName: 'FacilityBookingApi',
      description: '施設・会議室予約管理システムAPI',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Cognitoオーソライザーの作成
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      'CognitoAuthorizer',
      {
        cognitoUserPools: [props.userPool],
        authorizerName: 'CognitoAuthorizer',
      }
    );

    // 認証が必要なメソッドのデフォルト設定
    const authMethodOptions: apigateway.MethodOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // /rooms エンドポイント
    const rooms = this.api.root.addResource('rooms');
    rooms.addMethod('GET', new apigateway.MockIntegration({
      integrationResponses: [{ statusCode: '200' }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: { 'application/json': '{"statusCode": 200}' },
    }), authMethodOptions);
    rooms.addMethod('POST', new apigateway.MockIntegration({
      integrationResponses: [{ statusCode: '200' }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: { 'application/json': '{"statusCode": 200}' },
    }), authMethodOptions);

    // /rooms/{roomId} エンドポイント
    const room = rooms.addResource('{roomId}');
    room.addMethod('PUT', new apigateway.MockIntegration({
      integrationResponses: [{ statusCode: '200' }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: { 'application/json': '{"statusCode": 200}' },
    }), authMethodOptions);
    room.addMethod('DELETE', new apigateway.MockIntegration({
      integrationResponses: [{ statusCode: '200' }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: { 'application/json': '{"statusCode": 200}' },
    }), authMethodOptions);

    // /rooms/{roomId}/availability エンドポイント
    const availability = room.addResource('availability');
    availability.addMethod('GET', new apigateway.MockIntegration({
      integrationResponses: [{ statusCode: '200' }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: { 'application/json': '{"statusCode": 200}' },
    }), authMethodOptions);

    // /reservations エンドポイント
    const reservations = this.api.root.addResource('reservations');
    reservations.addMethod('GET', new apigateway.MockIntegration({
      integrationResponses: [{ statusCode: '200' }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: { 'application/json': '{"statusCode": 200}' },
    }), authMethodOptions);
    reservations.addMethod('POST', new apigateway.MockIntegration({
      integrationResponses: [{ statusCode: '200' }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: { 'application/json': '{"statusCode": 200}' },
    }), authMethodOptions);

    // /reservations/{reservationId} エンドポイント
    const reservation = reservations.addResource('{reservationId}');
    reservation.addMethod('PUT', new apigateway.MockIntegration({
      integrationResponses: [{ statusCode: '200' }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: { 'application/json': '{"statusCode": 200}' },
    }), authMethodOptions);
    reservation.addMethod('DELETE', new apigateway.MockIntegration({
      integrationResponses: [{ statusCode: '200' }],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: { 'application/json': '{"statusCode": 200}' },
    }), authMethodOptions);

    // APIのURLを出力
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
    });
  }
}
