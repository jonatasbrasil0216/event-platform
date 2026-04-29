import { getDb } from "../db/client";

interface LambdaContext {
  callbackWaitsForEmptyEventLoop: boolean;
}

export const handler = async (_event: unknown, context: LambdaContext) => {
  context.callbackWaitsForEmptyEventLoop = false;
  await getDb();

  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ ok: true })
  };
};
