import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';

interface ApiStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
  listRooms: lambda.IFunction;
  createRoom: lambda.IFunction;
  updateRoom: lambda.IFunction;
  deleteRoom: lambda.IFunction;
  listReservations: lambda.IFunction;
  createReservation: lambda.IFunction;
  updateReservation: lambda.IFunction;
  cancelReservation: lambda.IFunction;
}

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // REST APIの作成
    const api = new apigateway.RestApi(this, 'FacilityBookingApi', {
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

    const authMethodOptions: apigateway.MethodOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // /rooms エンドポイント
    const rooms = api.root.addResource('rooms');
    rooms.addMethod('GET', new apigateway.LambdaIntegration(props.listRooms), authMethodOptions);
    rooms.addMethod('POST', new apigateway.LambdaIntegration(props.createRoom), authMethodOptions);

    // /rooms/{roomId} エンドポイント
    const room = rooms.addResource('{roomId}');
    room.addMethod('PUT', new apigateway.LambdaIntegration(props.updateRoom), authMethodOptions);
    room.addMethod('DELETE', new apigateway.LambdaIntegration(props.deleteRoom), authMethodOptions);

    // /rooms/{roomId}/availability エンドポイント
    const availability = room.addResource('availability');
    availability.addMethod('GET', new apigateway.LambdaIntegration(props.listRooms), authMethodOptions);

    // /reservations エンドポイント
    const reservations = api.root.addResource('reservations');
    reservations.addMethod('GET', new apigateway.LambdaIntegration(props.listReservations), authMethodOptions);
    reservations.addMethod('POST', new apigateway.LambdaIntegration(props.createReservation), authMethodOptions);

    // /reservations/{reservationId} エンドポイント
    const reservation = reservations.addResource('{reservationId}');
    reservation.addMethod('PUT', new apigateway.LambdaIntegration(props.updateReservation), authMethodOptions);
    reservation.addMethod('DELETE', new apigateway.LambdaIntegration(props.cancelReservation), authMethodOptions);

    // APIのURLを出力
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });
  }
}
