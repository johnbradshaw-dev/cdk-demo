import { Context, EventBridgeEvent } from "aws-lambda";
import { DocumentClient } from "aws-sdk/clients/dynamodb";

export const handler: (
  event: EventBridgeEvent<"instruct", { request: string }>,
  context: Context
) => Promise<void> = async function (event, context) {
  context.callbackWaitsForEmptyEventLoop = false;
  const request = event.detail.request;
  console.log("Search Received request:", request);
  const dynamoDb = new DocumentClient();
  await dynamoDb
    .put({
      TableName: process.env.DYNAMODB_TABLE_NAME as string,
      Item: {
        id: JSON.parse(request).id,
        eventType: "search",
        timestamp: new Date().toISOString(),
        request: request,
      },
    })
    .promise();
};
