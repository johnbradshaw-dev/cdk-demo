import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    

    const api = new cdk.aws_apigateway.RestApi(this, `${id}-DemoApi`, {
      restApiName: 'Demo Service',
      description: 'This service serves demo purposes.',
    });

    const postLamdba = new cdk.aws_lambda_nodejs.NodejsFunction(this, `${id}-PostLambda`, {
      runtime: cdk.aws_lambda.Runtime.NODEJS_22_X,
      entry: "src/instruct/handler.ts",
      handler: "handler",
    });
    
    const postEndpoint = api.root.addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(postLamdba));
  }

}
