import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { getDb } from "../../db/client";
import { errorResult, ok } from "../../lib/lambda";

export const handler = async (_event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    await getDb();
    return ok({ ok: true });
  } catch (err) {
    return errorResult(err);
  }
};
