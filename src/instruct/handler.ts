import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    Context,
  } from "aws-lambda";
   import * as EventBridge from "aws-sdk/clients/eventbridge";
  
  export const handler: (
    event: APIGatewayProxyEvent,
    context: Context
  ) => Promise<APIGatewayProxyResult> = async function (event, context) {
    context.callbackWaitsForEmptyEventLoop = false;
    const request = JSON.parse(event.body ?? "{}");
    const res = {
      request: request,
    };
  
    //send the request to the event bus
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

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Request sent to event bus",
        request: res,
      }),
    };
  };