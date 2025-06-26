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

    const eventBus = new cdk.aws_events.EventBus(this, `${id}-EventBus`, {
      eventBusName: 'DemoEventBus',
    });

    const postLamdba = new cdk.aws_lambda_nodejs.NodejsFunction(this, `${id}-PostLambda`, {
      runtime: cdk.aws_lambda.Runtime.NODEJS_22_X,
      entry: "src/instruct/handler.ts",
      handler: "handler",
      environment: {
        EVENT_BUS_NAME: eventBus.eventBusName,
      },
    });

    eventBus.grantPutEventsTo(postLamdba);

    const listenLambda = new cdk.aws_lambda_nodejs.NodejsFunction(this, `${id}-SearchLambda`, {
      runtime: cdk.aws_lambda.Runtime.NODEJS_22_X,
      entry: "src/search/handler.ts",
      handler: "handler",
      environment: {
        EVENT_BUS_NAME: eventBus.eventBusName,
      },
    });
    
    const postEndpoint = api.root.addMethod('POST', new cdk.aws_apigateway.LambdaIntegration(postLamdba));


    


  }

}
