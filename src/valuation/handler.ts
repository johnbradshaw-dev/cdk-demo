import { Context, EventBridgeEvent } from "aws-lambda";

export const handler: (
  event: EventBridgeEvent<"instruct", { request: string }>,
  context: Context
) => Promise<void> = async function (event, context) {
  context.callbackWaitsForEmptyEventLoop = false;
  const request = event.detail.request;
  console.log("Valuation Received request:", request);
};
