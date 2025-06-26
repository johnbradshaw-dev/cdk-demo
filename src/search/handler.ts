import { Context, EventBridgeEvent } from "aws-lambda";

export const handler: (
  event: EventBridgeEvent<"instruct", { request: string }>,
  context: Context
) => Promise<void> = async function (event, context) {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log("Received event:", JSON.stringify(event, null, 2));
  const request = event.detail.request;
};