import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { v4 } from "uuid";

import { DocumentClient } from "aws-sdk/clients/dynamodb";

import EventBridge from "aws-sdk/clients/eventbridge";

export const handler: (
  event: APIGatewayProxyEvent,
  context: Context
) => Promise<APIGatewayProxyResult> = async function (event, context) {
  context.callbackWaitsForEmptyEventLoop = false;

  const request = JSON.parse(event.body ?? "{}");
  const res = {
    id: request.id,
    request: request,
    events: [] as any[],
  };

  // Write request to dynamodb
  const dynamoDb = new DocumentClient();
  const records = await dynamoDb
    .query({
      TableName: process.env.DYNAMODB_TABLE_NAME as string,
      KeyConditionExpression: "id = :id",
    })
    .promise();

  res.events = records.Items || [];
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Request sent to event bus",
      request: res,
    }),
  };
};
