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

  const id = v4(); // Generate a unique ID for the request
  const request = JSON.parse(event.body ?? "{}");
  const res = {
    id,
    request: request,
  };

  // send the request to the event bus
  const eventBridge = new EventBridge();
  await eventBridge
    .putEvents({
      Entries: [
        {
          Source: "InstructFunction",
          DetailType: "instruct",
          Detail: JSON.stringify(res),
          EventBusName: process.env.EVENT_BUS_NAME,
        },
      ],
    })
    .promise();
  // Write request to dynamodb
  const dynamoDb = new DocumentClient();
  await dynamoDb
    .put({
      TableName: process.env.DYNAMODB_TABLE_NAME as string,
      Item: {
        id: id,
        eventType: "instruct",
        timestamp: new Date().toISOString(),
        request: request,
      },
    })
    .promise();
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Request sent to event bus",
      request: res,
    }),
  };
};
