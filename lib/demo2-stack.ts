import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Rule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { RestApi, LambdaIntegration } from "aws-cdk-lib/aws-apigateway";

export class Demo2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const prNumber: string | undefined = process.env.PR_NUM;
    const api = new RestApi(this, "Demo2Api", {
      restApiName: `${id}-Api`,
      description: "API for Demo 2",
    });

    const dynamoTable = new cdk.aws_dynamodb.Table(this, "Demo2Table", {
      tableName: `${id}-Table`,
      partitionKey: { name: "id", type: cdk.aws_dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Only for development purposes
      billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const eventBus = new cdk.aws_events.EventBus(this, "Demo2EventBus", {
      eventBusName: `${id}-EventBus`,
    });

    const instructFunction = new NodejsFunction(this, "InstructFunction", {
      functionName: `${id}-InstructFunction`,
      runtime: Runtime.NODEJS_22_X,
      entry: "src/instruct/handler.ts",
      handler: "handler",
      environment: {
        EVENT_BUS_NAME: eventBus.eventBusName,
        DYNAMODB_TABLE_NAME: dynamoTable.tableName,
      },
    });

    api.root.addMethod("POST", new LambdaIntegration(instructFunction), {
      operationName: "Instruct",
    });

    const searchFunction = new NodejsFunction(this, "SearchFunction", {
      functionName: `${id}-SearchFunction`,
      runtime: Runtime.NODEJS_22_X,
      entry: "src/search/handler.ts",
      handler: "handler",
      environment: {
        DYNAMODB_TABLE_NAME: dynamoTable.tableName,
      },
    });

    const valuationFunction = new NodejsFunction(this, "ValuationFunction", {
      functionName: `${id}-ValuationFunction`,
      runtime: Runtime.NODEJS_22_X,
      entry: "src/valuation/handler.ts",
      handler: "handler",
      environment: {
        DYNAMODB_TABLE_NAME: dynamoTable.tableName,
      },
    });

    const statusFunction = new NodejsFunction(this, "StatusFunction", {
      functionName: `${id}-StatusFunction`,
      runtime: Runtime.NODEJS_22_X,
      entry: "src/status/handler.ts",
      handler: "handler",
      environment: {
        DYNAMODB_TABLE_NAME: dynamoTable.tableName,
      },
    });

    api.root.addMethod("GET", new LambdaIntegration(statusFunction), {
      operationName: "Status",
    });

    eventBus.grantPutEventsTo(instructFunction);

    new Rule(this, "InstructEventRule", {
      eventBus: eventBus,
      eventPattern: {
        source: [`InstructFunction`],
      },
      targets: [
        new LambdaFunction(searchFunction),
        new LambdaFunction(valuationFunction),
      ],
    });
  }
}
