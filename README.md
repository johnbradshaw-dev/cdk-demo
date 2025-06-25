# cdk-demo

## CDK init

```
rm readme.md
nvm use 22
npx cdk init app --language typescript
```

update app to use PR number for ephemeral envs

```
const prNumber = process.env.PR_NUM || app.node.tryGetContext("prNumber");

if (!prNumber) {
  // Default stack for main branch or manual deployments
  new DemoStack(app, "DemoStack", {
    tags: {
      environment: "prod",
      env: "production",
      service: "demo",
    },
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });
} else {
  // PR-specific stack
  new DemoStack(app, `DemoStack-PR-${prNumber}`, {
    /* props specific to PR environments, potentially smaller instance sizes etc. */

    stackName: `Demo-PR-${prNumber}`, // Explicit stack name
    tags: {
      environment: "pr",
      env: "pr",
      service: "demo",
      "pr-number": prNumber,
    },
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });
}
```

## Add github actions

```
mkdir -p ./.github/actions/
touch ./.github/actions/PR-open.yml
touch ./.github/actions/PR-close.yml
```

PR-open.yml

```
name: Deploy PR CDK Stack

on:
  pull_request:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: "22"

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm t
        env:
          NODE_OPTIONS: --max-old-space-size=8192

      - name: Install AWS CDK
        run: npm install -g aws-cdk

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-west-1

      - name: Get PR number
        id: pr
        run: echo "PR_NUM=$(echo $GITHUB_REF | cut -d'/' -f3)" >> $GITHUB_ENV

      - name: Synth CDK stack
        run: cdk synth --all --require-approval never -c prNumber=$PR_NUM
        env:
          CDK_DEFAULT_REGION: eu-west-1
          CDK_DEFAULT_ACCOUNT: ${{ secrets.AWS_ACCOUNT_ID }}

      - name: Deploy CDK stack
        run: cdk deploy --all --require-approval never -c prNumber=$PR_NUM
        env:
          CDK_DEFAULT_REGION: eu-west-1
          CDK_DEFAULT_ACCOUNT: ${{ secrets.AWS_ACCOUNT_ID }}

```

PR-close.yml

```
name: Destroy PR Stack
on:
  pull_request:
    types:
      - closed

jobs:
  destroy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: "22"

      - name: Install dependencies
        run: npm install

      - name: Install AWS CDK
        run: npm install -g aws-cdk

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-west-2

      - name: Get PR number
        id: pr
        run: echo "PR_NUM=${{ github.event.number }}" >> $GITHUB_ENV

      - name: Destroy CDK stack
        run: cdk destroy --all -f -c prNumber=$PR_NUM
        env:
          CDK_DEFAULT_REGION: eu-west-2
          CDK_DEFAULT_ACCOUNT: ${{ secrets.AWS_ACCOUNT_ID }}
```

## Add functions

add deps and create file

```
touch src/instruct/handler.ts
npm i --save-dev aws-lambda
npm i --save-dev @types/aws-lambda
```

instruct/handler.ts

```
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

export const handler: (
  event: APIGatewayProxyEvent,
  context: Context
) => Promise<APIGatewayProxyResult> = async function (event, context) {
  context.callbackWaitsForEmptyEventLoop = false;
  const request = JSON.parse(event.body ?? "{}");

  const res = {
    request: request,
  };

  return {
    statusCode: 200,
    body: JSON.stringify(res),
  };
};

```

search/handler.ts

```
import { Context, EventBridgeEvent } from "aws-lambda";

export const handler: (
  event: EventBridgeEvent<"instruct", { request: string }>,
  context: Context
) => Promise<void> = async function (event, context) {
  context.callbackWaitsForEmptyEventLoop = false;
  const request = event.detail.request;
};
```

lib/demo-stack.ts

```
    const prNumber: string | undefined = process.env.PR_NUM;
    const instructFunction = new NodejsFunction(
      this,
      "InstructFunction",
      {
        functionName: `${id}-InstructFunction`,
        runtime: Runtime.NODEJS_22_X,
        entry: "src/instruct/handler.ts",
        handler: "handler",
      }
    );
```
