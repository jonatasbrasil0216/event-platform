import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { requireAuth } from "../../lib/auth";
import { errorResult, ok } from "../../lib/lambda";
import { getMe } from "../../services/auth";

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const auth = requireAuth(event);
    const result = await getMe(auth.userId.toString());
    return ok(result);
  } catch (err) {
    return errorResult(err);
  }
};
