import * as cdk from 'aws-cdk-lib';
import { AuthorizationType } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CognitoAuthorizerByCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ユーザープールの作成
    const userPool = new cdk.aws_cognito.UserPool(this, 'UserPool', {
      userPoolName: 'm2m-auth-sample-domain'
    });

    userPool.addDomain('M2MAuthCognitoDomain', {
      cognitoDomain: {
        domainPrefix: 'm2m-auth-sample-domain'
      }
    })

    const resourceServerId = 'example.com';
    const scopeName = 'read';
    const readScope = new cdk.aws_cognito.ResourceServerScope({
      scopeName: scopeName,
      scopeDescription: 'Read access to the resource',
    });

    userPool.addResourceServer('M2MAuthResoureServer', {
      identifier: resourceServerId,
      scopes: [readScope]
    })

    const scopeId = `${resourceServerId}/${scopeName}`;
    userPool.addClient('M2MAuthClient', {
      userPoolClientName: 'M2MAuthClient',
      generateSecret: true,
      oAuth: {
        flows: {
          clientCredentials: true,
        },
        scopes: [
          {
            scopeName: scopeId,
          },
        ],
      },
    });

    const lambdaFunc = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'lambdaFunc')

    // const cognitoAuthorizer = new cdk.aws_apigateway.CognitoUserPoolsAuthorizer(this, 'tokenAuthorizer', {
    //   cognitoUserPools: [userPool]
    // })

    const api = new cdk.aws_apigateway.RestApi(this, 'restApi');

    const authorizer = new cdk.aws_apigateway.CfnAuthorizer(this, 'M2MAuthorizer', {
      name: 'CognitoAuthorizer',
      restApiId: api.restApiId,
      type: AuthorizationType.COGNITO,
      identitySource: 'method.request.header.Authorization',
      providerArns: [userPool.userPoolArn]
    })

    api.root.addResource('data').addMethod('GET', new cdk.aws_apigateway.LambdaIntegration(lambdaFunc),
      {
        authorizationScopes: [scopeId],
        authorizer: {
          authorizationType: cdk.aws_apigateway.AuthorizationType.COGNITO,
          authorizerId: authorizer.ref,
        }
      })
  }
}
